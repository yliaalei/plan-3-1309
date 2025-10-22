const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

safeAssign("googleBtn","onclick",()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  auth.signInWithPopup(provider).catch(e=>$("authError").textContent=e.message);
});
safeAssign("logoutBtn","onclick",()=>auth.signOut());

auth.onAuthStateChanged(user=>{
  if(!user){
    $("authSection").style.display="block";
    $("app").style.display="none";
    return;
  }
  if(user.email!==OWNER_EMAIL){
    alert("Доступ только владельцу.");
    auth.signOut();
    return;
  }
  $("authSection").style.display="none";
  $("app").style.display="block";
  initApp();
});

function initApp(){
  const dbRef=db.collection("contentPlanner");
  const colorMap={
    burgundy:"#800020",
    orange:"#FFA500",
    green:"#006400",
    brown:"#8B4513",
    beige:"#F5F5DC",
    free:"#fff"
  };

  let selectedDateKey=null, selectedType=null;
  let currentMonth=(new Date()).getMonth();
  let currentYear=(new Date()).getFullYear();

  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  function pad(n){return String(n).padStart(2,"0");}
  function makeKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}

  function renderWeekdays(){
    const wd=$("weekdays");
    wd.innerHTML="";
    weekdays.forEach(d=>{
      const div=document.createElement("div");
      div.textContent=d;
      wd.appendChild(div);
    });
  }

  function renderCalendar(){
    const cal=$("calendar");
    cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){
      const empty=document.createElement("div");
      empty.className="day-cell empty";
      cal.appendChild(empty);
    }
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();

    for(let d=1;d<=daysInMonth;d++){
      const key=makeKey(currentYear,currentMonth,d);
      const cell=document.createElement("div");
      cell.className="day-cell";
      const num=document.createElement("div");
      num.className="day-number";
      num.textContent=d;
      cell.appendChild(num);

      dbRef.doc(key).get().then(doc=>{
        let bg="rgba(255,255,255,0.15)";
        if(doc.exists){
          const data=doc.data();
          const c=colorMap[data.temaColor]||"#fff";
          const [r,g,b]=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
          bg=`rgba(${r},${g},${b},0.4)`;
        }
        cell.style.backgroundColor=bg;
      });

      cell.onclick=()=>openMenuForDate(key);
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey=key;
    $("menuDateTitle").textContent=key;
    $("menu").classList.add("active");
  }

  $("menuClose").onclick=()=>$("menu").classList.remove("active");
  $("prevBtn").onclick=()=>{currentMonth--;if(currentMonth<0){currentMonth=11;currentYear--;}renderCalendar();};
  $("nextBtn").onclick=()=>{currentMonth++;if(currentMonth>11){currentMonth=0;currentYear++;}renderCalendar();};

  renderWeekdays();
  renderCalendar();
}

