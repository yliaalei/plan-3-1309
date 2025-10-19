// --- Авторизация ---
auth.onAuthStateChanged(user => {
  const loginSection = document.getElementById('loginSection');
  const app = document.getElementById('app');

  if (user) {
    loginSection.style.display = 'none';
    app.style.display = 'block';
  } else {
    loginSection.style.display = 'block';
    app.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const googleBtn = document.getElementById('googleBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  // Вход через Email/Password
  loginBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
      loginError.textContent = "Введите email и пароль";
      loginError.style.color = 'red';
      return;
    }

    auth.signInWithEmailAndPassword(email, pass)
      .then(() => loginError.textContent = "")
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
      });
  };

  // Регистрация через Email/Password
  registerBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
      loginError.textContent = "Введите email и пароль";
      loginError.style.color = 'red';
      return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
      .then(userCredential => {
        loginError.textContent = "Регистрация успешна! Вы вошли как: " + userCredential.user.email;
        loginError.style.color = 'green';
      })
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
      });
  };

  // Вход через Google
  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider)
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
        console.error("Google login error:", err);
      });
  };

  // Выход
  logoutBtn.onclick = () => auth.signOut();

  // --- Инициализация приложения (календарь + Quill) ---
  initApp();
});

function initApp() {
  const colorMap = { free:'#fff', family:'#c8f7e8', health:'#fff7c2', work:'#ffd7ea', hobby:'#e8e1ff' };
  let selectedDateKey = null, selectedType = null;
  let currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear();
  let quill = null;

  const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  function pad(n){ return String(n).padStart(2,'0'); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ 
    const [y,m,d]=key.split('-').map(Number); 
    return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});
  }

  // Календарь
  function renderWeekdays() {
    const wd = document.getElementById('weekdays');
    wd.innerHTML = '';
    weekdays.forEach(d => {
      const div = document.createElement('div');
      div.textContent = d;
      wd.appendChild(div);
    });
  }

  function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';
    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear,currentMonth,1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);

    for(let i=0; i<leading; i++){
      const e = document.createElement('div');
      e.className = 'day-cell empty';
      cal.appendChild(e);
    }

    const daysInMonth = new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = makeDateKey(currentYear,currentMonth,d);
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.dataset.date = key;
      const num = document.createElement('div');
      num.className = 'day-number';
      num.textContent = d;
      cell.appendChild(num);
      cell.style.backgroundColor = colorMap.free;
      cell.onclick = () => openMenuForDate(key);
      loadDataForCell(key, cell);
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    document.getElementById('menuDateTitle').textContent = formatReadable(key);
    document.getElementById('menu').classList.add('active');
  }

  function closeMenu(){
    document.getElementById('menu').classList.remove('active');
  }

  // Привязки кнопок
  document.getElementById('prevBtn').onclick = () => { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); };
  document.getElementById('nextBtn').onclick = () => { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); };
  document.getElementById('menuClose').onclick = closeMenu;

  renderWeekdays();
  renderCalendar();

  function loadDataForCell(key, cell){
    db.collection('contentPlanner').doc(key).get().then(doc => {
      if(doc.exists){
        const c = doc.data().temaColor || 'free';
        cell.style.backgroundColor = colorMap[c] || colorMap.free;
      }
    });
  }
}
