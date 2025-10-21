// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Элементы
const authSection = document.getElementById("authSection");
const appContainer = document.getElementById("app");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

let currentDate = new Date();
let selectedDate = null;

// ==== Авторизация ====
googleBtn.onclick = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (e) {
    document.getElementById("authError").innerText = "Ошибка входа: " + e.message;
  }
};
logoutBtn.onclick = () => auth.signOut();
auth.onAuthStateChanged(user => {
  if (user) {
    authSection.style.display = "none";
    appContainer.style.display = "block";
    renderCalendar();
  } else {
    authSection.style.display = "block";
    appContainer.style.display = "none";
  }
});

// ==== Календарь ====
function renderCalendar() {
  calendar.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = currentDate.toLocaleString("ru-RU", { month: "long", year: "numeric" });
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < offset; i++) {
    const cell = document.createElement("div");
    cell.classList.add("day-cell", "empty");
    calendar.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    cell.dataset.date = `${year}-${month + 1}-${day}`;
    cell.innerHTML = `<div class="day-number">${day}</div>`;
    cell.onclick = () => openTemaEditor(cell.dataset.date);
    calendar.appendChild(cell);
  }
}

// ==== Открытие редактора "Тема" ====
function openTemaEditor(dateStr) {
  selectedDate = dateStr;
  document.getElementById("temaPage").classList.add("active");
  document.getElementById("temaDateTitle").textContent = "Редактор темы — " + dateStr;
}

// ==== Возврат в календарь ====
document.getElementById("temaBack").onclick = () => {
  document.getElementById("temaPage").classList.remove("active");
};

// ==== Сохранение типа контента ====
const typeSelect = document.getElementById("typeSelect");
typeSelect.addEventListener("change", () => {
  if (!selectedDate) return;
  const cell = document.querySelector(`[data-date="${selectedDate}"]`);
  if (cell) {
    cell.dataset.type = typeSelect.value;
  }
});
