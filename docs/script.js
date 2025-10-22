// ===== Google Auth =====
const googleBtn = document.getElementById('googleBtn');
const authSection = document.getElementById('authSection');
const appDiv = document.getElementById('app');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

googleBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    const user = result.user;
    if (user.email !== 'ylia.alei@gmail.com') {
      auth.signOut();
      authError.textContent = 'Доступ разрешён только владельцу';
    }
  }).catch(err => {
    authError.textContent = err.message;
  });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut();
});
const authSection = document.getElementById("authSection");
const app = document.getElementById("app");
const googleBtn = document.getElementById("googleBtn");
const authError = document.getElementById("authError");
const logoutBtn = document.getElementById("logoutBtn");

const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const weekdaysContainer = document.getElementById("weekdays");
const calendarContainer = document.getElementById("calendar");
const calendarBackground = document.getElementById("calendarContainer");

const btnTema = document.getElementById("btnTema");
const btnStories = document.getElementById("btnStories");
const btnPost = document.getElementById("btnPost");
const btnReel = document.getElementById("btnReel");

const temaPage = document.getElementById("temaPage");
const editorPage = document.getElementById("editorPage");
const temaBack = document.getElementById("temaBack");
const editorBack = document.getElementById("editorBack");

const temaTema = document.getElementById("tema_tema");
const temaGoal = document.getElementById("tema_goal");
const temaType = document.getElementById("tema_type");

// Массив с фонами для месяцев (0=Январь)
const monthBackgrounds = [
  "https://i.pinimg.com/736x/f1/60/2d/f1602d2c149edac0031b3bc9712f7aa0.jpg",
  "https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg",
  "https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg",
  "https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg",
  "https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg",
  "https://i.pinimg.com/736x/b6/4a/40/b64a40d46d76c07b38f402b700a68ebf.jpg",
  "https://i.pinimg.com/736x/4b/c9/9c/4bc99c0eb0510c4afa3def6130fb5d5e.jpg",
  "https://i.pinimg.com/736x/8d/75/94/8d75944f391040cc5158c2b30e562f10.jpg",
  "https://i.pinimg.com/1200x/0d/76/0e/0d760ea90c9a8b8c8dcbf746c654274b.jpg",
  "https://i.pinimg.com/736x/c2/72/11/c272119855bf0720da0d29c3a3d4957c.jpg",
  "https://i.pinimg.com/736x/aa/13/7a/aa137acb45295656a15a8ae1c3a061cd.jpg",
  "https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg"
];

let currentDate = new Date();

function updateCalendarBackground() {
  const month = currentDate.getMonth();
  calendarBackground.style.background = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${monthBackgrounds[month]}')`;
  calendarBackground.style.backgroundSize = "cover";
  calendarBackground.style.backgroundPosition = "center";
}

function renderCalendar() {
  calendarContainer.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Показ месяца и года
  monthYear.textContent = `${currentDate.toLocaleString('ru-RU', { month: 'long' })} ${year}`;

  // День недели 0=вс..6=сб
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  weekdaysContainer.innerHTML = "";
  ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"].forEach(d=>{
    const div = document.createElement("div");
    div.textContent = d;
    weekdaysContainer.appendChild(div);
  });

  calendarContainer.innerHTML = "";
  const calendarGrid = document.createElement("div");
  calendarGrid.classList.add("calendar");

  // Пустые ячейки
  for(let i=0;i<firstDay;i++){
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("day-cell","empty");
    calendarGrid.appendChild(emptyCell);
  }

  for(let day=1;day<=lastDate;day++){
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    const num = document.createElement("div");
    num.classList.add("day-number");
    num.textContent = day;
    cell.appendChild(num);
    calendarGrid.appendChild(cell);
  }

  calendarContainer.appendChild(calendarGrid);
}

prevBtn.addEventListener("click", ()=>{
  currentDate.setMonth(currentDate.getMonth()-1);
  updateCalendarBackground();
  renderCalendar();
});
nextBtn.addEventListener("click", ()=>{
  currentDate.setMonth(currentDate.getMonth()+1);
  updateCalendarBackground();
  renderCalendar();
});

// Google Auth
googleBtn.addEventListener("click", ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result=>{
      const user = result.user;
      if(user.email === "ylia.alei@gmail.com"){
        authSection.classList.remove("active");
        app.style.display = "block";
        updateCalendarBackground();
        renderCalendar();
      }else{
        auth.signOut();
        authError.textContent = "Доступ разрешен только владельцу";
      }
    })
    .catch(err=>{
      authError.textContent = err.message;
    });
});

logoutBtn.addEventListener("click", ()=>{
  auth.signOut().then(()=>{
    app.style.display="none";
    authSection.classList.add("active");
  });
});

auth.onAuthStateChanged(user=>{
  if(user && user.email === "ylia.alei@gmail.com"){
    authSection.classList.remove("active");
    app.style.display="block";
    updateCalendarBackground();
    renderCalendar();
  }else{
    app.style.display="none";
    authSection.classList.add("active");
  }
});

// Панели редакторов
btnTema.addEventListener("click", ()=>{temaPage.classList.add("active");});
temaBack.addEventListener("click", ()=>{temaPage.classList.remove("active");});
btnStories.addEventListener("click", ()=>{editorPage.classList.add("active"); editorDateTitle.textContent="Сторис";});
btnPost.addEventListener("click", ()=>{editorPage.classList.add("active"); editorDateTitle.textContent="Пост";});
btnReel.addEventListener("click", ()=>{editorPage.classList.add("active"); editorDateTitle.textContent="Рилс";});
editorBack.addEventListener("click", ()=>{editorPage.classList.remove("active");});
// Calendar helpers
const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const weekdaysNames = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function renderWeekdays(){
  weekdays.innerHTML = "";
  weekdaysNames.forEach(d => {
    const el = document.createElement("div");
    el.textContent = d;
    weekdays.appendChild(el);
  });
}

