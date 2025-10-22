const OWNER_EMAIL = "ylia.alei@gmail.com";
const db = firebase.firestore();
const auth = firebase.auth();

const MONTH_BACKGROUNDS = [
  "https://i.pinimg.com/736x/f1/60/2d/f1602d2c149edac0031b3bc9712f7aa0.jpg", // Январь
  "https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg", // Февраль
  "https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg", // Март
  "https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg", // Апрель
  "https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg", // Май
  "https://i.pinimg.com/736x/b6/4a/40/b64a40d46d76c07b38f402b700a68ebf.jpg", // Июнь
  "https://i.pinimg.com/736x/4b/c9/9c/4bc99c0eb0510c4afa3def6130fb5d5e.jpg", // Июль
  "https://i.pinimg.com/736x/8d/75/94/8d75944f391040cc5158c2b30e562f10.jpg", // Август
  "https://i.pinimg.com/1200x/0d/76/0e/0d760ea90c9a8b8c8dcbf746c654274b.jpg", // Сентябрь
  "https://i.pinimg.com/736x/c2/72/11/c272119855bf0720da0d29c3a3d4957c.jpg", // Октябрь
  "https://i.pinimg.com/736x/aa/13/7a/aa137acb45295656a15a8ae1c3a061cd.jpg", // Ноябрь
  "https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg"  // Декабрь
];

const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

// AUTH
safeAssign("googleBtn","onclick", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  auth.signInWithPopup(provider)
      .then(result => window.focus())
      .catch(e => $("authError").textContent = e.message);
});
safeAssign("logoutBtn","onclick", ()=>auth.signOut());

auth.onAuthStateChanged(user=>{
  if(!user){ document.querySelectorAll(".panel,#app").forEach(el=>el.style.display="none"); $("authSection").style.display="block"; return; }
  if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
  $("app").style.display="block"; $("authSection").style.display="none"; initApp();
});

// APP
function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = { burgundy:"#800020", orange:"#FFA500", green:"#006400", brown:"#8B4513", beige:"#F5F5DC", free:"rgba(255,255,255,0.7)" };
  let selectedDateKey=null, selectedType=null, quill=null;
  let currentMonth=(new Date()).getMonth(), currentYear=(new Date()).getFullYear();

  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  safeAssign("prevBtn","onclick",()=>{ currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); });
  safeAssign("nextBtn","onclick",()=>{ currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); });

  function updateCalendarBackground(){ 
    const bg = MONTH_BACKGROUNDS[currentMonth];
    const el = $("calendarContainer");
    el.style.backgroundImage=`linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${bg})`;
  }

  function renderCalendar(){
    updateCalendarBackground();
    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear,currentMonth,1).getDay();
    const lastDate = new Date(currentYear,currentMonth+1,0).getDate();

    const cal = $("calendar");
    cal.innerHTML="";
    for(let i=0;i<firstDay-1;i++){ const div=document.createElement("div"); cal.appendChild(div); }

    for(let d=1;d<=lastDate;d++){
      const div=document.createElement("div"); div.className="day-cell";
      const span=document.createElement("span"); span.className="day-number"; span.textContent=d;
      div.appendChild(span);
      div.onclick=()=>{ selectedDateKey=makeDateKey(currentYear,currentMonth,d); openTemaPage(); };
      cal.appendChild(div);
    }
  }

  function openTemaPage(){
    $("calendarContainer").style.display="none"; $("temaPage").style.display="block";
    $("temaDateTitle").textContent = formatReadable(selectedDateKey);
  }

  safeAssign("temaBack","onclick",()=>{ $("temaPage").style.display="none"; $("calendarContainer").style.display="block"; renderCalendar(); });

  renderCalendar();
}
