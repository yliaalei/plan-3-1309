(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";
  const colorMap = {
    burgundy: "rgba(128,0,32,0.5)",
    orange: "rgba(255,165,0,0.5)",
    green: "rgba(0,100,0,0.5)",
    brown: "rgba(139,69,19,0.5)",
    beige: "rgba(245,245,220,0.5)",
    free: "rgba(255,255,255,0.3)"
  };

  function $(id){ return document.getElementById(id); }
  function safeAssign(id, prop, handler){ const el = $(id); if(el) el[prop] = handler; }

  safeAssign("googleBtn","onclick", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => $("authError").textContent = e.message);
  });
  safeAssign("logoutBtn","onclick", ()=>auth.signOut());

  auth.onAuthStateChanged(user=>{
    if(!user){ $("authSection").style.display="flex"; $("app").style.display="none"; return; }
    if(user.email!==OWNER_EMAIL){ alert("Доступ только владельцу"); auth.signOut(); return; }
    $("authSection").style.display="none"; $("app").style.display="block"; initApp();
  });

  function initApp(){
    const dbRef=db.collection("contentPlanner");
    let selectedDateKey=null, selectedType=null, quill=null;
    let currentMonth=(new Date()).getMonth();
    let currentYear=(new Date()).getFullYear();

    const monthNames=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

    function pad(n){ return String(n).padStart(2,"0"); }
    function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
    function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long"}); }

    safeAssign("prevBtn","onclick",()=>{ currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); });
    safeAssign("nextBtn","onclick",()=>{ currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); });

    safeAssign("menuClose","onclick",()=>$("menu").classList.remove("active"));
    safeAssign("btnTema","onclick",()=>showEditor("tema"));
    safeAssign("btnPost","onclick",()=>showEditor("post"));
    safeAssign("btnReel","onclick",()=>showEditor("reel"));
    safeAssign("btnStories","onclick",()=>showEditor("stories"));
    safeAssign("temaBack","onclick",()=>hidePanel("temaPage"));
    safeAssign("editorBack","onclick",()=>hidePanel("editorPage"));

    renderCalendar();

    function renderCalendar(){
      const cal=$("calendar"); cal.innerHTML="";
      $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
      const firstDay=new Date(currentYear,currentMonth,1).getDay();
      const leading=(firstDay===0?6:firstDay-1);
      for(let i=0;i<leading;i++){ const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e); }

      const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
      for(let d=1;d<=daysInMonth;d++){
        const key=makeDateKey(currentYear,currentMonth,d);
        const cell=document.createElement("div");
        cell.className="day-cell";
        const num=document.createElement("div");
        num.className="day-number"; num.textContent=d;
        cell.appendChild(num);

        dbRef.doc(key).get().then(doc=>{
          if(doc.exists){ const c=doc.data().temaColor||"free"; cell.style.backgroundColor=colorMap[c]||colorMap.free; }
        });

        cell.onclick=()=>{ selectedDateKey=key; $("menuDateTitle").textContent=formatReadable(key); $("menu").classList.add("active"); };
        cal.appendChild(cell);
      }
      updateCalendarBackground(currentMonth);
    }

    function updateCalendarBackground(month){
      const bgUrl="https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg";
      document.body.style.backgroundImage=`linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url('${bgUrl}')`;
      document.body.style.backgroundSize="cover";
      document.body.style.backgroundPosition="center";
    }

    function showEditor(type){
      $("menu").classList.remove("active");
      selectedType=type;
      if(type==="tema"){ showPanel("temaPage"); loadTema(); }
      else { showPanel("editorPage"); loadEditor(type); }
    }

    function hidePanel(id){ $(id).classList.remove("active"); renderCalendar(); }

    function loadTema(){
      if(!selectedDateKey)return;
      dbRef.doc(selectedDateKey).get().then(doc=>{
        const data=doc.exists?doc.data():{};
        $("tema_tema").value=data.temaText||"";
        $("tema_goal").value=data.temaGoal||"none";
        $("tema_type").value=data.temaColor||"free";
      });
      ["tema_tema","tema_goal","tema_type"].forEach(id=>$(id).oninput=saveTema);
    }

    function saveTema(){
      if(!selectedDateKey)return;
      const data={temaText:$("tema_tema").value,temaGoal:$("tema_goal").value,temaColor:$("tema_type").value};
      dbRef.doc(selectedDateKey).set(data,{merge:true}).then(()=>renderCalendar());
    }

    function loadEditor(type){
      if(!quill){ quill=new Quill("#editorText",{theme:"snow"}); }
      dbRef.doc(selectedDateKey).get().then(doc=>{
        const data=doc.exists?doc.data():{};
        quill.root.innerHTML=data[type]||"";
      });
      quill.on("text-change",()=>saveEditor(type));
    }

    function saveEditor(type){
      if(!selectedDateKey||!quill)return;
      dbRef.doc(selectedDateKey).set({[type]:quill.root.innerHTML},{merge:true});
    }
  }
})();

