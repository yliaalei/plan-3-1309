/* script.js — content planner (Google-only owner) */
/* Owner email */
const OWNER_EMAIL = "ylia.alei@gmail.com";

/* Safe helpers */
function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){
  const el = $(id);
  if(el) el[prop] = handler;
}

/* AUTH handling (Google only) */
safeAssign("googleBtn", "onclick", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  auth.signInWithPopup(provider).catch(e => { const el = $("authError"); if(el) el.textContent = e.message; });
});

/* Logout */
safeAssign("logoutBtn", "onclick", () => { auth.signOut(); });

/* on auth change */
auth.onAuthStateChanged(async user => {
  if(!user){
    // show auth
    document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
    const authSec = $("authSection"); if(authSec) authSec.style.display = "block";
    return;
  }

  // if not owner, sign out and show message
  if(user.email !== OWNER_EMAIL){
    alert("Доступ к редактированию имеет только владелец.");
    auth.signOut();
    return;
  }

  // owner logged in — show app
  const app = $("app"); if(app) app.style.display = "block";
  const authSec = $("authSection"); if(authSec) authSec.style.display = "none";

  // initialize app
  initApp();
});

/* Utility to create image icon nodes */
function createIcon(src, alt){
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  img.loading = "lazy";
  return img;
}

/* Icon URLs (small PNGs from free CDN) */
const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

