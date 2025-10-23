/* script.js - исправлен для удаления иконок из календаря */
const OWNER_EMAIL = "ylia.alei@gmail.com";
function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

// Ensure firebase initialized
if(typeof firebase === "undefined" || typeof db === "undefined" || typeof auth === "undefined"){
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
    } catch(e){
      $("authError").textContent = e.message;
    }
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
  const colorMap = {
    burgundy: "#800020",
    orange: "#FFA500",
    green: "#006400",
    brown: "#8B4513",
    beige: "#F5F5DC"
  };
  function hexToRgba(hex, alpha){
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  let selectedDateKey = null;
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  let quill = null;
  let currentEditorType = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  // Nav buttons
  safeAssign("prevBtn","onclick", ()=> { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
  safeAssign("nextBtn","onclick", ()=> { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });

  safeAssign("menuClose","onclick", closeMenu);
  safeAssign("menuBtnTema","onclick", ()=> openEditorFromMenu("tema"));
  safeAssign("menuBtnPost","onclick", ()=> openEditorFromMenu("post"));
  safeAssign("menuBtnReel","onclick", ()=> openEditorFromMenu("reel"));
  safeAssign("menuBtnStories","onclick", ()=> openEditorFromMenu("stories"));

  safeAssign("temaBack","onclick", ()=> closeEditorPanel("temaPage"));
  safeAssign("editorBack","onclick", ()=> closeEditorPanel("editorPage"));
  safeAssign("copyBtn","onclick", copyEditorText);

  renderWeekdays();
  renderCalendar();

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){
    const wd = $("weekdays"); wd.innerHTML="";
    weekdays.forEach(d => { const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar"); cal.innerHTML = "";
    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);
    for(let i=0;i<leading;i++){
      const e = document.createElement("div");
      e.className = "day-cell empty";
      cal.appendChild(e);
    }

    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = makeDateKey(currentYear, currentMonth, d);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.date = key;

      const num = document.createElement("div");
      num.className = "day-number";
      num.textContent = d;
      cell.appendChild(num);

      // Remove icons from cells (no div.pub-icons added here!)

      cell.style.backgroundColor = "rgba(255,255,255,0.04)";
      cell.addEventListener("click", ()=> openMenuForDate(key));

      dbRef.doc(key).get().then(docSnap => {
        const data = docSnap.exists ? docSnap.data() : {};
        const c = data.temaColor || null;
        if(c && colorMap[c]) {
          cell.style.backgroundColor = hexToRgba(colorMap[c], 0.28);
        }
      }).catch(e => console.error(e));

      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    $("menuDateTitle").textContent = formatReadable(key);
    dbRef.doc(key).get().then(docSnap => {
      const data = docSnap.exists ? docSnap.data() : {};
      setMenuIcons("menuTemaIcons", data.temaPlatforms || {});
      setMenuIcons("menuPostIcons", data.postPlatforms || {});
      setMenuIcons("menuReelIcons", data.reelPlatforms || {});
      setMenuIcons("menuStoriesIcons", data.storiesPlatforms || {});
      $("menu").classList.add("active");
      $("menu").style.display = "block";
    }).catch(e => {
      console.error(e);
      setMenuIcons("menuTemaIcons", {});
      setMenuIcons("menuPostIcons", {});
      setMenuIcons("menuReelIcons", {});
      setMenuIcons("menuStoriesIcons", {});
      $("menu").classList.add("active");
      $("menu").style.display = "block";
    });
  }

  function setMenuIcons(containerId, flags){
    const div = $(containerId);
    if(!div) return;
    div.innerHTML = "";
    const vk = document.createElement("img"); vk.src = ICONS.vk; vk.alt = "VK";
    const inst = document.createElement("img"); inst.src = ICONS.inst; inst.alt = "Instagram";
    const tg = document.createElement("img"); tg.src = ICONS.tg; tg.alt = "Telegram";
    [vk,inst,tg].forEach(img => {
      img.style.width="22px";
      img.style.height="22px";
      img.style.opacity="0.25";
      img.style.filter="grayscale(100%)";
    });
    if(flags.vk) { vk.classList.add("active"); vk.style.opacity="1"; vk.style.filter="none"; }
    if(flags.inst) { inst.classList.add("active"); inst.style.opacity="1"; inst.style.filter="none"; }
    if(flags.tg) { tg.classList.add("active"); tg.style.opacity="1"; tg.style.filter="none"; }
    div.appendChild(vk);
    div.appendChild(inst);
    div.appendChild(tg);
  }

  function closeMenu(){
    $("menu").classList.remove("active");
    $("menu").style.display = "none";
  }
 
  function openEditorFromMenu(type){
    closeMenu();
    currentEditorType = type;
    if(type === "tema"){
      hideCalendarUI();
      $("temaDateTitle").textContent = formatReadable(selectedDateKey);
      $("temaPage").style.display = "block";
      dbRef.doc(selectedDateKey).get().then(docSnap => {
        const data = docSnap.exists ? docSnap.data() : {};
        $("tema_tema").value = data.temaText || "";
        $("tema_goal").value = data.temaGoal || "";
        $("tema_type").value = data.temaColor || "";
      }).catch(e => console.error(e));
    } else {
      hideCalendarUI();
      $("editorPage").style.display = "block";
      $("editorTypeLabel").textContent = type.charAt(0).toUpperCase() + type.slice(1);
      $("editorDateTitle").textContent = formatReadable(selectedDateKey);
      if(!quill){
        quill = new Quill("#editorText", { theme: "snow", modules: { toolbar: [["bold","italic"], ["link","image"]] } });
        quill.on("text-change", ()=> saveEditorDebounced());
      }
      dbRef.doc(selectedDateKey).get().then(docSnap => {
        const data = docSnap.exists ? docSnap.data() : {};
        quill.root.innerHTML = data[type] || "";
        renderPublishChecks(data[`${type}Platforms`] || {});
      }).catch(e => console.error(e));
    }
    document.body.classList.remove("calendar-page");
  }

  function hideCalendarUI(){
    $("calendarBackground").style.display = "none";
    $("colorLegend").style.display = "none";
    $("calendarNav").style.display = "none";
  }
  function showCalendarUI(){
    $("calendarBackground").style.display = "";
    $("colorLegend").style.display = "";
    $("calendarNav").style.display = "";
    document.body.classList.add("calendar-page");
  }

  function closeEditorPanel(panelId){
    $(panelId).style.display = "none";
    showCalendarUI();
    renderCalendar();
  }

  function renderPublishChecks(flags){
    const checks = $("publishChecks");
    checks.innerHTML = `
      <label><input type="checkbox" id="chk_vk"> ВК</label>
      <label><input type="checkbox" id="chk_inst"> Инст</label>
      <label><input type="checkbox" id="chk_tg"> ТГ</label>
    `;
    $("chk_vk").checked = !!flags.vk;
    $("chk_inst").checked = !!flags.inst;
    $("chk_tg").checked = !!flags.tg;
    ["chk_vk","chk_inst","chk_tg"].forEach(id => {
      $(id).onchange = saveEditorDebounced;
    });
  }

  function saveEditor(){
    if(!selectedDateKey || !currentEditorType || !quill) return;
    const content = quill.root.innerHTML;
    const flags = { vk: !!$("chk_vk") && $("chk_vk").checked, inst: !!$("chk_inst") && $("chk_inst").checked, tg: !!$("chk_tg") && $("chk_tg").checked };
    const payload = {};
    payload[currentEditorType] = content;
    payload[`${currentEditorType}Platforms`] = flags;
    dbRef.doc(selectedDateKey).set(payload, { merge: true }).then(()=> {
      renderCalendar();
    }).catch(e => console.error(e));
  }
  let saveTimer;
  function saveEditorDebounced(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveEditor, 600); }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerText || "");
    const btn = $("copyBtn");
    btn.textContent = "Скопировано!";
    setTimeout(()=> btn.textContent = "Копировать", 900);
  }

  // TEMA save handlers
  $("tema_tema").addEventListener("input", e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; saveTemaDebounced(); });
  $("tema_goal").addEventListener("change", saveTemaDebounced);
  $("tema_type").addEventListener("change", saveTemaDebounced);

  let temaTimer;
  function saveTemaDebounced(){ clearTimeout(temaTimer); temaTimer = setTimeout(saveTema, 600); }
  function saveTema(){
    if(!selectedDateKey) return;
    const payload = { temaText: $("tema_tema").value.trim(), temaGoal: $("tema_goal").value, temaColor: $("tema_type").value, temaPlatforms: {} };
    dbRef.doc(selectedDateKey).get().then(docSnap => {
      const prev = docSnap.exists ? docSnap.data() : {};
      if(prev.temaPlatforms) payload.temaPlatforms = prev.temaPlatforms;
      return dbRef.doc(selectedDateKey).set(payload, { merge: true });
    }).then(()=> renderCalendar()).catch(e => console.error(e));
  }
}
