const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

safeAssign("googleBtn","onclick",()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  auth.signInWithPopup(provider).catch(e=>$("authError").textContent=e.message);
});
safeAssign("logoutBtn","onclick",()=>auth.signOut());

auth.onAuthStateChanged(user=>{
  if(!user){ $("authSection").style.display="block"; $("app").style.display="none"; return; }
  if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу."); auth.signOut(); return; }
  $("authSection").style.display="none"; $("app").style.display="block";
  initApp();
});

function initApp(){
  const dbRef=db.collection("contentPlanner");
  const colorMap={burgundy:"#800020",orange:"#FFA500",green:"#006400",brown:"#8B4513",beige:"#F5F5DC",free:"#fff"};
  const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  let selectedDateKey=null,selectedType=null,quill=null;
  let currentMonth=(new Date()).getMonth(),currentYear=(new Date()).getFullYear();

  safeAssign("prevBtn","onclick",()=>{currentMonth--;if(currentMonth<0){currentMonth=11;currentYear--;}renderCalendar();});
  safeAssign("nextBtn","onclick",()=>{currentMonth++;if(currentMonth>11){currentMonth=0;currentYear++;}renderCalendar();});
  safeAssign("menuClose","onclick",()=>$("menu").classList.remove("active"));
  safeAssign("editorBack","onclick",()=>hidePanel("editorPage"));
  safeAssign("temaBack","onclick",()=>hidePanel("temaPage"));
  safeAssign("copyBtn","onclick",copyEditorText);

  safeAssign("btnTema","onclick",()=>openTema());
  safeAssign("btnPost","onclick",()=>showEditor("post"));
  safeAssign("btnReel","onclick",()=>showEditor("reel"));
  safeAssign("btnStories","onclick",()=>showEditor("stories"));

  renderWeekdays();
  renderCalendar();

  function pad(n){return String(n).padStart(2,"0");}
  function makeKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
  function formatDate(key){const [y,m,d]=key.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"});}

  function renderWeekdays(){
    const w=$("weekdays"); w.innerHTML=""; weekdays.forEach(d=>{const div=document.createElement("div");div.textContent=d;w.appendChild(div);});
  }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const first=new Date(currentYear,currentMonth,1).getDay();
    const leading=(first===0?6:first-1);
    for(let i=0;i<leading;i++){const e=document.createElement("div");e.className="day-cell empty";cal.appendChild(e);}
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();

    for(let d=1;d<=daysInMonth;d++){
      const key=makeKey(currentYear,currentMonth,d);
      const cell=document.createElement("div");
      cell.className="day-cell"; cell.dataset.date=key;
      const num=document.createElement("div"); num.className="day-number"; num.textContent=d; cell.appendChild(num);
      dbRef.doc(key).get().then(doc=>{
        const data=doc.exists?doc.data():{};
        const c=data.temaColor||"free";
        const base=colorMap[c]||"#fff";
        cell.style.backgroundColor=hexToRgba(base,0.35);
      });
      cell.onclick=()=>{selectedDateKey=key;$("menuDateTitle").textContent=formatDate(key);$("menu").classList.add("active");};
      cal.appendChild(cell);
    }
  }

  function showEditor(type){
    $("menu").classList.remove("active");
    selectedType=type;
    $("editorDateTitle").textContent=formatDate(selectedDateKey);
    $("editorTypeLabel").textContent=type.charAt(0).toUpperCase()+type.slice(1);
    showPanel("editorPage");

    if(!quill){ quill=new Quill("#editorText",{theme:"snow",modules:{toolbar:"#editorToolbar"}}); quill.on("text-change",saveDebounced); }

    const checks=$("publishChecks");
    if(checks.childElementCount===0){
      checks.innerHTML=`<label><input type="checkbox" id="chk_vk"> ВК</label><label><input type="checkbox" id="chk_inst"> Инст</label><label><input type="checkbox" id="chk_tg"> ТГ</label>`;
      ["chk_vk","chk_inst","chk_tg"].forEach(id=>$(id).onchange=saveDebounced);
    }
    loadEditor();
  }

  function loadEditor(){
    if(!quill)return;
    dbRef.doc(selectedDateKey).get().then(doc=>{
      const data=doc.exists?doc.data():{};
      quill.root.innerHTML=data[selectedType]||"";
      const flags=data[`${selectedType}Platforms`]||{};
      $("chk_vk").checked=!!flags.vk;
      $("chk_inst").checked=!!flags.inst;
      $("chk_tg").checked=!!flags.tg;
    });
  }

  function saveEditor(){
    if(!selectedDateKey||!selectedType||!quill)return;
    const val=quill.root.innerHTML;
    const flags={vk:$("chk_vk").checked,inst:$("chk_inst").checked,tg:$("chk_tg").checked};
    dbRef.doc(selectedDateKey).set({[selectedType]:val,[`${selectedType}Platforms`]:flags},{merge:true});
  }
  let timer; function saveDebounced(){clearTimeout(timer);timer=setTimeout(saveEditor,700);}
  function copyEditorText(){navigator.clipboard.writeText(quill.root.innerText||"");alert("Скопировано.");}

  function openTema(){
    $("menu").classList.remove("active");
    $("temaDateTitle").textContent=formatDate(selectedDateKey);
    showPanel("temaPage");
    dbRef.doc(selectedDateKey).get().then(doc=>{
      const data=doc.exists?doc.data():{};
      $("tema_tema").value=data.tema_tema||"";
      $("tema_goal").value=data.tema_goal||"";
      $("tema_type").value=data.temaColor||"";
    });
  }

  ["tema_tema","tema_goal","tema_type"].forEach(id=>$(id).onchange=saveTema);
  function saveTema(){
    const tema=$("tema_tema").value, goal=$("tema_goal").value, type=$("tema_type").value;
    dbRef.doc(selectedDateKey).set({tema_tema:tema,tema_goal:goal,temaColor:type},{merge:true});
    renderCalendar();
  }

  function showPanel(id){hideAll();$(id).classList.add("active");}
  function hidePanel(id){$(id).classList.remove("active");$("menu").classList.add("active");}
  function hideAll(){["temaPage","editorPage"].forEach(x=>$(x).classList.remove("active"));}
  function hexToRgba(hex,opacity){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${opacity})`;}
}
