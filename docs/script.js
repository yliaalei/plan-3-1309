const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id) { return document.getElementById(id); }
function safeAssign(id, prop, handler) { const el = $(id); if(el) el[prop] = handler; }

if(typeof firebase === "undefined" || typeof db === "undefined" || typeof auth === "undefined"){
  console.error("Firebase не инициализирован. Проверьте firebase-config.js");
}

const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

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
    // если никто не вошёл — показываем экран входа
    document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
    $("authSection").style.display = "block";
    return;
  }

  // если вошёл пользователь
  $("authSection").style.display = "none";
  $("app").style.display = "block";
  document.body.classList.add("calendar-page");

  if(user.email === OWNER_EMAIL){
    // владелец (ты) — видит и может редактировать
    initApp();
  } else {
    // обычные пользователи
    showPayButton(); // показываем кнопку "Оплатить 10₽"
    initApp(true);   // передаём параметр "только просмотр"
  }
});

function initApp(readOnly = false) {
  const dbRef = db.collection("contentPlanner");
  const colorMap = { 
    burgundy:"#800020", 
    orange:"#FFA500", 
    green:"#006400", 
    brown:"#8B4513", 
    beige:"#F5F5DC" 
  };

  let selectedDateKey = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;
  let currentEditorType = null;

  // 🔒 Если пользователь не владелец — скрываем элементы редактирования
  if (readOnly) {
    document.querySelectorAll(".menuBtn, #editorPage, #temaPage").forEach(el => {
      if (el) el.style.display = "none";
    });
  }
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

    // Установка фона по месяцу
    document.body.style.backgroundImage = `url('${monthBackgrounds[currentMonth]}')`;

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

      // Подсветка по теме
      dbRef.doc(key).get().then(docSnap=>{
        if(!docSnap.exists) return;
        const data = docSnap.data();
        const c = data.temaColor || null;
        if(c && colorMap[c]) cell.style.backgroundColor = colorMap[c]+"33"; // прозрачный цвет
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
}); 
