const OWNER_EMAIL = "ylia.alei@gmail.com";
const db = firebase.firestore();
const auth = firebase.auth();

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

safeAssign("googleBtn","onclick",() => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt:"select_account" });
  auth.signInWithPopup(provider).catch(e => $("authError").textContent=e.message);
});

safeAssign("logoutBtn","onclick",() => auth.signOut());

auth.onAuthStateChanged(user => {
  if(!user){ document.querySelectorAll(".panel, #app").forEach(el=>el.style.display="none"); $("authSection").style.display="block"; return; }
  if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
  $("app").style.display="block";
  $("authSection").style.display="none";
  initApp();
});

const ICONS = { vk:"", inst:"", tg:"" }; // иконки убраны с календаря, будут только в редакторах

function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = { burgundy:"#800020", orange:"#FFA500", green:"#006400", brown:"#8B4513", beige:"#F5F5DC", free:"rgba(255,255,255,0.3)" };

  let selectedDateKey=null, selectedType=null;
  let currentMonth=(new Date()).getMonth(), currentYear=(new Date()).getFullYear();
  let quill=null;

  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  safeAssign("prevBtn","onclick",()=>{ currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
  safeAssign("nextBtn","onclick",()=>{ currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });
  safeAssign("menuClose","onclick",closeMenu);
  safeAssign("btnTema","onclick",()=>showEditor("tema"));
  safeAssign("btnStories","onclick",()=>showEditor("stories"));
  safeAssign("btnPost","onclick",()=>showEditor("post"));
  safeAssign("btnReel","onclick",()=>showEditor("reel"));
  safeAssign("temaBack","onclick",()=>hidePanel("temaPage"));
  safeAssign("editorBack","onclick",()=>hidePanel("editorPage"));

  renderWeekdays();
  renderCalendar();

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){
    const wd=$("weekdays"); wd.innerHTML="";
    weekdays.forEach(d=>{ const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;

    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){ cal.appendChild(document.createElement("div")).className="day-cell empty"; }

    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key=makeDateKey(currentYear,currentMonth,d);
      const cell=document.createElement("div");
      cell.className="day-cell";
      cell.dataset.date=key;
      cell.style.backgroundColor=colorMap.free;
      cell.onclick=()=>openMenuForDate(key);

      const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
      cell.appendChild(num);

      dbRef.doc(key).get().then(doc=>{
        if(doc.exists){ const data=doc.data(); const c=data.temaColor||"free"; cell.style.backgroundColor=colorMap[c]||colorMap.free; }
      });

      cal.appendChild(cell);
    }

    updateCalendarBackground(currentMonth);
  }

  function updateCalendarBackground(month){
    const container=$("calendarContainer");
    container.style.backgroundImage=( [8,9,10].includes(month) ? "url('https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg')" : "none");
  }

  function openMenuForDate(key){ selectedDateKey=key; $("menuDateTitle").textContent=formatReadable(key); showMenu(); }

  function showMenu(){ $("menu").classList.add("active"); }
  function closeMenu(){ $("menu").classList.remove("active"); }
  function showPanel(id){ $(id).classList.add("active"); }
  function hidePanel(id){ $(id).classList.remove("active"); }

  function showEditor(type){
    closeMenu();
    selectedType=type;
    $("editorDateTitle").textContent=formatReadable(selectedDateKey);
    $("editorTypeLabel").textContent=type.charAt(0).toUpperCase()+type.slice(1);
    showPanel("editorPage");

    if(!quill){
      quill=new Quill("#editorText",{theme:"snow",modules:{toolbar:"#editorToolbar"}});
      quill.on("text-change",saveEditorDebounced);
    }

    const checksDiv=$("publishChecks");
    if(checksDiv.childElementCount===0){
      checksDiv.innerHTML=`
        <label><input type="checkbox" id="chk_vk"> ВК</label>
        <label><input type="checkbox" id="chk_inst"> Инст</label>
        <label><input type="checkbox" id="chk_tg"> ТГ</label>
      `;
      ["chk_vk","chk_inst","chk_tg"].forEach(id=>{ const el=$(id); if(el) el.onchange=saveEditorDebounced; });
    }

    loadEditorData(selectedDateKey,type);
  }

  function loadEditorData(key,type){
    if(!quill) return;
    quill.setContents([]);
    dbRef.doc(key).get().then(doc=>{
      const data=doc.exists?doc.data():{};
      quill.root.innerHTML=data[type]||"";
      const flags=data[`${type}Platforms`]||{};
      $("chk_vk").checked=!!flags.vk;
      $("chk_inst").checked=!!flags.inst;
      $("chk_tg").checked=!!flags.tg;
    });
  }

  function saveEditor(){
    if(!selectedDateKey||!selectedType||!quill) return;
    const val=quill.root.innerHTML;
    const flags={ vk:$("chk_vk").checked, inst:$("chk_inst").checked, tg:$("chk_tg").checked };
    dbRef.doc(selectedDateKey).set({ [selectedType]:val, [`${selectedType}Platforms`]:flags },{merge:true})
      .then(()=>renderCalendar());
  }

  let timer;
  function saveEditorDebounced(){ clearTimeout(timer); timer=setTimeout(saveEditor,700); }

  // === Редактор "Тема" ===
  safeAssign("btnTema","onclick",()=>{
    closeMenu();
    $("temaDateTitle").textContent=formatReadable(selectedDateKey);
    showPanel("temaPage");
    dbRef.doc(selectedDateKey).get().then(doc=>{
      const data=doc.exists?doc.data():{};
      $("tema_tema").value=data.temaText||"";
      $("tema_goal").value=data.temaGoal||"";
      $("tema_type").value=data.temaColor||"";
    });
  });

  $("tema_tema").addEventListener("input",e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; saveTema(); });
  $("tema_goal").addEventListener("change",saveTema);
  $("tema_type").addEventListener("change",saveTema);

  function saveTema(){
    if(!selectedDateKey) return;
    const data={ temaText:$("tema_tema").value.trim(), temaGoal:$("tema_goal").value, temaColor:$("tema_type").value };
    dbRef.doc(selectedDateKey).set(data,{merge:true}).then(()=>renderCalendar());
  }
}


