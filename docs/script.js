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

