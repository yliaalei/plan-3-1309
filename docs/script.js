(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";
  const colorMap = {
    burgundy: "rgba(128,0,32,0.4)",
    orange: "rgba(255,165,0,0.4)",
    green: "rgba(0,128,0,0.4)",
    brown: "rgba(139,69,19,0.4)",
    beige: "rgba(245,245,220,0.4)",
    free: "rgba(255,255,255,0.15)"
  };

  function $(id){return document.getElementById(id);}

  $("googleBtn").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider).catch(e => $("authError").textContent = e.message);
  };

  $("logoutBtn").onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if(!user){
      $("authSection").style.display="flex";
      $("app").style.display="none";
    } else if(user.email === OWNER_EMAIL){
      $("authSection").style.display="none";
      $("app").style.display="block";
      initApp();
    } else {
      alert("Доступ только владельцу.");
      auth.signOut();
    }
  });

  function initApp(){
    const dbRef = db.collection("contentPlanner");
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDateKey = null;
    let selectedType = null;
    let quill = null;
    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

    function pad(n){return String(n).padStart(2,"0");}
    function makeKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
    function formatReadable(key){
      const [y,m,d]=key.split("-").map(Number);
      return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long"});
    }

    $("prevBtn").onclick = ()=>{currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar();};
    $("nextBtn").onclick = ()=>{currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar();};

    $("menuClose").onclick = ()=> $("menu").classList.remove("active");
    $("btnTema").onclick = ()=> openEditor("tema");
    $("btnPost").onclick = ()=> openEditor("post");
    $("btnReel").onclick = ()=> openEditor("reel");
    $("btnStories").onclick = ()=> openEditor("stories");
    $("temaBack").onclick = ()=> closeEditor("temaPage");
    $("editorBack").onclick = ()=> closeEditor("editorPage");

    renderWeekdays();
    renderCalendar();

    function renderWeekdays(){
      const wd = $("weekdays");
      wd.innerHTML="";
      weekdays.forEach(d=>{const div=document.createElement("div");div.textContent=d;wd.appendChild(div);});
    }

    function renderCalendar(){
      const cal = $("calendar");
      cal.innerHTML="";
      $("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`;
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const leading = (firstDay===0?6:firstDay-1);
      for(let i=0;i<leading;i++){cal.appendChild(document.createElement("div")).className="day-cell empty";}

      const daysInMonth = new Date(currentYear,currentMonth+1,0).getDate();
      for(let d=1;d<=daysInMonth;d++){
        const key = makeKey(currentYear,currentMonth,d);
        const cell=document.createElement("div");
        cell.className="day-cell";
        const num=document.createElement("div");
        num.className="day-number";
        num.textContent=d;
        cell.appendChild(num);
        cal.appendChild(cell);
        cell.onclick=()=>openMenu(key);

        dbRef.doc(key).get().then(doc=>{
          if(doc.exists){
            const c=doc.data().temaColor||"free";
            cell.style.backgroundColor=colorMap[c];
          }
        });
      }
      updateBackground(currentMonth);
    }

    function updateBackground(m){
      const bg=$("calendarBackground");
      if([8,9,10].includes(m)){
        bg.style.backgroundImage="linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('https://i.pinimg.com/736x/90/1c/6a/901c6aab908ff55adc594fabae3ace52.jpg')";
        bg.style.backgroundSize="cover";
        bg.style.backgroundPosition="center";
      } else bg.style.background="none";
    }

    function openMenu(key){
      selectedDateKey=key;
      $("menuDateTitle").textContent=formatReadable(key);
      $("menu").classList.add("active");
    }

    function openEditor(type){
      $("menu").classList.remove("active");
      selectedType=type;
      if(type==="tema"){showPanel("temaPage");loadTema();}
      else{showPanel("editorPage");initQuill();loadEditor();}
    }

    function showPanel(id){$(id).classList.add("active");}
    function closeEditor(id){$(id).classList.remove("active");}

    function loadTema(){
      dbRef.doc(selectedDateKey).get().then(doc=>{
        const d=doc.exists?doc.data():{};
        $("tema_tema").value=d.temaText||"";
        $("tema_goal").value=d.temaGoal||"none";
        $("tema_type").value=d.temaColor||"free";
      });
    }

    ["tema_tema","tema_goal","tema_type"].forEach(id=>{
      $(id).oninput=saveTema;
      $(id).onchange=saveTema;
    });

    function saveTema(){
      const data={
        temaText:$("tema_tema").value.trim(),
        temaGoal:$("tema_goal").value,
        temaColor:$("tema_type").value
      };
      dbRef.doc(selectedDateKey).set(data,{merge:true}).then(()=>renderCalendar());
    }

    function initQuill(){
      if(!quill){
        quill=new Quill("#editorText",{theme:"snow",modules:{toolbar:"#editorToolbar"}});
        quill.on("text-change",saveEditorDebounced);
      }
      const checks=$("publishChecks");
      if(checks.childElementCount===0){
        checks.innerHTML=`
          <label><input type="checkbox" id="chk_vk"> ВК</label>
          <label><input type="checkbox" id="chk_inst"> Инстаграм</label>
          <label><input type="checkbox" id="chk_tg"> Телеграм</label>`;
        ["chk_vk","chk_inst","chk_tg"].forEach(id=>$(id).onchange=saveEditorDebounced);
      }
    }

    function loadEditor(){
      dbRef.doc(selectedDateKey).get().then(doc=>{
        const d=doc.exists?doc.data():{};
        quill.root.innerHTML=d[selectedType]||"";
        const f=d[`${selectedType}Platforms`]||{};
        $("chk_vk").checked=!!f.vk;
        $("chk_inst").checked=!!f.inst;
        $("chk_tg").checked=!!f.tg;
      });
    }

    function saveEditor(){
      const val=quill.root.innerHTML;
      const flags={vk:$("chk_vk").checked,inst:$("chk_inst").checked,tg:$("chk_tg").checked};
      dbRef.doc(selectedDateKey).set({[selectedType]:val,[`${selectedType}Platforms`]:flags},{merge:true});
    }

    let timer;
    function saveEditorDebounced(){clearTimeout(timer);timer=setTimeout(saveEditor,500);}
  }
})();
