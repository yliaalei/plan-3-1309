// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyAqUEri9DzMftxtS7ker4tfC-EnZNK6nMA",
  authDomain: "content-planner-ffb8e.firebaseapp.com",
  projectId: "content-planner-ffb8e",
  storageBucket: "content-planner-ffb8e.appspot.com",
  messagingSenderId: "615520592527",
  appId: "1:615520592527:web:7478b8c3de904c924086fa"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Elements
const authSection = document.getElementById("authSection");
const app = document.getElementById("app");
const googleBtn = document.getElementById("googleBtn");
const authError = document.getElementById("authError");
const logoutBtn = document.getElementById("logoutBtn");
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const weekdays = document.getElementById("weekdays");

const btnTema = document.getElementById("btnTema");
const btnStories = document.getElementById("btnStories");
const btnPost = document.getElementById("btnPost");
const btnReel = document.getElementById("btnReel");

const temaPage = document.getElementById("temaPage");
const temaBack = document.getElementById("temaBack");
const tema_tema = document.getElementById("tema_tema");
const tema_goal = document.getElementById("tema_goal");
const tema_type = document.getElementById("tema_type");
const temaDateTitle = document.getElementById("temaDateTitle");

const editorPage = document.getElementById("editorPage");
const editorBack = document.getElementById("editorBack");
const editorDateTitle = document.getElementById("editorDateTitle");
const editorText = document.getElementById("editorText");

const calendarButtons = document.getElementById("calendarButtons");
const storiesIcons = document.getElementById("storiesIcons");
const postIcons = document.getElementById("postIcons");
const reelIcons = document.getElementById("reelIcons");

let currentDate = new Date();
let selectedDate = null;

// Authentication
googleBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      if (result.user.email !== "ylia.alei@gmail.com") {
        auth.signOut();
        authError.textContent = "Доступ только для владельца!";
      }
    })
    .catch(err => { authError.textContent = err.message; });
});

logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user && user.email === "ylia.alei@gmail.com") {
    authSection.classList.remove("active");
    app.style.display = "block";
    renderCalendar();
  } else {
    authSection.classList.add("active");
    app.style.display = "none";
  }
});

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
