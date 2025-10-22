/* script.js — исправленная и полная версия.
   Требует глобальных firebase, db, auth из firebase-config.js */

const OWNER_EMAIL = "ylia.alei@gmail.com";

const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

function createIcon(src, alt, active){
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.style.width = "22px";
  img.style.height = "22px";
  img.style.opacity = active ? "1" : "0.3";
  img.style.filter = active ? "none" : "grayscale(100%)";
  img.title = alt;
  return img;
}

/* Авторизация кнопки (зависит от глобального auth) */
safeAssign("googleBtn","onclick", ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  auth.signInWithPopup(provider).catch(e => { const el = $("authError"); if(el) el.textContent = e.message; });
});
safeAssign("logoutBtn","onclick", ()=> auth.signOut());

/* Слежение за аутентификацией */
auth.onAuthStateChanged(user => {
  if(!user){
    const authSection = $("authSection"); if(authSection) authSection.style.display = "block";
    const app = $("app"); if(app) app.style.display = "none";
    return;
  }
  if(user.email !== OWNER_EMAIL){
    alert("Доступ только владельцу.");
    auth.signOut();
    return;
  }
  const authSection = $("authSection"); if(authSection) authSection.style.display = "none";
  const app = $("app"); if(app) app.style.display = "block";
  initApp();
});

