const MY_USER_DOC_ID = 'yliaUniqueDoc'; // уникальный ID для хранения ваших данных

// DOM элементы
const loginSection = document.getElementById('loginSection');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

let selectedDateKey = null;
let selectedType = null;
let quill = null;

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const colorMap = {
  free: '#fff',
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Отображение панели логина или приложения
function showLogin(show) {
  loginSection.style.display = show ? 'block' : 'none';
  app.style.display = show ? 'none' : 'block';
}

// Авторизация с наблюдением состояния
auth.onAuthStateChanged(async user => {
  if (user) {
    showLogin(false);
    await loadUserData(user);
    renderWeekdays();
    renderCalendar();
    initEditor();
  } else {
    showLogin(true);
  }
});

// Вход по email и паролю
loginBtn.onclick = () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  loginError.textContent = '';

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => loginError.textContent = err.message);
};

// Регистрация
registerBtn.onclick = () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  loginError.textContent = '';

  auth.createUserWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      // Создаем пустую коллекцию для нового пользователя
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

// Формирование ключа даты
function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2, '0')}`;
}

// Отрисовка названий дней недели
function renderWeekdays() {
  const wd = document.getElementById('weekdays');
  wd.innerHTML = '';
  weekdays.forEach(day => {
    const div = document.createElement('div');
    div.textContent = day;
    wd.appendChild(div);
  });
}

// Отрисовка календаря
function renderCalendar() {
  const cal = document.getElementById('calendar');
  cal.innerHTML = '';
  document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // Первый день месяца (число для отображения)
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Сдвигаем для Пн в начало недели
  firstDay = firstDay === 0 ? 7 : firstDay;

  // Заполнение пустыми ячейками до первого дня
  for (let i=1; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    cal.appendChild(emptyCell);
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const key = makeDateKey(currentYear, currentMonth, d);
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.datekey = key;

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    cell.appendChild(num);

    cell.style.backgroundColor = colorMap.free;

    cell.onclick = () => {
      openMenuForDate(key);
    };
    cal.appendChild(cell);
  }
}

// Кнопки перехода по месяцам
document.getElementById('prevBtn').onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
};
document.getElementById('nextBtn').onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
};

// Открытие меню выбора действия для даты
function openMenuForDate(key) {
  selectedDateKey = key;
  document.getElementById('menuDateTitle').textContent = key;
  showMenu();
}

// Показать/скрыть меню
function showMenu() {
  document.getElementById('menu').classList.add('active');
}
function closeMenu() {
  document.getElementById('menu').classList.remove('active');
}
document.getElementById('menuClose').onclick = () => closeMenu();

// Инициализация редактора Quill
function initEditor() {
  if (!quill) {
    quill = new Quill('#editorText', {
      theme: 'snow',
      modules: {
        toolbar: '#editorToolbar'
      }
    });

    quill.root.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        window.open(e.target.href, '_blank');
      }
      if (e.target.tagName === 'IMG') {
        showImageTooltip(e.target);
      }
    });

    quill.on('text-change', saveEditorDebounced);
  }
}

// Загружаем данные пользователя из Firestore
async function loadUserData(user) {
  const docId = user.email === 'ylia.alei@gmail.com' ? MY_USER_DOC_ID : user.uid;
  const docRef = db.collection('contentPlanner').doc(docId);
  const doc = await docRef.get();
  if (!doc.exists) {
    await docRef.set({ initialized: true });
  }
  // Можно позже добавить загрузку конкретных данных в UI
  await updateCalendarColors(doc.data());
}

// Обновление цветов ячеек календаря по сохраненным темам
async function updateCalendarColors(data) {
  if (!data) return;
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key].temaColor) {
      const el = document.querySelector(`.day-cell[data-datekey="${key}"]`);
      if (el) {
        el.style.backgroundColor = colorMap[data[key].temaColor] || colorMap.free;
      }
    }
  }
}

// Сохраняем тему для выбранной даты
async function saveTema() {
  const user = auth.currentUser;
  if (!selectedDateKey || !user) return alert('Необходимо войти и выбрать дату');
  if(user.email !== 'ylia.alei@gmail.com') alert('Доступ разрешен только владельцу данных.');
  const tema = document.getElementById('tematema').value;
  const goal = document.getElementById('temagoal').value;
  const activity = document.getElementById('temaactivity').value;
  const temaColor = document.querySelector('input[name="temaColor"]:checked').value;

  const docId = user.email === 'ylia.alei@gmail.com' ? MY_USER_DOC_ID : user.uid;
  const docRef = db.collection('contentPlanner').doc(docId);
  const updateObj = {};
  updateObj[selectedDateKey] = { tema, goal, activity, temaColor };

  await docRef.set(updateObj, { merge: true });
  closeTema();
  renderCalendar();
}

let temaSaveTimeout;
function saveTemaDebounced() {
  clearTimeout(temaSaveTimeout);
  temaSaveTimeout = setTimeout(saveTema, 500);
}

// Открытие панели "Тема"
function showTema() {
  closeMenu();
  selectedType = 'tema';
  document.getElementById('temaDateTitle').textContent = selectedDateKey;
  document.getElementById('temaPage').classList.add('active');
  loadTemaData(selectedDateKey);
}

// Закрытие панели "Тема"
function closeTema() {
  document.getElementById('temaPage').classList.remove('active');
}

// Загрузка темы для выбранной даты
async function loadTemaData(dateKey) {
  const user = auth.currentUser;
  if (!user) return;
  const docId = user.email === 'ylia.alei@gmail.com' ? MY_USER_DOC_ID : user.uid;
  const docRef = db.collection('contentPlanner').doc(docId);
  const doc = await docRef.get();
  if (!doc.exists) return;

  const dayData = doc.data()[dateKey] || {};
  document.getElementById('tematema').value = dayData.tema || '';
  document.getElementById('temagoal').value = dayData.goal || '';
  document.getElementById('temaactivity').value = dayData.activity || '';
  if(dayData.temaColor) {
    const radio = document.querySelector(`input[name="temaColor"][value="${dayData.temaColor}"]`);
    if(radio) radio.checked = true;
  }
}

// Обработчики кнопок меню
document.getElementById('btnTema').onclick = () => showTema();

document.getElementById('temaBack').onclick = () => closeTema();

document.querySelectorAll('input[name="temaColor"]').forEach(input => {
  input.onchange = saveTemaDebounced;
});
document.getElementById('tematema').oninput = saveTemaDebounced;
document.getElementById('temagoal').oninput = saveTemaDebounced;
document.getElementById('temaactivity').oninput = saveTemaDebounced;

// TODO: Реализовать остальные панели editorPage: Stories, Post, Reel с аналогичной логикой

// События выхода
logoutBtn.onclick = () => auth.signOut();

// Инициализация календаря и т.п. при загрузке
window.onload = () => {
  renderWeekdays();
  renderCalendar();
};

// Подсказка картинки (пример)
const tooltip = document.getElementById('imageTooltip');
function showImageTooltip(img) {
  const rect = img.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
  tooltip.style.display = 'block';

  tooltip.onclick = () => {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = img.src;
    document.body.appendChild(link);
    link.click();
    link.remove();
    tooltip.style.display = 'none';
  };
}

document.addEventListener('click', e => {
  if (!e.target.closest('img')) {
    tooltip.style.display = 'none';
  }
});
