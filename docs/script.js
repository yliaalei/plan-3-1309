const OWNER_EMAIL = "ylia.alei@gmail.com";
function $(id){ return document.getElementById(id); }

if(typeof firebase === "undefined"){ console.error("Firebase не инициализирован"); }

window.addEventListener("load", () => {
  $("googleBtn").onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch(e){ $("authError").textContent = e.message; }
  };
  $("logoutBtn").onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if(!user){ $("authSection").style.display="block"; $("app").style.display="none"; return; }
    if(user.email !== OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
    $("authSection").style.display="none"; $("app").style.display="block"; initApp();
  });
});

function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = { burgundy:"#800020", orange:"#FFA500", green:"#006400", brown:"#8B4513", beige:"#F5F5DC" };
  const ICONS = {
    vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
    inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
    tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
  };

  let currentMonth=(new Date()).getMonth(), currentYear=(new Date()).getFullYear();
  let selectedDateKey=null, currentEditorType=null, quill=null;

  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  $("prevBtn").onclick=()=>{currentMonth--;if(currentMonth<0){currentMonth=11;currentYear--;}renderCalendar();};
  $("nextBtn").onclick=()=>{currentMonth++;if(currentMonth>11){currentMonth=0;currentYear++;}renderCalendar();};
  $("menuClose").onclick=closeMenu;
  $("menuBtnTema").onclick=()=>openEditorFromMenu("tema");
  $("menuBtnPost").onclick=()=>openEditorFromMenu("post");
  $("menuBtnReel").onclick=()=>openEditorFromMenu("reel");
  $("menuBtnStories").onclick=()=>openEditorFromMenu("stories");
  $("temaBack").onclick=()=>closeEditorPanel("temaPage");
  $("editorBack").onclick=()=>closeEditorPanel("editorPage");
  $("copyBtn").onclick=copyEditorText;

  renderWeekdays(); renderCalendar();

  function pad(n){return String(n).padStart(2,"0");}
  function makeKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
  function formatDate(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"});}

  function renderWeekdays(){
    const wd=$("weekdays"); wd.innerHTML=""; weekdays.forEach(n=>{const e=document.createElement("div");e.textContent=n;wd.appendChild(e);});
  }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const lead=(firstDay===0?6:firstDay-1);
    for(let i=0;i<lead;i++){const e=document.createElement("div");e.className="day-cell empty";cal.appendChild(e);}
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();

    for(let d=1;d<=daysInMonth;d++){
      const key=makeKey(currentYear,currentMonth,d);
      const cell=document.createElement("div");
      cell.className="day-cell"; cell.dataset.date=key;
      const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
      cell.appendChild(num);
      cell.style.backgroundColor="rgba(255,255,255,0.04)";
      cell.addEventListener("click",()=>openMenu(key));
      dbRef.doc(key).get().then(s=>{
        if(s.exists){const data=s.data();if(data.temaColor){cell.style.backgroundColor=colorMap[data.temaColor]+"40";}}
      });
      cal.appendChild(cell);
    }
  }

  function openMenu(key){
    selectedDateKey=key;
    $("menuDateTitle").textContent=formatDate(key);
    dbRef.doc(key).get().then(s=>{
      const d=s.exists?s

