// Firebase Auth and Firestore references are from firebase-config.js

// ID для вашей уникальной коллекции (чтобы сохранить ваши данные отдельно)
const MY_USER_DOC_ID = 'yliaUniqueDoc';

// DOM elements
const loginSection = document.getElementById('loginSection');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

function showLogin(show) {
  loginSection.style.display = show ? 'block' : 'none';
  app.style.display = show ? 'none' : 'block';
}

// Авторизация пользователя, показываем либо приложение, либо форму логина
auth.onAuthStateChanged(async (user) => {
  if (user) {
    showLogin(false);
    // Загрузка пользовательских данных
    loadUserData(user);
  } else {
    showLogin(true);
  }
});

// Вход по email и паролю
loginBtn.onclick = () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => loginError.textContent = err.message);
};

// Регистрация нового пользователя
registerBtn.onclick = () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      // Инициализируем пустую таблицу (документ) для нового пользователя
      await db.collection('contentPlanner').doc(user.uid).set({
        initialized: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .catch(err => loginError.textContent = err.message);
};

// Вход через Google
googleBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  auth.signInWithPopup(provider)
    .catch(err => loginError.textContent = err.message);
};

// Выход
logoutBtn.onclick = () => {
  auth.signOut();
};

// Загрузка или создание данных пользователя
async function loadUserData(user) {
  const userDocId = user.email === 'ylia.alei@gmail.com' ? MY_USER_DOC_ID : user.uid;
  const docRef = db.collection('contentPlanner').doc(userDocId);

  const doc = await docRef.get();
  if (!doc.exists) {
    // Если данных нет, создаем пустой документ
    await docRef.set({
      initialized: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Можно инициализировать UI пустыми данными
  }
  // Загрузите данные в UI или выполните другие действия
  const data = doc.data();
  console.log('Loaded user data:', data);
  // TODO: реализация загрузки данных в ваш UI календаря, редактора и т.п.
}

// Пример функции сохранения данных, привязанной к текущему пользователю
async function saveUserData(data) {
  const user = auth.currentUser;
  if (!user) return alert('Необходимо войти в систему');
  
  const userDocId = user.email === 'ylia.alei@gmail.com' ? MY_USER_DOC_ID : user.uid;
  const docRef = db.collection('contentPlanner').doc(userDocId);

  await docRef.set(data, { merge: true });
  console.log('Данные сохранены');
}

// Ваша логика приложения по работе с календарем, редактором, сохранением данных и т.п.
// Здесь нужно доработать ваш существующий script-1.js по этим принципам,
// чтобы сохранять/загружать данные через saveUserData и loadUserData.