/* Вспомогательная: hex -> rgba с альфой */
function hexToRgba(hex, alpha){
  if(!hex || hex[0] !== "#" || (hex.length !== 7 && hex.length !== 4)) return `rgba(255,255,255,${alpha})`;
  // поддержка #rgb (не критично, но на будущее)
  if(hex.length === 4){
    const r = hex[1]+hex[1], g = hex[2]+hex[2], b = hex[3]+hex[3];
    return `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},${alpha})`;
  }
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Основная инициализация приложения */
function initApp(){
  const dbRef = db.collection("contentPlanner");

  // базовые цвета (hex) — используем для преобразования в rgba при рендере
  const colorMap = {
    burgundy: "#800020",
    orange: "#FFA500",
    green: "#006400",
    brown: "#8B4513",
    beige: "#F5F5DC",
    free: "#ffffff"
  };

  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  let quill = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  /* Навигация кнопки */
  safeAssign("prevBtn","onclick", ()=>{ currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); updateBackground(); });
  safeAssign("nextBtn","onclick", ()=>{ currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); updateBackground(); });

  safeAssign("menuClose","onclick", closeMenu);

  /* Меню: кнопки редакторов */
  safeAssign("btnTema","onclick", ()=> showEditor("tema"));
  safeAssign("btnStories","onclick", ()=> showEditor("stories"));
  safeAssign("btnPost","onclick", ()=> showEditor("post"));
  safeAssign("btnReel","onclick", ()=> showEditor("reel"));

  safeAssign("temaBack","onclick", ()=> hidePanel("temaPage"));
  safeAssign("editorBack","onclick", ()=> hidePanel("editorPage"));
  safeAssign("copyBtn","onclick", copyEditorText);

  /* Отрисовки */
  renderWeekdays();
  renderCalendar();
  updateBackground();

  /* Вспомогательные */
  function pad(n){ return String(n).padStart(2,"0"); }
  function makeKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ if(!key) return ""; const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit", month:"long", year:"numeric"}); }

  function renderWeekdays(){
    const wd = $("weekdays"); if(!wd) return;
    wd.innerHTML = "";
    weekdays.forEach(day => { const div = document.createElement("div"); div.textContent = day; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar"); if(!cal) return;
    cal.innerHTML = "";
    const monthLabel = $("monthYear"); if(monthLabel) monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // leading empty cells
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);
    for(let i=0;i<leading;i++){
      const empty = document.createElement("div");
      empty.className = "day-cell empty";
      cal.appendChild(empty);
    }

    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = makeKey(currentYear, currentMonth, d);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.date = key;

      const num = document.createElement("div");
      num.className = "day-number";
      num.textContent = d;
      cell.appendChild(num);

      // дефолтный bg
      cell.style.backgroundColor = "rgba(255,255,255,0.12)";

      // загрузим тему из БД и установим полупрозрачную заливку
      dbRef.doc(key).get().then(doc => {
        if(doc.exists){
          const data = doc.data();
          const cKey = data.temaColor || "free";
          const hex = colorMap[cKey] || colorMap.free;
          const rgba = hexToRgba(hex, 0.38);
          cell.style.backgroundColor = rgba;
        } else {
          // пустой
          cell.style.backgroundColor = "rgba(255,255,255,0.12)";
        }
      }).catch(e => {
        console.warn("Ошибка чтения дня:", key, e);
      });

      cell.onclick = () => openMenuForDate(key);
      cal.appendChild(cell);
    }
  }

  function updateBackground(){
    // покрытие фоном только для сент/окт/ноя (8,9,10)
    const page = $("calendarPage");
    if(!page) return;
    if([8,9,10].includes(currentMonth)){
      page.style.backgroundImage = "url('https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg')";
      page.style.backgroundSize = "cover";
      page.style.backgroundPosition = "center";
    } else {
      page.style.backgroundImage = "none";
    }
  }

  /* Меню / редакторы */
  function openMenuForDate(key){
    selectedDateKey = key;
    const menuTitle = $("menuDateTitle"); if(menuTitle) menuTitle.textContent = formatReadable(key);
    const menu = $("menu"); if(menu) menu.classList.add("active");
    renderMenuIconsForDate(key);
  }
  function closeMenu(){ const menu = $("menu"); if(menu) menu.classList.remove("active"); }
  function showPanel(id){ const el = $(id); if(el) el.classList.add("active"); }
  function hidePanel(id){ const el = $(id); if(el) el.classList.remove("active"); }

  /* Открыть редактор: тема — отдельная панель, остальные — общий editorPage (Quill) */
  function showEditor(type){
    if(!selectedDateKey){
      alert("Сначала выберите дату.");
      return;
    }
    selectedType = type;
    if(type === "tema"){
      // Тема: заполняем поля и показываем temaPage
      const title = $("temaDateTitle"); if(title) title.textContent = formatReadable(selectedDateKey);
      dbRef.doc(selectedDateKey).get().then(doc=>{
        const data = doc.exists ? doc.data() : {};
        const tta = $("tema_tema"); if(tta) tta.value = data.temaText || "";
        const tgoal = $("tema_goal"); if(tgoal) tgoal.value = data.temaGoal || "";
        const ttype = $("tema_type"); if(ttype) ttype.value = data.temaColor || "";
        showPanel("temaPage");
      }).catch(e => console.warn("load tema error", e));
      closeMenu();
      return;
    }

    // Остальные редакторы: Post / Reel / Stories
    const title = $("editorDateTitle"); if(title) title.textContent = formatReadable(selectedDateKey);
    const etype = $("editorTypeLabel"); if(etype) etype.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    showPanel("editorPage");
    closeMenu();

    // init quill, если нужно
    if(!quill){
      quill = new Quill("#editorText", { theme: "snow", modules: { toolbar: "#editorToolbar" } });
      quill.on("text-change", saveEditorDebounced);
    }

    // ensure publish checks exist
    const checksDiv = $("publishChecks");
    if(checksDiv && checksDiv.childElementCount === 0){
      checksDiv.innerHTML = `
        <label><input type="checkbox" id="chk_vk"> ВК</label>
        <label><input type="checkbox" id="chk_inst"> Инст</label>
        <label><input type="checkbox" id="chk_tg"> ТГ</label>
      `;
      ["chk_vk","chk_inst","chk_tg"].forEach(id => {
        const el = $(id); if(el) el.onchange = saveEditorDebounced;
      });
    }

    // load data for this type
    loadEditorData(selectedDateKey, type);
  }

  function loadEditorData(key, type){
    if(!key) return;
    dbRef.doc(key).get().then(doc => {
      const data = doc.exists ? doc.data() : {};
      if(!quill) return;
      quill.root.innerHTML = data[type] || "";
      const flags = data[`${type}Platforms`] || {};
      const vvk = $("chk_vk"); const vinst = $("chk_inst"); const vtg = $("chk_tg");
      if(vvk) vvk.checked = !!flags.vk;
      if(vinst) vinst.checked = !!flags.inst;
      if(vtg) vtg.checked = !!flags.tg;
    }).catch(e => console.warn("loadEditorData error", e));
  }

  function renderMenuIconsForDate(key){
    dbRef.doc(key).get().then(doc=>{
      const data = doc.exists ? doc.data() : {};
      ["post","reel","stories"].forEach(type => {
        const flags = data[`${type}Platforms`] || {};
        const divId = `${type}Icons`;
        const holder = $(divId);
        if(!holder) return;
        holder.innerHTML = "";
        holder.appendChild(createIcon(ICONS.vk, "VK", !!flags.vk));
        holder.appendChild(createIcon(ICONS.inst, "Instagram", !!flags.inst));
        holder.appendChild(createIcon(ICONS.tg, "Telegram", !!flags.tg));
      });
    }).catch(e => console.warn("renderMenuIconsForDate", e));
  }

  function saveEditor(){
    if(!selectedDateKey || !selectedType || !quill) return;
    const val = quill.root.innerHTML;
    const flags = {
      vk: !!($("chk_vk") && $("chk_vk").checked),
      inst: !!($("chk_inst") && $("chk_inst").checked),
      tg: !!($("chk_tg") && $("chk_tg").checked)
    };
    const payload = { [selectedType]: val, [`${selectedType}Platforms`]: flags };
    dbRef.doc(selectedDateKey).set(payload, { merge: true }).then(()=> {
      renderMenuIconsForDate(selectedDateKey);
      // обновим календарь ячейку
      renderCalendar();
    }).catch(e => console.warn("saveEditor error", e));
  }

  let saveTimer = null;
  function saveEditorDebounced(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveEditor, 700); }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(()=> {
      const btn = $("copyBtn");
      if(!btn) return;
      const old = btn.textContent;
      btn.textContent = "Скопировано!";
      setTimeout(()=> btn.textContent = old, 900);
    }).catch(e => console.warn(e));
  }

  /* === Редактор "Тема" === */
  const temaTextarea = $("tema_tema");
  if(temaTextarea){
    temaTextarea.addEventListener("input", e => {
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;
      saveTemaDebounced();
    });
  }
  const temaGoal = $("tema_goal"); if(temaGoal) temaGoal.addEventListener("change", saveTemaDebounced);
  const temaType = $("tema_type"); if(temaType) temaType.addEventListener("change", saveTemaDebounced);

  function saveTema(){
    if(!selectedDateKey) return;
    const payload = {
      temaText: ($("tema_tema") && $("tema_tema").value.trim()) || "",
      temaGoal: ($("tema_goal") && $("tema_goal").value) || "",
      temaColor: ($("tema_type") && $("tema_type").value) || ""
    };
    dbRef.doc(selectedDateKey).set(payload, { merge: true }).then(()=> {
      // обновить календарь
      renderCalendar();
    }).catch(e => console.warn("saveTema error", e));
  }
  let temaTimer = null;
  function saveTemaDebounced(){ clearTimeout(temaTimer); temaTimer = setTimeout(saveTema, 450); }

} /* end initApp() */
