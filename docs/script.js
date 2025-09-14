// Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Цвета
const colorMap = {
  free: '#ffffff',
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

  const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Пн=0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
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

// ==== Меню ====
function openMenu(date) {
  selectedDate = date;
  document.getElementById('menuDateTitle').textContent = date;
  document.getElementById('menu').style.display = 'block';
}
function closeMenu() {
  document.getElementById('menu').style.display = 'none';
}

// ==== Тема ====
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
  const tema = document.getElementById('tema_tema')?.value || '';
  const goal = document.getElementById('tema_goal')?.value || '';
  const activity = document.getElementById('tema_activity')?.value || '';
  const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || 'free';
  if (!selectedDate) return;

  db.collection('contentPlanner').doc(selectedDate).set({
    tema, goal, activity, temaColor
  }, { merge: true });
  updateCalendarCellColor(selectedDate, temaColor);
}
['tema_tema', 'tema_goal', 'tema_activity'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => saveTema());
});
document.querySelectorAll('input[name="temaColor"]').forEach(r => {
  r.addEventListener('change', () => saveTema());
});
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
function updateCalendarCellColor(date, color) {
  const dayDiv = document.querySelector(`div[data-date="${date}"]`);
  if (dayDiv) dayDiv.style.backgroundColor = colorMap[color] || colorMap.free;
}

// ==== Редактор ====
function showEditor(type) {
  closeMenu();
  selectedType = type;
  document.getElementById('editorTitle').textContent =
    type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('editorDate').textContent = selectedDate;
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
function copyText() {
  const textarea = document.getElementById('editorText');
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert("Текст скопирован!");
  });
}

// ==== Загрузка данных календаря ====
function loadData(date, dayDiv) {
  db.collection('contentPlanner').doc(date).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const color = data.temaColor || 'free';
      dayDiv.style.backgroundColor = colorMap[color];
    } else {
      dayDiv.style.backgroundColor = colorMap.free;
    }
  });
}