/* MAIN APP */
function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMap = { free:"#fff", family:"#c8f7e8", health:"#fff7c2", work:"#ffd7ea", hobby:"#e8e1ff" };
  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  let quill = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  /* helpers */
  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  /* bind nav safely */
  safeAssign("prevBtn","onclick", () => { currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); });
  safeAssign("nextBtn","onclick", () => { currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); });
  safeAssign("menuClose","onclick", closeMenu);
  safeAssign("btnTema","onclick", showTema);
  safeAssign("btnStories","onclick", () => showEditor("stories"));
  safeAssign("btnPost","onclick", () => showEditor("post"));
  safeAssign("btnReel","onclick", () => showEditor("reel"));
  safeAssign("temaBack","onclick", () => hidePanel("temaPage"));
  safeAssign("editorBack","onclick", () => hidePanel("editorPage"));
  safeAssign("copyBtn","onclick", copyEditorText);

  renderWeekdays();
  renderCalendar();

  function renderWeekdays(){
    const wd = $("weekdays"); if(!wd) return;
    wd.innerHTML = "";
    weekdays.forEach(d => { const div = document.createElement("div"); div.textContent = d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar"); if(!cal) return;
    cal.innerHTML = "";
    const monthTitle = $("monthYear"); if(monthTitle) monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);
    for(let i=0;i<leading;i++){ const empty = document.createElement("div"); empty.className="day-cell empty"; cal.appendChild(empty); }

    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const key = makeDateKey(currentYear, currentMonth, d);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.date = key;
      const num = document.createElement("div");
      num.className = "day-number"; num.textContent = d; cell.appendChild(num);

      // pub-icons container
      const icons = document.createElement("div");
      icons.className = "pub-icons";
      icons.dataset.for = key;
      cell.appendChild(icons);

      cell.style.backgroundColor = colorMap.free;
      cell.addEventListener("click", () => openMenuForDate(key));
      // load cell metadata
      loadDataForCell(key, cell);
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    const menuTitle = $("menuDateTitle"); if(menuTitle) menuTitle.textContent = formatReadable(key);
    showMenu();
  }
  function showMenu(){ const m = $("menu"); if(m) m.classList.add("active"); }
  function closeMenu(){ const m = $("menu"); if(m) m.classList.remove("active"); }

  function showTema(){ closeMenu(); selectedType = "tema"; const t = $("temaDateTitle"); if(t) t.textContent = formatReadable(selectedDateKey); showPanel("temaPage"); loadTemaData(selectedDateKey); }

  function showEditor(type){
    closeMenu();
    selectedType = type;
    const edtTitle = $("editorDateTitle"); if(edtTitle) edtTitle.textContent = formatReadable(selectedDateKey);
    const typeLabel = $("editorTypeLabel"); if(typeLabel) typeLabel.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    showPanel("editorPage");

    // insert publish checks if not present
    let checkContainer = $("publishChecks");
    if(!checkContainer){
      const toolbar = $("editorToolbar");
      checkContainer = document.createElement("div");
      checkContainer.id = "publishChecks";
      checkContainer.innerHTML = `
        <label><input type="checkbox" id="chk_vk"> <img src="${ICONS.vk}" alt="vk" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;">ВК</label>
        <label><input type="checkbox" id="chk_inst"> <img src="${ICONS.inst}" alt="inst" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;">Инст</label>
        <label><input type="checkbox" id="chk_tg"> <img src="${ICONS.tg}" alt="tg" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;">ТГ</label>
      `;
      if(toolbar && toolbar.parentNode) toolbar.parentNode.insertBefore(checkContainer, toolbar.nextSibling);
      // attach handlers
      ["chk_vk","chk_inst","chk_tg"].forEach(id => {
        const el = $(id);
        if(el) el.onchange = saveEditorDebounced;
      });
    }

    if(!quill){
      quill = new Quill("#editorText", { theme: "snow", modules: { toolbar: "#editorToolbar" } });
      quill.root.addEventListener("click", e => {
        if(e.target.tagName === "A"){ e.preventDefault(); window.open(e.target.href, "_blank"); }
      });
      quill.on("text-change", saveEditorDebounced);
    }

    loadEditorData(selectedDateKey, type);
  }

  function showPanel(id){ const el = $(id); if(el) el.classList.add("active"); }
  function hidePanel(id){ const el = $(id); if(el) el.classList.remove("active"); }

  function loadDataForCell(key, cell){
    // fetch doc and set color + icons
    dbRef.doc(key).get().then(doc => {
      if(!doc.exists) return;
      const d = doc.data();
      const c = d.temaColor || "free";
      cell.style.backgroundColor = colorMap[c] || colorMap.free;

      // clear icons
      const icoWrap = cell.querySelector(".pub-icons");
      if(icoWrap) icoWrap.innerHTML = "";

      // check each content type for platforms
      const types = ["post","stories","reel"];
      types.forEach(type => {
        const p = d[`${type}Platforms`];
        if(p){
          if(p.vk) icoWrap.appendChild(createIcon(ICONS.vk, "vk"));
          if(p.inst) icoWrap.appendChild(createIcon(ICONS.inst, "inst"));
          if(p.tg) icoWrap.appendChild(createIcon(ICONS.tg, "tg"));
        }
      });
    }).catch(err => {
      console.warn("loadDataForCell error", err);
    });
  }

  function loadTemaData(key){
    ["tema_tema","tema_goal","tema_activity"].forEach(id => { const el = $(id); if(el) el.value = ""; });
    dbRef.doc(key).get().then(doc => {
      if(!doc.exists) return;
      const d = doc.data();
      if(d.tema) { const el = $("tema_tema"); if(el) el.value = d.tema; }
      if(d.goal) { const el = $("tema_goal"); if(el) el.value = d.goal; }
      if(d.activity) { const el = $("tema_activity"); if(el) el.value = d.activity; }
      const c = d.temaColor || "free";
      const r = document.querySelector(`input[name="temaColor"][value="${c}"]`);
      if(r) r.checked = true;
    });
  }

  function saveTema(){
    if(!selectedDateKey) return;
    const tema = $("tema_tema") ? $("tema_tema").value : "";
    const goal = $("tema_goal") ? $("tema_goal").value : "";
    const activity = $("tema_activity") ? $("tema_activity").value : "";
    const temaColor = (document.querySelector('input[name="temaColor"]:checked')||{}).value || "free";
    dbRef.doc(selectedDateKey).set({ tema, goal, activity, temaColor }, { merge: true });
    updateCellColor(selectedDateKey, temaColor);
  }
  let temaTimer;
  function saveTemaDebounced(){ clearTimeout(temaTimer); temaTimer = setTimeout(saveTema, 500); }

  function updateCellColor(key, color){
    const el = document.querySelector(`.day-cell[data-date="${key}"]`);
    if(el) el.style.backgroundColor = colorMap[color] || colorMap.free;
  }

  function loadEditorData(key, type){
    if(!quill) return;
    quill.setContents([]);
    dbRef.doc(key).get().then(doc => {
      if(!doc.exists){
        // reset checks
        ["chk_vk","chk_inst","chk_tg"].forEach(id => { const el=$(id); if(el) el.checked = false; });
        return;
      }
      const d = doc.data();
      if(d[type]) { quill.root.innerHTML = d[type]; }
      const flags = d[`${type}Platforms`] || {};
      const vk = $("chk_vk"); if(vk) vk.checked = !!flags.vk;
      const inst = $("chk_inst"); if(inst) inst.checked = !!flags.inst;
      const tg = $("chk_tg"); if(tg) tg.checked = !!flags.tg;
    }).catch(err => { console.warn("loadEditorData error", err); });
  }

  function saveEditor(){
    if(!selectedDateKey || !selectedType || !quill) return;
    const val = quill.root.innerHTML;
    const flags = {
      vk: !!($("chk_vk") && $("chk_vk").checked),
      inst: !!($("chk_inst") && $("chk_inst").checked),
      tg: !!($("chk_tg") && $("chk_tg").checked)
    };
    dbRef.doc(selectedDateKey).set({
      [selectedType]: val,
      [`${selectedType}Platforms`]: flags
    }, { merge: true }).then(() => {
      // update icons in calendar cell immediately
      const cell = document.querySelector(`.day-cell[data-date="${selectedDateKey}"]`);
      if(cell) loadDataForCell(selectedDateKey, cell);
    }).catch(err => { console.warn("saveEditor error", err); });
  }

  let editorTimer;
  function saveEditorDebounced(){ clearTimeout(editorTimer); editorTimer = setTimeout(saveEditor, 700); }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(() => {
      const b = $("copyBtn"); if(!b) return;
      const old = b.textContent;
      b.textContent = "Скопировано";
      setTimeout(() => b.textContent = old, 1000);
    });
  }
}
