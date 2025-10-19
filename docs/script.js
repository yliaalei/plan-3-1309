// Ожидание полной загрузки DOM перед доступом к элементам
document.addEventListener('DOMContentLoaded', () => {
  // Ссылки на элементы DOM
  const elements = {
    authSection: document.getElementById('authSection'),
    appSection: document.getElementById('app'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    googleBtn: document.getElementById('googleBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authError: document.getElementById('authError'),
    showSignup: document.getElementById('showSignup'),
    showLogin: document.getElementById('showLogin'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm')
  };

  // Проверка наличия всех необходимых элементов
  const missingElements = Object.entries(elements)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  if (missingElements.length > 0) {
    console.error(`Ошибка: следующие элементы DOM не найдены: ${missingElements.join(', ')}. Проверьте ID в HTML.`);
    return;
  }

  // Обработка изменения состояния аутентификации
  auth.onAuthStateChanged(user => {
    if (user) {
      elements.authSection.style.display = 'none';
      elements.appSection.style.display = 'block';
      initApp(user);
    } else {
      elements.authSection.style.display = 'block';
      elements.appSection.style.display = 'none';
    }
  });

  // Переключение между формами входа и регистрации
  elements.showSignup.onclick = () => {
    elements.loginForm.style.display = 'none';
    elements.signupForm.style.display = 'block';
    elements.authError.textContent = '';
  };

  elements.showLogin.onclick = () => {
    elements.signupForm.style.display = 'none';
    elements.loginForm.style.display = 'block';
    elements.authError.textContent = '';
  };

  // Вход по email и паролю
  elements.loginBtn.onclick = () => {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPass')?.value;
    if (!email || !password) {
      elements.authError.textContent = 'Пожалуйста, введите email и пароль';
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .catch(err => {
        console.error('Ошибка входа:', err);
        elements.authError.textContent = err.message;
      });
  };

  // Регистрация нового пользователя
  elements.signupBtn.onclick = () => {
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPass')?.value;
    if (!email || !password) {
      elements.authError.textContent = 'Пожалуйста, введите email и пароль';
      return;
    }
    auth.createUserWithEmailAndPassword(email, password)
      .catch(err => {
        console.error('Ошибка регистрации:', err);
        elements.authError.textContent = err.message;
      });
  };

  // Вход через Google
  elements.googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider)
      .catch(err => {
        console.error('Ошибка входа через Google:', err);
        elements.authError.textContent = err.message;
      });
  };

  // Выход из учетной записи
  elements.logoutBtn.onclick = () => auth.signOut();
});

// Основная логика приложения
function initApp(user) {
  // Константы
  const colorMap = {
    free: '#fff',
    family: '#c8f7e8',
    health: '#fff7c2',
    work: '#ffd7ea',
    hobby: '#e8e1ff'
  };
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Состояние приложения
  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;
  let temaTimer = null;
  let editorTimer = null;

  // Вспомогательные функции
  const pad = n => String(n).padStart(2, '0');
  const makeDateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const formatReadable = key => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Получение коллекции данных пользователя в Firestore
  const getUserContentCollection = () => db.collection('users').doc(user.uid).collection('contentPlanner');

  // Настройка обработчиков событий
  const setupEventListeners = () => {
    const elements = {
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      menuClose: document.getElementById('menuClose'),
      btnTema: document.getElementById('btnTema'),
      btnStories: document.getElementById('btnStories'),
      btnPost: document.getElementById('btnPost'),
      btnReel: document.getElementById('btnReel'),
      temaBack: document.getElementById('temaBack'),
      editorBack: document.getElementById('editorBack'),
      copyBtn: document.getElementById('copyBtn')
    };

    const missingElements = Object.entries(elements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    if (missingElements.length > 0) {
      console.error(`Ошибка: следующие элементы календаря не найдены: ${missingElements.join(', ')}. Проверьте ID в HTML.`);
      return;
    }

    elements.prevBtn.onclick = () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    };

    elements.nextBtn.onclick = () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    };

    elements.menuClose.onclick = closeMenu;
    elements.btnTema.onclick = showTema;
    elements.btnStories.onclick = () => showEditor('stories');
    elements.btnPost.onclick = () => showEditor('post');
    elements.btnReel.onclick = () => showEditor('reel');
    elements.temaBack.onclick = () => hidePanel('temaPage');
    elements.editorBack.onclick = () => hidePanel('editorPage');
    elements.copyBtn.onclick = copyEditorText;

    ['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.oninput = saveTemaDebounced;
      else console.error(`Элемент с ID ${id} не найден`);
    });

    document.querySelectorAll('input[name="temaColor"]').forEach(radio => {
      radio.onchange = saveTema;
    });
  };

  // Отрисовка дней недели
  const renderWeekdays = () => {
    const weekdaysContainer = document.getElementById('weekdays');
    if (!weekdaysContainer) {
      console.error('Контейнер для дней недели не найден');
      return;
    }
    weekdaysContainer.innerHTML = '';
    weekdays.forEach(day => {
      const div = document.createElement('div');
      div.textContent = day;
      weekdaysContainer.appendChild(div);
    });
  };

  // Отрисовка календаря
  const renderCalendar = () => {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    if (!calendar || !monthYear) {
      console.error('Календарь или элемент monthYear не найдены');
      return;
    }
    calendar.innerHTML = '';
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leadingDays = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < leadingDays; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell empty';
      calendar.appendChild(emptyCell);
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = makeDateKey(currentYear, currentMonth, day);
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.dataset.date = dateKey;

      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = day;
      cell.appendChild(dayNumber);

      cell.style.backgroundColor = colorMap.free;
      cell.onclick = () => openMenuForDate(dateKey);
      loadDataForCell(dateKey, cell);
      calendar.appendChild(cell);
    }
  };

  // Управление меню и панелями
  const openMenuForDate = dateKey => {
    selectedDateKey = dateKey;
    const menuDateTitle = document.getElementById('menuDateTitle');
    if (menuDateTitle) menuDateTitle.textContent = formatReadable(dateKey);
    showMenu();
  };

  const showMenu = () => {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.add('active');
  };

  const closeMenu = () => {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.remove('active');
  };

  const showPanel = panelId => {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
  };

  const hidePanel = panelId => {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.remove('active');
  };

  const showTema = () => {
    closeMenu();
    selectedType = 'tema';
    const temaDateTitle = document.getElementById('temaDateTitle');
    if (temaDateTitle) temaDateTitle.textContent = formatReadable(selectedDateKey);
    showPanel('temaPage');
    loadTemaData(selectedDateKey);
  };

  const showEditor = type => {
    closeMenu();
    selectedType = type;
    const editorDateTitle = document.getElementById('editorDateTitle');
    const editorTypeLabel = document.getElementById('editorTypeLabel');
    if (editorDateTitle) editorDateTitle.textContent = formatReadable(selectedDateKey);
    if (editorTypeLabel) editorTypeLabel.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    showPanel('editorPage');

    if (!quill) {
      const editorText = document.getElementById('editorText');
      if (!editorText) {
        console.error('Элемент editorText не найден');
        return;
      }
      quill = new Quill('#editorText', {
        theme: 'snow',
        modules: { toolbar: '#editorToolbar' }
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
    loadEditorData(selectedDateKey, type);
  };

  // Загрузка и сохранение данных
  const loadDataForCell = (dateKey, cell) => {
    getUserContentCollection().doc(dateKey).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const color = data.temaColor || 'free';
        cell.style.backgroundColor = colorMap[color] || colorMap.free;
      }
    }).catch(err => console.error('Ошибка загрузки данных ячейки:', err));
  };

  const loadTemaData = dateKey => {
    ['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    document.querySelectorAll('input[name="temaColor"]').forEach(radio => {
      radio.checked = false;
    });

    getUserContentCollection().doc(dateKey).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data.tema) document.getElementById('tema_tema').value = data.tema;
        if (data.goal) document.getElementById('tema_goal').value = data.goal;
        if (data.activity) document.getElementById('tema_activity').value = data.activity;
        const color = data.temaColor || 'free';
        const radio = document.querySelector(`input[name="temaColor"][value="${color}"]`);
        if (radio) radio.checked = true;
      }
    }).catch(err => console.error('Ошибка загрузки данных темы:', err));
  };

  const saveTema = () => {
    if (!selectedDateKey || !user) return;

    const tema = document.getElementById('tema_tema')?.value || '';
    const goal = document.getElementById('tema_goal')?.value || '';
    const activity = document.getElementById('tema_activity')?.value || '';
    const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || 'free';

    getUserContentCollection().doc(selectedDateKey).set({
      tema,
      goal,
      activity,
      temaColor
    }, { merge: true }).catch(err => console.error('Ошибка сохранения темы:', err));

    updateCellColor(selectedDateKey, temaColor);
  };

  const saveTemaDebounced = () => {
    clearTimeout(temaTimer);
    temaTimer = setTimeout(saveTema, 500);
  };

  const updateCellColor = (dateKey, color) => {
    const cell = document.querySelector(`.day-cell[data-date="${dateKey}"]`);
    if (cell) cell.style.backgroundColor = colorMap[color] || colorMap.free;
  };

  const loadEditorData = (dateKey, type) => {
    if (!quill) return;
    quill.setContents([]);
    getUserContentCollection().doc(dateKey).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data[type]) quill.root.innerHTML = data[type];
      }
    }).catch(err => console.error('Ошибка загрузки данных редактора:', err));
  };

  const saveEditor = () => {
    if (!selectedDateKey || !selectedType || !quill || !user) return;
    const value = quill.root.innerHTML;
    getUserContentCollection().doc(selectedDateKey).set({
      [selectedType]: value
    }, { merge: true }).catch(err => console.error('Ошибка сохранения редактора:', err));
  };

  const saveEditorDebounced = () => {
    clearTimeout(editorTimer);
    editorTimer = setTimeout(saveEditor, 700);
  };

  const copyEditorText = () => {
    if (!quill) return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(() => {
      const copyBtn = document.getElementById('copyBtn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => { copyBtn.textContent = originalText; }, 1000);
      }
    }).catch(err => console.error('Ошибка копирования текста:', err));
  };

  const showImageTooltip = img => {
    const tooltip = document.getElementById('imageTooltip');
    if (!tooltip) return;
    const rect = img.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    tooltip.style