function renderCalendar(){
  calendar.innerHTML = "";
  renderWeekdays();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Background by month
  const bgUrls = [
    "https://i.pinimg.com/736x/f1602d2c149edac0031b3bc9712f7aa0.jpg",
    "https://i.pinimg.com/736x/ac5e740afe0ad061777b979f5e4a0808.jpg",
    "https://i.pinimg.com/736x/d4c4b455ebe734b9d69dfd16635de086.jpg",
    "https://i.pinimg.com/736x/a533db51f86acc360d2f34b9ab2de7b3.jpg",
    "https://i.pinimg.com/736x/fa1f2ebc900dd29049e1cf26098a6039.jpg",
    "https://i.pinimg.com/736x/b64a40d46d76c07b38f402b700a68ebf.jpg",
    "https://i.pinimg.com/736x/4bc99c0eb0510c4afa3def6130fb5d5e.jpg",
    "https://i.pinimg.com/736x/8d75944f391040cc5158c2b30e562f10.jpg",
    "https://i.pinimg.com/1200x/0d760ea90c9a8b8c8dcbf746c654274b.jpg",
    "https://i.pinimg.com/736x/c272119855bf0720da0d29c3a3d4957c.jpg",
    "https://i.pinimg.com/736x/aa137acb45295656a15a8ae1c3a061cd.jpg",
    "https://i.pinimg.com/736x/95bb85acb69721441b666577aefd7ad7.jpg"
  ];
  document.getElementById("calendarContainer").style.backgroundImage = `url('${bgUrls[month]}')`;

  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // Empty cells before
  for(let i=1;i<firstDay;i++){
    const cell = document.createElement("div");
    cell.classList.add("day-cell","empty");
    calendar.appendChild(cell);
  }

  // Days
  for(let d=1; d<=daysInMonth; d++){
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    cell.dataset.date = `${year}-${month+1}-${d}`;
    const span = document.createElement("span");
    span.classList.add("day-number");
    span.textContent = d;
    cell.appendChild(span);
    cell.addEventListener("click", () => openTema(cell.dataset.date));
    calendar.appendChild(cell);
  }
}

prevBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
nextBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });

// Editor functions
function openTema(date){
  selectedDate = date;
  temaDateTitle.textContent = date;
  temaPage.classList.add("active");
}

tema
// Закрытие панели «Тема»
temaBack.addEventListener("click", () => {
  temaPage.classList.remove("active");
});

// Закрытие редактора
editorBack.addEventListener("click", () => {
  editorPage.classList.remove("active");
});

// Открытие редактора «Тема»
function openTema(date){
  selectedDate = date;
  temaDateTitle.textContent = date;
  // Подгружаем данные из Firestore
  db.collection("calendar").doc(date).get().then(doc => {
    if(doc.exists){
      const data = doc.data();
      tema_tema.value = data.tema || "";
      tema_goal.value = data.goal || "";
      tema_type.value = data.type || "";
    } else {
      tema_tema.value = "";
      tema_goal.value = "";
      tema_type.value = "";
    }
  });
  temaPage.classList.add("active");
}

// Сохранение темы
tema_tema.addEventListener("input", saveTema);
tema_goal.addEventListener("change", saveTema);
tema_type.addEventListener("change", saveTema);

function saveTema(){
  if(!selectedDate) return;
  db.collection("calendar").doc(selectedDate).set({
    tema: tema_tema.value,
    goal: tema_goal.value,
    type: tema_type.value
  }, { merge:true }).then(renderCalendar);
}

// Редакторы Пост, Сторис, Рилс
btnPost.addEventListener("click", () => openEditor("post"));
btnStories.addEventListener("click", () => openEditor("stories"));
btnReel.addEventListener("click", () => openEditor("reel"));

function openEditor(type){
  editorDateTitle.textContent = selectedDate || "";
  editorText.textContent = ""; // Очистка
  if(!selectedDate) return;

  db.collection(type).doc(selectedDate).get().then(doc=>{
    if(doc.exists){
      editorText.textContent = doc.data().text || "";
    }
    editorPage.classList.add("active");
  });

  // Сохранение на input
  editorText.oninput = () => {
    db.collection(type).doc(selectedDate).set({
      text: editorText.textContent
    });
    renderIcons(type, selectedDate);
  }
}

// Иконки соцсетей
function renderIcons(type,date){
  const iconsMap = {post: postIcons, stories: storiesIcons, reel: reelIcons};
  const container = iconsMap[type];
  container.innerHTML = "";
  db.collection(type).doc(date).get().then(doc=>{
    if(doc.exists){
      const data = doc.data();
      // Пример: можно добавить конкретные иконки если нужно
      if(data.text && data.text.includes("vk")) addIcon(container,"vk");
      if(data.text && data.text.includes("instagram")) addIcon(container,"ig");
      if(data.text && data.text.includes("tg")) addIcon(container,"tg");
    }
  });
}

function addIcon(container,name){
  const img = document.createElement("img");
  if(name==="vk") img.src="vk-icon.png";
  if(name==="ig") img.src="instagram-icon.png";
  if(name==="tg") img.src="telegram-icon.png";
  container.appendChild(img);
}

// Инициализация
renderCalendar();
