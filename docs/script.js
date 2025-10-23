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

logoutBtn.addEventListener('click', () => auth.signOut());

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
const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
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
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let i = 1; i <= totalDays; i++) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = i;
    const key = `${year}-${month+1}-${i}`;
    loadDayColor(day, key);
    day.addEventListener("click", () => openMenu(key, i, month, year));
    calendar.appendChild(day);
  }
}

function loadDayColor(el, key) {
  db.collection("planner").doc(key).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.temaColor) {
        el.style.backgroundColor = getColor(data.temaColor);
      }
    }
  });
}

function getColor(name) {
  const colors = {
    burgundy: "rgba(128, 0, 32, 0.4)",
    orange: "rgba(255, 165, 0, 0.4)",
    green: "rgba(34, 139, 34, 0.4)",
    brown: "rgba(139, 69, 19, 0.4)",
    beige: "rgba(245, 245, 220, 0.4)"
  };
  return colors[name] || "rgba(255,255,255,0.1)";
}

document.getElementById("prevBtn").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});
document.getElementById("nextBtn").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

// === Меню и редакторы ===
const menu = document.getElementById("menu");
const menuDateTitle = document.getElementById("menuDateTitle");
const menuClose = document.getElementById("menuClose");
const temaPage = document.getElementById("temaPage");
const editorPage = document.getElementById("editorPage");
let currentKey = "";

function openMenu(key, d, m, y) {
  menuDateTitle.textContent = `${d} ${months[m]} ${y}`;
  currentKey = key;
  menu.style.display = "block";
}

menuClose.onclick = () => menu.style.display = "none";

document.getElementById("btnTema").onclick = () => openEditor("tema");
document.getElementById("btnPost").onclick = () => openEditor("post");
document.getElementById("btnReel").onclick = () => openEditor("reel");
document.getElementById("btnStories").onclick = () => openEditor("stories");

function openEditor(type) {
  menu.style.display = "none";
  if (type === "tema") {
    temaPage.style.display = "block";
    loadTema();
  } else {
    editorPage.style.display = "block";
    loadEditor(type);
  }
}

document.getElementById("temaBack").onclick = () => temaPage.style.display = "none";
document.getElementById("editorBack").onclick = () => editorPage.style.display = "none";

document.getElementById("temaSave").onclick = () => {
  const tema = document.getElementById("tema_tema").value;
  const goal = document.getElementById("tema_goal").value;
  const color = document.getElementById("tema_type").value;
  db.collection("planner").doc(currentKey).set({ tema, goal, temaColor: color }, { merge: true });
  renderCalendar(currentDate);
  temaPage.style.display = "none";
};

function loadTema() {
  db.collection("planner").doc(currentKey).get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      document.getElementById("tema_tema").value = d.tema || "";
      document.getElementById("tema_goal").value = d.goal || "";
      document.getElementById("tema_type").value = d.temaColor || "burgundy";
    }
  });
}

function loadEditor(type) {
  const editor = new Quill("#editorText", { theme: "snow" });
  document.getElementById("editorTypeLabel").textContent = "Редактор: " + type;
  db.collection("planner").doc(currentKey).get().then(doc => {
    if (doc.exists && doc.data()[type]) {
      editor.root.innerHTML = doc.data()[type];
      document.getElementById("vk").checked = doc.data().vk || false;
      document.getElementById("inst").checked = doc.data().inst || false;
      document.getElementById("tg").checked = doc.data().tg || false;
    }
  });
  editor.on("text-change", () => {
    db.collection("planner").doc(currentKey).set({ [type]: editor.root.innerHTML }, { merge: true });
  });
  ["vk","inst","tg"].forEach(id => {
    document.getElementById(id).onchange = e => {
      db.collection("planner").doc(currentKey).set({ [id]: e.target.checked }, { merge: true });
    };
  });
}

document.getElementById("copyBtn").onclick = () => {
  const text = document.querySelector(".ql-editor").innerText;
  navigator.clipboard.writeText(text);
  alert("Текст скопирован!");
};
