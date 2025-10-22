// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Настройки приложения
const OWNER_EMAIL = "ylia.alei@gmail.com";

const MONTH_BACKGROUNDS = [
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

const COLOR_MAP = {
  burgundy: "rgba(128,0,32,0.6)",
  orange: "rgba(255,165,0,0.6)",
  green: "rgba(0,100,0,0.6)",
  brown: "rgba(139,69,19,0.6)",
  beige: "rgba(245,245,220,0.6)",
  free: "rgba(255,255,255,0.6)"
};

const $ = id => document.getElementById(id);

// Вход и проверка владельца
$("googleBtn").onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(e=>$("authError").textContent=e.message);
};
$("logoutBtn").onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if(!user){ document.querySelector("#app").style.display="none"; $("authSection").style.display="block"; return; }
  if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу"); auth.signOut(); return; }
  $("app").style.display="block"; $("authSection").style.display="none"; initApp();
});

// Инициализация приложения
function initApp(){
  const dbRef = db.collection("contentPlanner");
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  let selectedDate = null;
  let quill = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  $("prevBtn").onclick = ()=>{ currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar();}
  $("nextBtn").onclick = ()=>{ currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar();}

  $("btnTema").onclick = ()=>showEditor("tema");
  $("btnPost").onclick = ()=>showEditor("post");
  $("btnReel").onclick = ()=>showEditor("reel");
  $("btnStories").onclick = ()=>showEditor("stories");
  $("temaBack").onclick = ()=>hidePanel("temaPage");
  $("editorBack").onclick = ()=>hidePanel("editorPage");
  $("copyBtn").onclick = ()=>{ if(quill) navigator.clipboard.writeText(quill.getText()); }

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){
    const wd = $("weekdays"); wd.innerHTML=""; weekdays.forEach(d=>{ const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function updateCalendarBackground(){ $("calendarBackground").style.backgroundImage=`url('${MONTH_BACKGROUNDS[currentMonth]}')`; }

  function renderCalendar(){
    updateCalendarBackground();
    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const cal = $("calendar"); cal.innerHTML="";
    const firstDay = new Date(currentYear,currentMonth,1).getDay();
    const leading = (firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){ const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e); }
    const daysInMonth = new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = makeDateKey(currentYear,currentMonth,d);
      const cell = document.createElement("div");
      cell.className="day-cell"; cell.dataset.date=key;
      const num = document.createElement("div"); num.className="day-number"; num.textContent=d;
      cell.appendChild(num);
      cell.style.backgroundColor = COLOR_MAP.free;
      cell.onclick=()=>openEditorForDate(key);
      dbRef.doc(key).get().then(doc=>{ if(doc.exists){ const data=doc.data(); const c=data.temaColor||"free"; cell.style.backgroundColor=COLOR_MAP[c]||COLOR_MAP.free; }});
      cal.appendChild(cell);
    }
  }

  function openEditorForDate(key){ selectedDate=key; showEditor("tema"); $("editorDateTitle").textContent=formatReadable(key); }

  function showEditor(type){
    const panelId = type==="tema"?"temaPage":"editorPage";
    $(panelId).style.display="block"; $("app").style.display="none";
    if(quill){ quill=null; }
    quill = new Quill("#editorText",{theme:"snow"});
    dbRef.doc(selectedDate).get().then(doc=>{
      if(doc.exists){ const val=doc.data()[type]||""; quill.setText(val); }
    });
  }

  function hidePanel(panelId){ $(panelId).style.display="none"; $("app").style.display="block"; renderCalendar(); }

  renderWeekdays();
  renderCalendar();
}
