const OWNER_EMAIL = "ylia.alei@gmail.com";
function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

// Карты фонов по месяцам
const monthBackgrounds = [
  "https://i.pinimg.com/736x/ac/0f/a9/ac0fa9912b3c74e34d99c9c0e0b57323.jpg", // Январь
  "https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg", // Февраль
  "https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg", // Март
  "https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg", // Апрель
  "https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg", // Май
  "https://i.pinimg.com/736x/d8/a5/20/d8a520e299b09faf6b0805f0eebe4e74.jpg", // Июнь
  "https://i.pinimg.com/1200x/40/c4/31/40c43185d7067a13c9cc999f596c377e.jpg", // Июль
  "https://i.pinimg.com/736x/fb/f7/ee/fbf7ee009c3cd6189d7ce6044f408c0f.jpg", // Август
  "https://i.pinimg.com/736x/4c/42/43/4c4243788c34ad2c357e6895b66c12eb.jpg", // Сентябрь
  "https://i.pinimg.com/736x/01/18/c2/0118c2cc54622adb4edb500703a063eb.jpg", // Октябрь
  "https://i.pinimg.com/736x/94/78/0d/94780d2437de26d5fbd37c702467a4a5.jpg", // Ноябрь
  "https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg"  // Декабрь
];

window.addEventListener("load", () => {
  safeAssign("googleBtn","onclick", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch(e){
      $("authError").textContent = e.message;
    }
  });
  safeAssign("logoutBtn","onclick", ()=> auth.signOut());

  auth.onAuthStateChanged(user => {
    if(!user){
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
      $("authSection").style.display = "block";
      return;
    }
    if(user.email !== OWNER_EMAIL){
      alert("Доступ только владельцу.");
      auth.signOut();
      return;
    }
    $("authSection").style.display = "none";
    $("app").style.display = "block";
    document.body.classList.add("calendar-page");
    initApp();
  });
});

function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = {
    burgundy: "#800020",
    orange: "#FFA500",
    green: "#006400",
    brown: "#8B4513",
    beige: "#F5F5DC"
  };

  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  const monthNames = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
  ];

  function setMonthBackground(monthIndex){
    const img = monthBackgrounds[monthIndex];
    if(img) document.body.style.backgroundImage = `url('${img}')`;
  }

  function renderCalendar(){
    setMonthBackground(currentMonth);

    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const calendar = $("calendar");
    calendar.innerHTML = "";
    $("weekdays").innerHTML = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=>`<div>${d}</div>`).join("");

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startDay = (firstDay === 0 ? 6 : firstDay - 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for(let i=0;i<startDay;i++) calendar.innerHTML += `<div class="day-cell empty"></div>`;

    for(let d=1; d<=daysInMonth; d++){
      const date = new Date(currentYear, currentMonth, d);
      const id = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;

      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.innerHTML = `<div class="day-number">${d}</div>`;
      cell.dataset.date = id;
      calendar.appendChild(cell);
    }
  }

  renderCalendar();
  $("prevBtn").onclick = () => { currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); };
  $("nextBtn").onclick = () => { currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); };
}

