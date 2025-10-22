// script.js
// Переменные из firebase-config.js уже доступны: db, auth

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
