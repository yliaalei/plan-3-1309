(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";

  const dbInstance = firebase.firestore();
  const authInstance = firebase.auth();

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

  safeAssign("googleBtn","onclick", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    authInstance.signInWithPopup(provider).catch(e => {
      const authError = $("authError");
      if(authError) authError.textContent = e.message;
    });
  });

  safeAssign("logoutBtn","onclick", () => authInstance.signOut());

  authInstance.onAuthStateChanged(user => {
    if(!user){
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display="none");
      const authSection = $("authSection");
      if(authSection) authSection.style.display = "block";
      return;
    }
    if(user.email !== OWNER_EMAIL){
      alert("Доступ только владельцу.");
      authInstance.signOut();
      return;
    }
    const appEl = $("app");
    if(appEl) appEl.style.display = "block";
    const authSection = $("authSection");
    if(authSection) authSection.style.display = "none";
    initApp();
  });

  function initApp(){
    const dbRef = dbInstance.collection("contentPlanner");
    const colorMap = {
      burgundy: "rgba(128,0,32,0.5)",
      orange: "rgba(255,165,0,0.5)",
      green: "rgba(0,100,0,0.5)",
      brown: "rgba(139,69,19,0.5)",
      beige: "rgba(245,245,220,0.5)",
      free: "rgba(255,255,255,0.3)"
    };

    let selectedDateKey = null;
    let selectedType = null;
    let currentMonth = (new Date()).getMonth();
    let currentYear = (new Date()).getFullYear();
    let quill = null;

    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

    // Навигация по месяцам
    safeAssign("prevBtn","onclick", () => { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
    safeAssign("nextBtn","onclick", () => { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });

    // Меню и редакторы
    safeAssign("menuClose","onclick", closeMenu);
    safeAssign("btnTema","onclick", () => showEditor("tema"));
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
      const wd = $("weekdays"); if(!wd) return;
      wd.innerHTML = "";
      weekdays.forEach(d => { const div = document.createElement("div"); div.textContent = d; wd.appendChild(div); });
    }

    function renderCalendar(){
      const cal = $("calendar"); if(!cal) return;
      cal.innerHTML = "";
      const monthYearEl = $("monthYear"); if(monthYearEl) monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const leading = (firstDay===0?6:firstDay-1);
      for(let i=0;i<leading;i++){ cal.appendChild(document.createElement("div")).className="day-cell empty"; }

      const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
      for(let d=1; d<=daysInMonth; d++){
        const key = makeDateKey(currentYear,currentMonth,d);
        const cell = document.createElement("div");
        cell.className = "day-cell"; cell.dataset.date = key;
        const num = document.createElement("div"); num.className = "day-number"; num.textContent = d;
        cell.appendChild(num);
        cell.style.backgroundColor = colorMap.free;
        cell.onclick = () => openMenuForDate(key);

        dbRef.doc(key).get().then(doc => {
          if(doc.exists){
            const c = doc.data().temaColor || "free";
            cell.style.backgroundColor = colorMap[c] || colorMap.free;
          }
        });

        cal.appendChild(cell);
      }

      updateCalendarBackground(currentMonth);
    }

    function updateCalendarBackground(month){
      const bgEl = $("calendarBackground");
      if(!bgEl) return;
      if([8,9,10].includes(month)){
        bgEl.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
        bgEl.style.backgroundRepeat = "no-repeat";
      } else {
        bgEl.style.backgroundImage = "none";
      }
    }

    function openMenuForDate(key){
      selectedDateKey = key;
      const menuTitle = $("menuDateTitle");
      if(menuTitle) menuTitle.textContent = formatReadable(key);
      showMenu();
      renderCalendarIcons(key);
    }

    function showMenu(){ const menu=$("menu"); if(menu) menu.classList.add("active"); }
    function closeMenu(){ const menu=$("menu"); if(menu) menu.classList.remove("active"); }
    function showPanel(id){ const el=$(id); if(el) el.classList.add("active"); }
    function hidePanel(id){ const el=$(id); if(el) el.classList.remove("active"); }

    // Остальные функции редактора остаются без изменений...
    // showEditor, loadEditorData, renderCalendarIcons, saveEditor, saveEditorDebounced, copyEditorText, saveTema
  }
})();
