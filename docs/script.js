// Authentication Handling
auth.onAuthStateChanged(user => {
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('app');

  if (user) {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    initApp(user);
  } else {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
  }
});

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Element References
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const googleBtn = document.getElementById('googleBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authError = document.getElementById('authError');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Toggle between login and signup forms
  showSignup.onclick = () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authError.textContent = '';
  };

  showLogin.onclick = () => {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authError.textContent = '';
  };

  // Login with email and password
  loginBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    auth.signInWithEmailAndPassword(email, password).catch(err => {
      authError.textContent = err.message;
    });
  };

  // Sign up with email and password
  signupBtn.onclick = () => {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPass').value;
    auth.createUserWithEmailAndPassword(email, password).catch(err => {
      authError.textContent = err.message;
    });
  };

  // Google Sign-In
  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider).catch(err => {
      authError.textContent = err.message;
    });
  };

  // Logout
  logoutBtn.onclick = () => auth.signOut();
});

// Main Application Logic
function initApp(user) {
  // Constants and State
  const colorMap = {
    free: '#fff',
    family: '#c8f7e8',
    health: '#fff7c2',
    work: '#ffd7ea',
    hobby: '#e8e1ff'
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;
  let temaTimer = null;
  let editorTimer = null;

  // Utility Functions
  const pad = n => String(n).padStart(2, '0');
  const makeDateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const formatReadable = key => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Firebase User-Specific Collection
  const getUserContentCollection = () => db.collection('users').doc(user.uid).collection('contentPlanner');

  // Event Listeners for Navigation and Actions
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

  document.getElementById('menuClose').onclick = closeMenu;
  document.getElementById('btnTema').onclick = showTema;
  document.getElementById('btnStories').onclick = () => showEditor('stories');
  document.getElementById('btnPost').onclick = () => showEditor('post');
  document.getElementById('btnReel').onclick = () => showEditor('reel');
  document.getElementById('temaBack').onclick = () => hidePanel('temaPage');
  document.getElementById('editorBack').onclick = () => hidePanel('editorPage');
  document.getElementById('copyBtn').onclick = copyEditorText;

  ['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
    document.getElementById(id).oninput = saveTemaDebounced;
  });

  document.querySelectorAll('input[name="temaColor"]').forEach(radio => {
    radio.onchange = saveTema;
  });

  // Render Calendar Components
  function renderWeekdays() {
    const weekdaysContainer = document.getElementById('weekdays');
    weekdaysContainer.innerHTML = '';
    weekdays.forEach(day => {
      const div = document.createElement('div');
      div.textContent = day;
      weekdaysContainer.appendChild(div);
    });
  }

  function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leadingDays = firstDay === 0 ? 6 : firstDay - 1;

    // Add empty cells for leading days
    for (let i = 0; i < leadingDays; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell empty';
      calendar.appendChild(emptyCell);
    }

    // Add day cells
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
  }

  // Menu and Panel Handling
  function openMenuForDate(dateKey) {
    selectedDateKey = dateKey;
    document.getElementById('menuDateTitle').textContent = formatReadable(dateKey);
    showMenu();
  }

  function showMenu() {
    document.getElementById('menu').classList.add('active');
  }

  function closeMenu() {
    document.getElementById('menu').classList.remove('active');
  }

  function showPanel(panelId) {
    document.getElementById(panelId).classList.add('active');
  }

  function hidePanel(panelId) {
    document.getElementById(panelId).classList.remove('active');
  }

  function showTema() {
    closeMenu();
    selectedType = 'tema';
    document.getElementById('temaDateTitle').textContent = formatReadable(selectedDateKey);
    showPanel('temaPage');
    loadTemaData(selectedDateKey);
  }

  function showEditor(type) {
    closeMenu();
    selectedType = type;
    document.getElementById('editorDateTitle').textContent = formatReadable(selectedDateKey);
    document.getElementById('editorTypeLabel').textContent = type.charAt(0).toUpperCase() + type.slice(1);
    showPanel('editorPage');

    if (!quill) {
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
  }

  // Data Loading and Saving
  function loadDataForCell(dateKey, cell) {
    getUserContentCollection().doc(dateKey).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const color = data.temaColor || 'free';
        cell.style.backgroundColor = colorMap[color] || colorMap.free;
      }
    });
  }

  function loadTemaData(dateKey) {
    ['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
      document.getElementById(id).value = '';
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
    });
  }

  function saveTema() {
    if (!selectedDateKey || !user) return;

    const tema = document.getElementById('tema_tema').value;
    const goal = document.getElementById('tema_goal').value;
    const activity = document.getElementById('tema_activity').value;
    const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || 'free';

    getUserContentCollection().doc(selectedDateKey).set({
      tema,
      goal,
      activity,
      temaColor
    }, { merge: true });

    updateCellColor(selectedDateKey, temaColor);
  }

  function saveTemaDebounced() {
    clearTimeout(temaTimer);
    temaTimer = setTimeout(saveTema, 500);
  }

  function updateCellColor(dateKey, color) {
    const cell = document.querySelector(`.day-cell[data-date="${dateKey}"]`);
    if (cell) cell.style.backgroundColor = colorMap[color] || colorMap.free;
  }

  function loadEditorData(dateKey, type) {
    if (!quill) return;
    quill.setContents([]);
    getUserContentCollection().doc(dateKey).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data[type]) quill.root.innerHTML = data[type];
      }
    });
  }

  function saveEditor() {
    if (!selectedDateKey || !selectedType || !quill || !user) return;
    const value = quill.root.innerHTML;
    getUserContentCollection().doc(selectedDateKey).set({
      [selectedType]: value
    }, { merge: true });
  }

  function saveEditorDebounced() {
    clearTimeout(editorTimer);
    editorTimer = setTimeout(saveEditor, 700);
  }

  // Editor Utilities
  function copyEditorText() {
    if (!quill) return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(() => {
      const copyBtn = document.getElementById('copyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Скопировано';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 1000);
    });
  }

  function showImageTooltip(img) {
    const tooltip = document.getElementById('imageTooltip');
    const rect = img.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    tooltip.style.display = 'block';
    tooltip.onclick = () => {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'image';
      document.body.appendChild(link);
      link.click();
      link.remove();
      tooltip.style.display = 'none';
    };
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('img')) {
      document.getElementById('imageTooltip').style.display = 'none';
    }
  });

  // Initialize Calendar
  renderWeekdays();
  renderCalendar();
}
