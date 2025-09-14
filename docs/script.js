// Firebase
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

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

document.addEventListener('DOMContentLoaded', () => {
  // Отрисовать дни недели
  const weekdaysRow = document.getElementById('weekdays');
  weekdaysRow.innerHTML = '';
  weekdays.forEach(day => {
    const div = document.createElement('div');
    div.textContent = day;
    weekdaysRow.appendChild(div);
  });

  renderCalendar();
});

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  calendar.innerHTML = '';

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

// ==== Меню и страницы ====
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

function showEditor(type) {
  closeMenu();
  selectedType = type;
  document.getElementById('editorTitle').textContent =
    type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('editorPage').style.display = 'block';
  loadEditorData(selectedDate, type);
}
function closeEditor() {
  document.getElementById('editorPage').style.display = 'none';
  selectedType = null;
}

// ==== Работа с Firestore ====

// Сохранение темы
function saveTema() {
  const tema = document.getElementById('tema_tema')?.value || '';
  const goal = document.getElementById('tema_goal')?.value || '';
  const activity = document.getElementById('tema_activity')?.value || '';
  const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || '';

  if (!selectedDate) return;

  db.collection('contentPlanner').doc(selectedDate).set({
    tema, goal, activity, temaColor
  }, { merge: true });

  updateCalendarCellColor(selectedDate, temaColor);
}

// Автосохранение при вводе
['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => saveTema());
  }
});
document.querySelectorAll('input[name="temaColor"]').forEach(r => {
  r.addEventListener('change', () => saveTema());
});

// Загрузка данных темы
function loadTemaData(date) {
  const temaTextarea = document.getElementById('tema_tema');
  const goalTextarea = document.getElementById('tema_goal');
  const activityTextarea = document.getElementById('tema_activity');

  db.collection('contentPlanner').doc(date).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (temaTextarea) temaTextarea.value = data.tema || '';
      if (goalTextarea) goalTextarea.value = data.goal || '';
      if (activityTextarea) activityTextarea.value = data.activity || '';
      if (data.temaColor) {
        const radio = document.querySelector(`input[name="temaColor"][value="${data.temaColor}"]`);
        if (radio) radio.checked = true;
        updateCalendarCellColor(date, data.temaColor);
      }
    }
  });
}

// Обновление цвета ячейки календаря
function updateCalendarCellColor(date, color) {
  const dayDiv = document.querySelector(`div[data-date="${date}"]`);
  if (dayDiv) {
    dayDiv.style.backgroundColor = colorMap[color] || '';
  }
}

// Сохранение текста редактора
function saveEditor() {
  if (!selectedDate || !selectedType) return;
  const val = document.getElementById('editorText').value || '';
  db.collection('contentPlanner').doc(selectedDate).set({
    [selectedType]: val
  }, { merge: true });
}

// Загрузка данных редактора
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

// Загрузка данных календаря (цвет)
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
