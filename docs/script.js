/* ICONS */
const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

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

/* APP */
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

  function pad(n){ return String(n).padStart(2,"0"); }
  function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
  function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

  function renderWeekdays(){
    const wd = $("weekdays"); wd.innerHTML="";
    weekdays.forEach(d => { const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
  }

  function renderCalendar(){
    const cal = $("calendar");
    cal.innerHTML = "";
    const monthTitle = $("monthYear");
    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay === 0 ? 6 : firstDay - 1);
    for(let i=0;i<leading;i++){ const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e); }
    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key = makeDateKey(currentYear, currentMonth, d);
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.date = key;
      const num = document.createElement("div");
      num.className = "day-number";
      num.textContent = d;
      cell.appendChild(num);
      cell.style.backgroundColor = colorMap.free;
      cell.onclick = () => openMenuForDate(key);
      dbRef.doc(key).get().then(doc => {
        if(doc.exists){
          const data = doc.data();
          const c = data.temaColor || "free";
          cell.style.backgroundColor = colorMap[c] || colorMap.free;
        }
      });
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    $("menuDateTitle").textContent = formatReadable(key);
    showMenu();
  }

  function showMenu(){ $("menu").classList.add("active"); }
  function closeMenu(){ $("menu").classList.remove("active"); }

  function showTema(){
    closeMenu();
    selectedType="tema";
    $("temaDateTitle").textContent=formatReadable(selectedDateKey);
    showPanel("temaPage");
    loadTemaData(selectedDateKey);
  }

  function showPanel(id){ $(id).classList.add("active"); }
  function hidePanel(id){ $(id).classList.remove("active"); }

  function loadTemaData(key){
    ["tema_tema","tema_goal","tema_activity"].forEach(id=>{ const el=$(id); if(el) el.value=""; });
    dbRef.doc(key).get().then(doc=>{
      if(!doc.exists) return;
      const d=doc.data();
      if(d.tema) $("tema_tema").value=d.tema;
      if(d.goal) $("tema_goal").value=d.goal;
      if(d.activity) $("tema_activity").value=d.activity;
      const c=d.temaColor||"free";
      const r=document.querySelector(`input[name="temaColor"][value="${c}"]`);
      if(r) r.checked=true;
    });
  }

  function showEditor(type){
    closeMenu();
    selectedType = type;
    $("editorDateTitle").textContent = formatReadable(selectedDateKey);
    $("editorTypeLabel").textContent = type.charAt(0).toUpperCase()+type.slice(1);
    showPanel("editorPage");

    if(!quill){
      quill = new Quill("#editorText", { theme: "snow", modules: { toolbar: "#editorToolbar" } });
      quill.on("text-change", saveEditorDebounced);
    }

    // инициализация publishChecks только один раз
    const checksDiv = $("publishChecks");
    if(checksDiv && checksDiv.childElementCount===0){
      checksDiv.innerHTML = `
        <label><input type="checkbox" id="chk_vk"> ВК</label>
        <label><input type="checkbox" id="chk_inst"> Инст</label>
        <label><input type="checkbox" id="chk_tg"> ТГ</label>
      `;
      ["chk_vk","chk_inst","chk_tg"].forEach(id => {
        const el=$(id);
        if(el) el.onchange = saveEditorDebounced;
      });
    }

    loadEditorData(selectedDateKey, type);
  }

  function loadEditorData(key, type){
    if(!quill) return;
    quill.setContents([]);
    dbRef.doc(key).get().then(doc=>{
      let data = doc.exists ? doc.data() : {};
      quill.root.innerHTML = data[type] || "";
      const flags = data[`${type}Platforms`] || {};
      $("chk_vk").checked = !!flags.vk;
      $("chk_inst").checked = !!flags.inst;
      $("chk_tg").checked = !!flags.tg;
      renderEditorIcons(flags);
    });
  }

  function renderEditorIcons(flags){
    const div = $("editorIcons");
    if(!div) return;
    div.innerHTML = "";
    div.appendChild(createIcon(ICONS.vk,"VK",flags.vk));
    div.appendChild(createIcon(ICONS.inst,"Instagram",flags.inst));
    div.appendChild(createIcon(ICONS.tg,"Telegram",flags.tg));
  }

  function saveEditor(){
    if(!selectedDateKey || !selectedType || !quill) return;
    const val = quill.root.innerHTML;
    const flags = {
      vk: $("chk_vk").checked,
      inst: $("chk_inst").checked,
      tg: $("chk_tg").checked
    };
    dbRef.doc(selectedDateKey).set({
      [selectedType]: val,
      [`${selectedType}Platforms`]: flags
    }, { merge: true }).then(()=>renderEditorIcons(flags));
  }

  let timer;
  function saveEditorDebounced(){ clearTimeout(timer); timer = setTimeout(saveEditor, 700); }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(()=>{
      const btn=$("copyBtn");
      const old=btn.textContent;
      btn.textContent="Скопировано!";
      setTimeout(()=>btn.textContent=old,1000);
    });
  }
}
