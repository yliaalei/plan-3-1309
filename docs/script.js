// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Цвета для тем
const colorMap = {
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

let selectedDate = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Названия месяцев для отображения
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  calendar.innerHTML = '';

  // Показать название месяца и года
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    calendar.innerHTML += '<div></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isoDate = date.toISOString().split('T')[0];

    const dayDiv = document.createElement('div');
    dayDiv.textContent = day;
    dayDiv.dataset.date = isoDate;
    dayDiv.addEventListener('click', () => openMenu(isoDate));

    loadData(isoDate, dayDiv);

    calendar.appendChild(dayDiv);
  }
}

// Переключение месяцев
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

// Календарь
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    calendar.innerHTML += '<div></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isoDate = date.toISOString().split('T')[0];

    const dayDiv = document.createElement('div');
    dayDiv.textContent = day;
    dayDiv.dataset.date = isoDate;
    dayDiv.addEventListener('click', () => openMenu(isoDate));

    loadData(isoDate, dayDiv);

    calendar.appendChild(dayDiv);
  }
}

function openMenu(date) {
  selectedDate = date;
  document.getElementById('menuDateTitle').textContent = date;
  document.getElementById('menu').style.display = 'block';
}

function closeMenu() {
  document.getElementById('menu').style.display = 'none';
}

function showTema() {
  closeMenu();
  selectedType = 'tema';
  document.getElementById('temaPage').style.display = 'block';
  loadTemaData(selectedDate);
}

function closeTema() {
  document.getElementById('temaPage').style.display = 'none';
  selectedType = null;
}

function saveTema() {
  const tema = document.getElementById('temaText')?.value || '';
  const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || '';

  if (!selectedDate) return;

  db.collection('contentPlanner').doc(selectedDate).set({
    tema,
    temaColor
  }, { merge: true });

  updateCalendarCellColor(selectedDate, temaColor);
}

function loadTemaData(date) {
  const temaTextarea = document.getElementById('temaText');

  db.collection('contentPlanner').doc(date).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (temaTextarea) temaTextarea.value = data.tema || '';
      if (data.temaColor) {
        const radio = document.querySelector(`input[name="temaColor"][value="${data.temaColor}"]`);
        if (radio) radio.checked = true;
        updateCalendarCellColor(date, data.temaColor);
      }
    }
  });

  temaTextarea.oninput = () => saveTema();
  document.querySelectorAll('input[name="temaColor"]').forEach(r => r.addEventListener('change', () => saveTema()));
}

function updateCalendarCellColor(date, color) {
  const dayDiv = document.querySelector(`div[data-date="${date}"]`);
  if (dayDiv) {
    dayDiv.style.backgroundColor = colorMap[color] || '';
  }
}

function showEditor(type) {
  closeMenu();
  selectedType = type;
  document.getElementById('editorTitle').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('editorPage').style.display = 'block';
  loadEditorData(selectedDate, type);
}

function closeEditor() {
  document.getElementById('editorPage').style.display = 'none';
  selectedType = null;
}

function saveEditor() {
  if (!selectedDate || !selectedType) return;
  const val = document.getElementById('editorText').value || '';
  db.collection('contentPlanner').doc(selectedDate).set({
    [selectedType]: val
  }, { merge: true });
}

function loadEditorData(date, type) {
  const editorTextarea = document.getElementById('editorText');
  editorTextarea.value = '';
  db.collection('contentPlanner').doc(date).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data[type]) editorTextarea.value = data[type];
    }
  });

  editorTextarea.oninput = () => saveEditor();
}

function loadData(date, dayDiv) {
  db.collection('contentPlanner').doc(date).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.temaColor) {
        dayDiv.style.backgroundColor = colorMap[data.temaColor] || '';
      }
    }
  });
}
