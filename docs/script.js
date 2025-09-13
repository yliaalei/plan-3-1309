const db = firebase.firestore();
const colorMap = {
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

let selectedDate = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
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
    calendar.appendChild(dayDiv);
    loadData(isoDate, dayDiv);
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
  document.getElementById('menu').style.display = 'none';
  document.getElementById('temaPage').style.display = 'block';
}

function closeTema() {
  document.getElementById('temaPage').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
}

function saveTema() {
  const temaText = document.getElementById('temaText').value;
  const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || '';
  db.collection('contentPlanner').doc(selectedDate).set({
    tema: temaText,
    temaColor: temaColor
  });
  updateCalendarCellColor(selectedDate, temaColor);
  closeTema();
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

function updateCalendarCellColor(date, color) {
  const dayDiv = document.querySelector(`div[data-date="${date}"]`);
  if (dayDiv) {
    dayDiv.style.backgroundColor = colorMap[color] || '';
  }
}

function showEditor(type) {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('editorTitle').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('editorPage').style.display = 'block';
  const editorText = document.getElementById('editorText');
  editorText.value = '';
  editorText.focus();
}

function closeEditor() {
  document.getElementById('editorPage').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
}

function saveEditor() {
  const editorText = document.getElementById('editorText').value;
  db.collection('contentPlanner').doc(selectedDate).set({
    [selectedType]: editorText
  }, { merge: true });
  closeEditor();
}
