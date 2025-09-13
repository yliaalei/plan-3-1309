let currentMonth = 0; // Январь = 0
let currentYear = 2025;

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  setupNavigation();
});

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
  if (currentMonth < 0) currentMonth = 0;      // не уходить в 2024
  if (currentMonth > 11) currentMonth = 11;    // не уходить в 2026
  document.getElementById('monthLabel').textContent = getMonthName(currentMonth) + ' ' + currentYear;
  renderCalendar();
}

function getMonthName(monthIndex) {
  const names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  return names[monthIndex];
}
