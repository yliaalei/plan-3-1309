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
let currentYear = 2025; // старт с 2025

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  setupNavigation();
});

// Навигация по месяцам
function setupNavigation() {
  const nav = document.createElement('div');
  nav.style.textAlign = 'center';
  nav.style.margin = '10px 0';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '⬅ Назад';
  prevBtn.onclick = () => changeMonth(-1);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Вперед ➡';
  nextBtn.onclick = () => changeMonth(1);

  const monthLabel = document.createElement('span');
  monthLabel.id = 'monthLabel';
  monthLabel.style.margin = '0 10px';
  monthLabel.textContent = getMonthName(currentMonth) + ' ' + currentYear;

  nav.appendChild(prevBtn);
  nav.appendChild(monthLabel);
  nav.appendChild(nextBtn);

  document.getElementById('app').insertBefore(nav, document.getElementById('calendar'));
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    if (currentYear > 2025) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth = 0;
    }
  }
  if (currentMonth > 11) {
    if (currentYear < 2030) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth = 11;
    }
  }
  document.getElementById('monthLabel').textContent = getMonthName(currentMonth) + ' ' + currentYear;
  renderCalendar();
}

function getMonthName(monthIndex) {
  const names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  return names[monthIndex];
}

// Рендер календаря
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
    dayDiv.dataset.date = isoDate;

    // Число дня
    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayNumber.style.fontWeight = 'bold';
    dayDiv.appendChild(dayNumber);

    // Текст заметки прямо в ячейке
    const noteTextarea = document.createElement('textarea');
    noteTextarea.placeholder = "Введите заметку...";
    noteTextarea.style.width = "100%";
    noteTextarea.style.height = "50px";
    noteTextarea.style.marginTop = "5px";
    noteTextarea.style.fontSize = "12px";

    // Загрузка текста и цвета
    db.collection('contentPlanner').doc(isoDate).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data.note) noteTextarea.value = data.note;
        if (data.temaColor) dayDiv.style.backgroundColor = colorMap[data.temaColor] || '';
      }
    });

    // Автосохранение текста заметки
    noteTextarea.addEventListener('input', () => {
      db.collection('contentPlanner').doc(isoDate).set({
        note: noteTextarea.value
      }, { merge: true });
    });

    dayDiv.appendChild(noteTextarea);

    // Клик по числу открывает меню
    dayNumber.addEventListener('click', () => openMenu(isoDate));

    calendar.appendChild(dayDiv);
  }
}

// Меню
function openMenu(date) {
  selectedDate = date;
  document.getElementById('menuDateTitle').textContent = date;
  document.getElementById('menu').style.display = 'block';
}

function closeMenu() {
  document.getElementById('menu').style.display = 'none';
}

// Тема
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

  const dayDiv = document.querySelector(`div[data-date="${selectedDate}"]`);
  if (dayDiv) dayDiv.style.backgroundColor = colorMap[temaColor] || '';
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
        const dayDiv = document.querySelector(`div[data-date="${date}"]`);
        if (dayDiv) dayDiv.style.backgroundColor = colorMap[data.temaColor] || '';
      }
    }
  });

  temaTextarea.oninput = () => saveTema();
  document.querySelectorAll('input[name="temaColor"]').forEach(r => r.addEventListener('change', () => saveTema()));
}

// Редактор Сторис, Пост, Рилс
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
