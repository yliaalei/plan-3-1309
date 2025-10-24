const OWNER_EMAIL = "ylia.alei@gmail.com";
function $(id){ return document.getElementById(id); }

const monthBackgrounds = [
  "https://i.pinimg.com/736x/ac/0f/a9/ac0fa9912b3c74e34d99c9c0e0b57323.jpg",
  "https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg",
  "https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg",
  "https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg",
  "https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg",
  "https://i.pinimg.com/736x/d8/a5/20/d8a520e299b09faf6b0805f0eebe4e74.jpg",
  "https://i.pinimg.com/1200x/40/c4/31/40c43185d7067a13c9cc999f596c377e.jpg",
  "https://i.pinimg.com/736x/fb/f7/ee/fbf7ee009c3cd6189d7ce6044f408c0f.jpg",
  "https://i.pinimg.com/736x/4c/42/43/4c4243788c34ad2c357e6895b66c12eb.jpg",
  "https://i.pinimg.com/736x/01/18/c2/0118c2cc54622adb4edb500703a063eb.jpg",
  "https://i.pinimg.com/736x/94/78/0d/94780d2437de26d5fbd37c702467a4a5.jpg",
  "https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg"
];

if(typeof firebase==="undefined"||typeof db==="undefined"||typeof auth==="undefined"){
  console.error("Firebase не инициализирован.");
}

window.addEventListener("load", () => {
  $("googleBtn").onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch(e){ $("authError").textContent = e.message; }
  };
  $("logoutBtn").onclick = ()=> auth.signOut();

  auth.onAuthStateChanged(user=>{
    if(!user){ $("authSection").style.display="block"; $("app").style.display="none"; return; }
    if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
    $("authSection").style.display="none"; $("app").style.display="block";
    document.body.classList.add("calendar-page");
    initApp();
  });
});

function initApp(){
  const dbRef = db.collection("contentPlanner");
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  $("prevBtn").onclick=()=>{currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar();}
  $("nextBtn").onclick=()=>{currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar();}

  renderWeekdays();
  renderCalendar();

  function renderWeekdays(){
    const wd=$("weekdays"); wd.innerHTML="";
    weekdays.forEach(d=>{const div=document.createElement("div"); div.textContent=d; wd.appendChild(div);});
  }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
    document.body.style.backgroundImage=`url('${monthBackgrounds[currentMonth]}')`;

    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e);}
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const cell=document.createElement("div");
      cell.className="day-cell";
      const num=document.createElement("div");
      num.className="day-number"; num.textContent=d;
      cell.appendChild(num);
      cal.appendChild(cell);
    }
  }
}
