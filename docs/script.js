/* script.js for "Мой контент-план" */
const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

if(typeof firebase==="undefined"||typeof db==="undefined"||typeof auth==="undefined"){
  console.error("Firebase не инициализирован. Проверьте firebase-config.js");
}

const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

window.addEventListener("load", () => {
  safeAssign("googleBtn","onclick", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch(e){ $("authError").textContent = e.message; }
  });
  safeAssign("logoutBtn","onclick", ()=> auth.signOut());

  auth.onAuthStateChanged(user => {
    if(!user){
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
      $("authSection").style.display = "block";
      return;
    }
    if(user.email !== OWNER_EMAIL){
      alert("Доступ только владельцу.");
      auth.signOut();
      return;
    }
    $("authSection").style.display = "none";
    $("app").style.display = "block";
    document.body.classList.add("calendar-page");
    initApp();
  });
});

function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = { burgundy:"#800020", orange:"#FFA500", green:"#006400", brown:"#8B4513", beige:"#F5F5DC" };

  let selectedDateKey = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;
  let currentEditorType = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  safeAssign("prevBtn","onclick",()=>{currentMonth--;if(currentMonth<0){currentMonth=11;currentYear--;}renderCalendar();});
  safeAssign("nextBtn","onclick",()=>{currentMonth++;if(currentMonth>11){currentMonth=0;currentYear++;}renderCalendar();});

  safeAssign("menuClose","onclick",()=>closeMenu());
  safeAssign("temaBack","onclick",()=>closeEditor("temaPage"));
  safeAssign("editorBack","onclick",()=>closeEditor("editorPage"));
  safeAssign("copyBtn","onclick",copyEditorText);

  safeAssign("menuBtnTema","onclick",()=>openEditor("tema"));
  safeAssign("menuBtnPost","onclick",()=>openEditor("post"));
  safeAssign("menuBtnReel","onclick",()=>openEditor("reel"));
  safeAssign("menuBtnStories","onclick",()=>openEditor("stories"));

  renderWeekdays(); renderCalendar();

  function renderWeekdays(){
    const wd=$("weekdays"); wd.innerHTML="";
    weekdays.forEach(d=>{const div=document.createElement("div");div.textContent=d;wd.appendChild(div);});
  }

  function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;

    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){
      const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e);
    }

    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key=`${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const cell=document.createElement("div");
      cell.className="day-cell";
      const num=document.createElement("div");
      num.className="day-number";
      num.textContent=d;
      cell.appendChild(num);

      cell.addEventListener("click",()=>openMenuForDate(key));
      dbRef.doc(key).get().then(docSnap=>{
        const data=docSnap.exists?docSnap.data():{};
        const c=data.temaColor||null;
        if(c&&colorMap[c]) cell.style.backgroundColor=colorMap[c]+"33";
      });
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    $("menuDateTitle").textContent = key;
    $("menu").classList.add("active");
    $("menu").style.display = "block";
  }
  function closeMenu(){
    $("menu").classList.remove("active");
    $("menu").style.display="none";
  }

  function openEditor(type){
    closeMenu();
    currentEditorType = type;
    selectedDateKey && (type==="tema" ? openTema() : openTextEditor(type));
  }

  // === ТЕМА ===
  function openTema(){
    $("temaPage").style.display="block";
    $("temaDateTitle").textContent = selectedDateKey;

    dbRef.doc(selectedDateKey).get().then(docSnap=>{
      const data=docSnap.exists?docSnap.data():{};
      $("tema_tema").value = data.temaText || "";
      $("tema_goal").value = data.temaGoal || "";
      $("tema_type").value = data.temaColor || "";
    });

    ["tema_tema","tema_goal","tema_type"].forEach(id=>{
      $(id).oninput = saveTemaDebounced;
      $(id).onchange = saveTemaDebounced;
    });
  }

  let temaTimer;
  function saveTemaDebounced(){
    clearTimeout(temaTimer);
    temaTimer = setTimeout(saveTema, 600);
  }
  function saveTema(){
    if(!selectedDateKey) return;
    const payload = {
      temaText: $("tema_tema").value.trim(),
      temaGoal: $("tema_goal").value,
      temaColor: $("tema_type").value
    };
    dbRef.doc(selectedDateKey).set(payload,{merge:true}).then(()=>renderCalendar());
  }

  // === POST / REEL / STORIES ===
  function openTextEditor(type){
    $("editorPage").style.display="block";
    $("editorTypeLabel").textContent = type.toUpperCase();
    $("editorDateTitle").textContent = selectedDateKey;

    if(!quill){
      quill = new Quill("#editorText", { theme:"snow", modules:{ toolbar:[["bold","italic"],["link","image"]] } });
      quill.on("text-change", saveEditorDebounced);
    }

    dbRef.doc(selectedDateKey).get().then(docSnap=>{
      const data=docSnap.exists?docSnap.data():{};
      quill.root.innerHTML = data[type] || "";
      renderPublishChecks(data[`${type}Platforms`] || {});
    });
  }

  let saveTimer;
  function saveEditorDebounced(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveEditor,600);
  }
  function saveEditor(){
    if(!selectedDateKey || !currentEditorType || !quill) return;
    const html = quill.root.innerHTML;
    const flags = {
      vk: $("chk_vk").checked,
      inst: $("chk_inst").checked,
      tg: $("chk_tg").checked
    };
    const payload = {};
    payload[currentEditorType] = html;
    payload[`${currentEditorType}Platforms`] = flags;
    dbRef.doc(selectedDateKey).set(payload,{merge:true}).then(()=>renderCalendar());
  }

  function renderPublishChecks(flags){
    const div = $("publishChecks");
    div.innerHTML = `
      <label><input type="checkbox" id="chk_vk"> ВК</label>
      <label><input type="checkbox" id="chk_inst"> Инст</label>
      <label><input type="checkbox" id="chk_tg"> ТГ</label>
    `;
    $("chk_vk").checked = !!flags.vk;
    $("chk_inst").checked = !!flags.inst;
    $("chk_tg").checked = !!flags.tg;
    ["chk_vk","chk_inst","chk_tg"].forEach(id=>{
      $(id).onchange = saveEditorDebounced;
    });
  }

  function closeEditor(panelId){
    $(panelId).style.display="none";
    renderCalendar();
  }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerText||"");
    const btn=$("copyBtn");
    btn.textContent="Скопировано!";
    setTimeout(()=>btn.textContent="Копировать",900);
  }
}
