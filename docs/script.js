const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id){ return document.getElementById(id); }

firebase.auth().onAuthStateChanged(user => {
  if(!user){ 
    $("authSection").style.display="block";
    $("app").style.display="none";
  } else {
    if(user.email !== OWNER_EMAIL){ alert("Доступ только владельцу."); firebase.auth().signOut(); return; }
    $("authSection").style.display="none";
    $("app").style.display="block";
    initApp();
  }
});

$("googleBtn").onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
};
$("logoutBtn").onclick = () => firebase.auth().signOut();

function initApp(){
  const dbRef = firebase.firestore().collection("contentPlanner");

  const colorMap = {
    burgundy: "rgba(128,0,32,0.6)",
    orange: "rgba(255,165,0,0.6)",
    green: "rgba(0,100,0,0.6)",
    brown: "rgba(139,69,19,0.6)",
    beige: "rgba(245,245,220,0.6)",
    free: "rgba(255,255,255,0.1)"
  };

  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  $("prevBtn").onclick = ()=>{ currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} renderCalendar(); };
  $("nextBtn").onclick = ()=>{ currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} renderCalendar(); };
  $("menuClose").onclick = ()=> $("menu").classList.remove("active");

  renderWeekdays(); renderCalendar();

  function renderWeekdays(){
    const wd = $("weekdays"); wd.innerHTML="";
    weekdays.forEach(d=>{ const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar");
    cal.innerHTML="";
    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const offset = (firstDay===0?6:firstDay-1);
    for(let i=0;i<offset;i++) cal.appendChild(document.createElement("div")).className="day-cell empty";

    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const cell = document.createElement("div");
      cell.className="day-cell";
      cell.innerHTML=`<div class="day-number">${d}</div>`;
      cell.onclick = ()=> openMenu(key);
      dbRef.doc(key).get().then(doc=>{
        const data = doc.exists?doc.data():{};
        const c = data.temaColor || "free";
        cell.style.backgroundColor = colorMap[c];
      });
      cal.appendChild(cell);
    }
  }

  function openMenu(key){
    selectedDateKey=key;
    $("menuDateTitle").textContent=key.split("-").reverse().join(".");
    $("menu").classList.add("active");
  }

  $("btnTema").onclick = ()=>{
    $("menu").classList.remove("active");
    $("temaPage").classList.add("active");
    $("temaDateTitle").textContent=selectedDateKey.split("-").reverse().join(".");
    dbRef.doc(selectedDateKey).get().then(doc=>{
      const data = doc.exists?doc.data():{};
      $("tema_tema").value=data.temaText||"";
      $("tema_goal").value=data.temaGoal||"";
      $("tema_type").value=data.temaColor||"";
    });
  };
  $("temaBack").onclick = ()=> $("temaPage").classList.remove("active");

  $("tema_tema").oninput = $("tema_goal").onchange = $("tema_type").onchange = saveTema;

  function saveTema(){
    if(!selectedDateKey) return;
    dbRef.doc(selectedDateKey).set({
      temaText:$("tema_tema").value.trim(),
      temaGoal:$("tema_goal").value,
      temaColor:$("tema_type").value
    },{merge:true}).then(()=>renderCalendar());
  }
}

