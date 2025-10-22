const OWNER_EMAIL = "ylia.alei@gmail.com";
const ICONS = {
  vk:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

safeAssign("googleBtn","onclick",()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  auth.signInWithPopup(provider).catch(e=>$("authError").textContent=e.message);
});
safeAssign("logoutBtn","onclick",()=>auth.signOut());

auth.onAuthStateChanged(user=>{
  if(!user){ document.querySelectorAll(".panel, #app").forEach(el=>el.style.display="none"); $("authSection").style.display="block"; return; }
  if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
  $("app").style.display="block"; $("authSection").style.display="none"; initApp();
});

function initApp(){
  const dbRef=db.collection("contentPlanner");
  const colorMap={ burgundy:"rgba(128,0,32,0.5)", orange:"rgba(255,165,0,0.5)", green:"rgba(0,100,0,0.5)", brown:"rgba(139,69,19,0.5)", beige:"rgba(245,245,220,0.5)", free:"rgba(255,255,255,0.3)" };
  let selectedDateKey=null, selectedType=null;
  let currentMonth=(new Date()).getMonth(), currentYear=(new Date()).getFullYear();
  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  safeAssign("prevBtn","onclick",()=>{ currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
  safeAssign("nextBtn","onclick",()=>{ currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });
  safeAssign("menuClose","onclick",()=>$("menu").classList.remove("active"));

  renderWeekdays();
  renderCalendar();

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){ const wd=$("weekdays"); wd.innerHTML=""; weekdays.forEach(d=>{ const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); }); }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){ cal.appendChild(document.createElement("div")).className="day-cell empty"; }
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key=makeDateKey(currentYear,currentMonth,d);
      const cell=document.createElement("div");
      cell.className="day-cell"; cell.dataset.date=key;
      const num=document.createElement("div"); num.className="day-number"; num.textContent=d; cell.appendChild(num);
      cell.style.backgroundColor=colorMap.free;
      cell.onclick=()=>openMenuForDate(key);
      dbRef.doc(key).get().then(doc=>{ if(doc.exists){ const c=doc.data().temaColor||"free"; cell.style.backgroundColor=colorMap[c]||colorMap.free; } });
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){ selectedDateKey=key; $("menuDateTitle").textContent=formatReadable(key); $("menu").classList.add("active"); }

}
