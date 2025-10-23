// === Firebase auth and Firestore already initialized in index.html ===

const authSection = document.getElementById('authSection');
const app = document.getElementById('app');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authError = document.getElementById('authError');

googleBtn.addEventListener('click', async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    if (result.user.email !== "ylia.alei@gmail.com") {
      auth.signOut();
      authError.textContent = "Доступ только для владельца аккаунта.";
    }
  } catch (error) {
    authError.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user && user.email === "ylia.alei@gmail.com") {
    authSection.style.display = "none";
    app.style.display = "block";
    loadCalendar();
  } else {
    authSection.style.display = "block";
    app.style.display = "none";
  }
});

// === Календарь ===
const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const weekdays = document.getElementById('weekdays');

const months = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];
const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

let currentDate = new Date();

function loadCalendar() {
  weekdays.innerHTML = days.map(d => `<div>${d}</div>`).join("");
  renderCalendar(currentDate);
}

function renderCalendar(date) {
  calendar.innerHTML = "";
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayIndex = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  monthYear.textContent = `${months[month]} ${year}`;

  for (let i = 0; i < firstDayIndex; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let i = 1; i <= totalDays; i++) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = i;
    day.addEventListener("click", () => openMenu(i, month, year));
    calendar.appendChild(day);
  }
}

document.getElementById("prevBtn").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});
document.getElementById("nextBtn").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

// === Меню выбора редактора ===
const menu = document.getElementById("menu");
const menuDateTitle = document.getElementById("menuDateTitle");
const menuClose = document.getElementById("menuClose");

function openMenu(day, month, year) {
  menu.style.display = "block";
  menuDateTitle.textContent = `${day} ${months[month]} ${year}`;
}

menuClose.addEventListener("click", () => {
  menu.style.display = "none";
});
