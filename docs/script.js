(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";

  // Используем auth и db из firebase-config.js
  function $(id) { return document.getElementById(id); }
  function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

  const ICONS = {
    vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
    inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
    tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
  };

  function createIcon(src, alt, active){
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.style.width = "20px";
    img.style.height = "20px";
    img.style.opacity = active ? "1" : "0.3";
    img.style.filter = active ? "none" : "grayscale(100%)";
    img.title = alt;
    return img;
  }

  // Авторизация
  safeAssign("googleBtn", "onclick", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    auth.signInWithPopup(provider).catch(e => $("authError").textContent = e.message);
  });
  safeAssign("logoutBtn", "onclick", () => auth.signOut());

  auth.onAuthStateChanged(user => {
    if(!user){
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display="none");
      $("authSection").style.display="block";
      return;
    }
    if(user.email !== OWNER_EMAIL){
      alert("Доступ только владельцу.");
      auth.signOut();
      return;
    }
    $("authSection").style.display="none";
    $("app").style.display="block";
    initApp();
  });

  function initApp(){
    const dbRef = db.collection("contentPlanner");
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

    safeAssign("prevBtn","onclick", () => { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
    safeAssign("nextBtn","onclick", () => { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });

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
      const wd = $("weekdays"); wd.innerHTML = "";
      weekdays.forEach(d => { const div=document.createElement("div"); div.textContent=d; wd.appendChild(div); });
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
        cell.className="day-cell"; cell.dataset.date=key;
        const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
        cell.appendChild(num);
        cell.style.backgroundColor=colorMap.free;
        cell.onclick=()=>openMenuForDate(key);
        dbRef.doc(key).get().then(doc=>{
          if(doc.exists){
            const c=doc.data().temaColor||"free";
            cell.style.backgroundColor=colorMap[c]||colorMap.free;
          }
        });
        cal.appendChild(cell);
      }
      updateCalendarBackground(currentMonth);
    }

    function updateCalendarBackground(month){
      const bg=$("calendarBackground");
      if([8,9,10].includes(month)){
        bg.style.backgroundImage="linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg')";
      } else {
        bg.style.backgroundImage="none";
      }
    }

    function openMenuForDate(key){
      selectedDateKey=key;
      $("menuDateTitle").textContent=formatReadable(key);
      showMenu();
      renderCalendarIcons(key);
    }

    function showMenu(){ $("menu").classList.add("active"); }
    function closeMenu(){ $("menu").classList.remove("active"); }
    function showPanel(id){ $(id).classList.add("active"); }
    function hidePanel(id){ $(id).classList.remove("active"); }

    function showEditor(type){
      closeMenu();
      selectedType=type;
      $("editorDateTitle").textContent=formatReadable(selectedDateKey);
      $("editorTypeLabel").textContent=type.toUpperCase();
      showPanel("editorPage");
      if(quill) quill.root.innerHTML="";
      quill=new Quill("#editorText",{theme:"snow"});
    }

    function copyEditorText(){
      const text=quill.root.innerHTML;
      navigator.clipboard.writeText(text).then(()=>alert("Текст скопирован!"));
    }

    function renderCalendarIcons(key){
      dbRef.doc(key).get().then(doc=>{
        if(!doc.exists) return;
        const d=doc.data();
        const containers=["postIcons","reelIcons","storiesIcons"];
        containers.forEach(id=>$(id).innerHTML="");
        if(d.vk) $("postIcons").appendChild(createIcon(ICONS.vk,"VK",true));
        if(d.inst) $("reelIcons").appendChild(createIcon(ICONS.inst,"Instagram",true));
        if(d.tg) $("storiesIcons").appendChild(createIcon(ICONS.tg,"Telegram",true));
      });
    }
  }
})();
