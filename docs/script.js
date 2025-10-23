/* script.js — инициализация приложения, календарь, редакторы, сохранение в Firestore.
   Требование: firebase-config.js должен быть загружен перед этим файлом.
*/

const OWNER_EMAIL = "ylia.alei@gmail.com";

// helper
function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

// ensure firebase objects exist
if(typeof firebase === "undefined" || typeof db === "undefined" || typeof auth === "undefined"){
  console.error("Firebase не инициализирован. Убедитесь, что firebase-config.js подключён до script.js");
}

// icons
const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

window.addEventListener("load", () => {
  // wire auth buttons
  safeAssign("googleBtn","onclick", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch (e) { $("authError").textContent = e.message; }
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
    $("app").style.display = "block";
    $("authSection").style.display = "none";
    // initialize app logic
    initApp();
  });
});

function createIcon(src, alt, active){
  const img=document.createElement("img");
  img.src=src; img.alt=alt;
  img.style.width="22px"; img.style.height="22px";
  img.style.opacity = active ? "1" : "0.25";
  img.title = alt;
  return img;
}

function initApp(){
  const dbRef = db.collection("contentPlanner");
  const colorMapHex = {
    burgundy: "#800020",
    orange: "#FFA500",
    green: "#006400",
    brown: "#8B4513",
    beige: "#F5F5DC"
  };

  function hexToRgba(hex, a){
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // state
  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  let quill = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  // nav handlers
  safeAssign("prevBtn","onclick", ()=> { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
  safeAssign("nextBtn","onclick", ()=> { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });
  safeAssign("menuClose","onclick", closeMenu);
  safeAssign("btnTema","onclick", ()=> showEditor("tema"));
  safeAssign("btnStories","onclick", ()=> showEditor("stories"));
  safeAssign("btnPost","onclick", ()=> showEditor("post"));
  safeAssign("btnReel","onclick", ()=> showEditor("reel"));
  safeAssign("temaBack","onclick", ()=> hidePanel("temaPage"));
  safeAssign("editorBack","onclick", ()=> hidePanel("editorPage"));
  safeAssign("copyBtn","onclick", copyEditorText);

  renderWeekdays();
  renderCalendar();

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){
    const wd = $("weekdays");
    wd.innerHTML = "";
    weekdays.forEach(d => { const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar");
    cal.innerHTML = "";
    $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // first day shift: make Monday index 0
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);
    for(let i=0;i<leading;i++){
      const emp = document.createElement("div");
      emp.className = "day-cell empty";
      cal.appendChild(emp);
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

      const iconsWrap = document.createElement("div");
      iconsWrap.className = "pub-icons";
      cell.appendChild(iconsWrap);

      // default translucent white background so background shows through
      cell.style.backgroundColor = "rgba(255,255,255,0.05)";

      cell.onclick = () => openMenuForDate(key);

      // load doc to set color and icons
      dbRef.doc(key).get().then(doc => {
        const data = doc.exists ? doc.data() : {};
        const c = data.temaColor || null;
        if(c && colorMapHex[c]){
          cell.style.backgroundColor = hexToRgba(colorMapHex[c], 0.28);
        }
        // render icons flags for post/reel/stories
        ["post","reel","stories"].forEach(type => {
          const flags = data[`${type}Platforms`] || {};
          // create small icons container for each type (we reuse pub-icons)
        });
        // render per-type icons into respective containers in the menu (we render on menu open)
      }).catch(err => console.error("load day doc error", err));

      cal.appendChild(cell);
    }
    updateCalendarBackground();
  }

  function updateCalendarBackground(){
    const calendarSection = $("calendarBackground");
    // unified background (always) — page-level already sets background image; we keep slight overlay
    calendarSection.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22))";
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    $("menuDateTitle").textContent = formatReadable(key);
    showMenu();
    renderCalendarIcons(key);
  }

  function showMenu(){ $("menu").classList.add("active"); $("menu").style.display="block"; }
  function closeMenu(){ $("menu").classList.remove("active"); $("menu").style.display="none"; }
  function showPanel(id){ $(id).classList.add("active"); $(id).style.display="block"; document.body.classList.remove("calendar-page"); }
  function hidePanel(id){ $(id).classList.remove("active"); $(id).style.display="none"; document.body.classList.add("calendar-page"); }

  function showEditor(type){
    closeMenu();
    selectedType = type;
    $("editorDateTitle").textContent = formatReadable(selectedDateKey);
    $("editorTypeLabel").textContent = type.charAt(0).toUpperCase()+type.slice(1);
    showPanel("editorPage");

    if(!quill){
      quill = new Quill("#editorText", { theme: "snow", modules: { toolbar: [["bold","italic"], ["link","image"]] } });
      quill.on("text-change", saveEditorDebounced);
    }

    const checksDiv = $("publishChecks");
    if(checksDiv.childElementCount === 0){
      checksDiv.innerHTML = `
        <label><input type="checkbox" id="chk_vk"> ВК</label>
        <label><input type="checkbox" id="chk_inst"> Инст</label>
        <label><input type="checkbox" id="chk_tg"> ТГ</label>
      `;
      ["chk_vk","chk_inst","chk_tg"].forEach(id=>{ const el=$(id); if(el) el.onchange=saveEditorDebounced; });
    }

    loadEditorData(selectedDateKey, type);
  }

  function loadEditorData(key,type){
    if(!quill) return;
    quill.setContents([]);
    dbRef.doc(key).get().then(doc => {
      const data = doc.exists ? doc.data() : {};
      quill.root.innerHTML = data[type] || "";
      const flags = data[`${type}Platforms`] || {};
      $("chk_vk").checked = !!flags.vk;
      $("chk_inst").checked = !!flags.inst;
      $("chk_tg").checked = !!flags.tg;
      renderCalendarIcons(key);
    });
  }

  function renderCalendarIcons(key){
    dbRef.doc(key).get().then(doc => {
      const data = doc.exists ? doc.data() : {};
      ["post","reel","stories"].forEach(type => {
        const flags = data[`${type}Platforms`] || {};
        const div = $(`${type}Icons`);
        if(!div) return;
        div.innerHTML = "";
        div.appendChild(createIcon(ICONS.vk, "VK", !!flags.vk));
        div.appendChild(createIcon(ICONS.inst, "Instagram", !!flags.inst));
        div.appendChild(createIcon(ICONS.tg, "Telegram", !!flags.tg));
      });
    });
  }

  function saveEditor(){
    if(!selectedDateKey||!selectedType||!quill) return;
    const val = quill.root.innerHTML;
    const flags = {
      vk: $("chk_vk") ? $("chk_vk").checked : false,
      inst: $("chk_inst") ? $("chk_inst").checked : false,
      tg: $("chk_tg") ? $("chk_tg").checked : false
    };
    dbRef.doc(selectedDateKey).set({
      [selectedType]: val,
      [`${selectedType}Platforms`]: flags
    }, { merge: true }).then(()=> renderCalendarIcons(selectedDateKey)).catch(e=>console.error(e));
  }

  let timer;
  function saveEditorDebounced(){ clearTimeout(timer); timer=setTimeout(saveEditor,700); }

  function copyEditorText(){ if(!quill) return; navigator.clipboard.writeText(quill.root.innerHTML).then(()=>{ const btn=$("copyBtn"); const old=btn.textContent; btn.textContent="Скопировано!"; setTimeout(()=>btn.textContent=old,1000); }); }

  // Tema editor panel
  safeAssign("btnTema", "onclick", () => {
    closeMenu();
    $("temaDateTitle").textContent = formatReadable(selectedDateKey);
    showPanel("temaPage");
    dbRef.doc(selectedDateKey).get().then(doc => {
      const data = doc.exists ? doc.data() : {};
      $("tema_tema").value = data.temaText || "";
      $("tema_goal").value = data.temaGoal || "";
      $("tema_type").value = data.temaColor || "";
    });
  });

  $("tema_tema").addEventListener("input", e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; saveTema(); });
  $("tema_goal").addEventListener("change", saveTema);
  $("tema_type").addEventListener("change", saveTema);

  function saveTema(){
    if(!selectedDateKey) return;
    const payload = {
      temaText: $("tema_tema").value.trim(),
      temaGoal: $("tema_goal").value,
      temaColor: $("tema_type").value
    };
    dbRef.doc(selectedDateKey).set(payload, { merge: true }).then(()=> renderCalendar()).catch(e=>console.error(e));
  }
}
