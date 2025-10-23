(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";
  const colorMap = {
    burgundy: "rgba(128,0,32,0.4)",
    orange: "rgba(255,165,0,0.4)",
    green: "rgba(0,100,0,0.4)",
    brown: "rgba(139,69,19,0.4)",
    beige: "rgba(245,245,220,0.4)",
    free: "rgba(255,255,255,0.15)"
  };

  function $(id){ return document.getElementById(id); }

  $("googleBtn").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => $("authError").textContent = e.message);
  };

  $("logoutBtn").onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if (!user) {
      $("authSection").style.display = "flex";
      $("app").style.display = "none";
      return;
    }
    if (user.email !== OWNER_EMAIL) {
      alert("Доступ только владельцу!");
      auth.signOut();
      return;
    }
    $("authSection").style.display = "none";
    $("app").style.display = "block";
    initApp();
  });

  function initApp(){
    const dbRef = db.collection("contentPlanner");
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDateKey = null;
    let quill = null;
    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

    $("prevBtn").onclick = () => { currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} renderCalendar(); };
    $("nextBtn").onclick = () => { currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} renderCalendar(); };

    function pad(n){ return String(n).padStart(2,"0"); }
    function makeDateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
    function formatReadable(key){ const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"}); }

    renderWeekdays();
    renderCalendar();

    function renderWeekdays(){
      $("weekdays").innerHTML="";
      weekdays.forEach(d=>{const div=document.createElement("div");div.textContent=d;$("weekdays").appendChild(div);});
    }

    function renderCalendar(){
      $("calendar").innerHTML="";
      $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;
      const firstDay=new Date(currentYear,currentMonth,1).getDay();
      const leading=(firstDay===0?6:firstDay-1);
      for(let i=0;i<leading;i++){ $("calendar").appendChild(document.createElement("div")).className="day-cell empty"; }
      const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
      for(let d=1;d<=daysInMonth;d++){
        const key=makeDateKey(currentYear,currentMonth,d);
        const cell=document.createElement("div");
        cell.className="day-cell";cell.dataset.date=key;
        const num=document.createElement("div");num.className="day-number";num.textContent=d;cell.appendChild(num);
        cell.onclick=()=>openMenuForDate(key);
        dbRef.doc(key).get().then(doc=>{
          if(doc.exists){
            const c=doc.data().temaColor||"free";
            cell.style.backgroundColor=colorMap[c]||colorMap.free;
          } else cell.style.backgroundColor=colorMap.free;
        });
        $("calendar").appendChild(cell);
      }
    }

    function openMenuForDate(key){
      selectedDateKey=key;
      $("menuDateTitle").textContent=formatReadable(key);
      $("menu").classList.add("active");
    }

    $("menuClose").onclick=()=>$("menu").classList.remove("active");

    $("btnTema").onclick=()=>openEditor("tema");
    $("btnPost").onclick=()=>openEditor("post");
    $("btnStories").onclick=()=>openEditor("stories");
    $("btnReel").onclick=()=>openEditor("reel");

    $("temaBack").onclick=()=>hidePanel("temaPage");
    $("editorBack").onclick=()=>hidePanel("editorPage");

    function showPanel(id){ $(id).classList.add("active"); }
    function hidePanel(id){ $(id).classList.remove("active"); }

    function openEditor(type){
      $("menu").classList.remove("active");
      if(type==="tema"){
        $("temaDate").textContent=formatReadable(selectedDateKey);
        showPanel("temaPage");
        loadTema(selectedDateKey);
      } else {
        $("editorDateTitle").textContent=formatReadable(selectedDateKey);
        $("editorTypeLabel").textContent=type.charAt(0).toUpperCase()+type.slice(1);
        showPanel("editorPage");
        loadEditor(selectedDateKey,type);
      }
    }

    function loadEditor(key,type){
      if(!quill){ quill=new Quill("#editorText",{theme:"snow",modules:{toolbar:"#editorToolbar"}}); }
      dbRef.doc(key).get().then(doc=>{
        const data=doc.exists?doc.data():{};
        quill.root.innerHTML=data[type]||"";
        const checks=$("publishChecks");
        checks.innerHTML=`
          <label><input type="checkbox" id="chk_vk"> ВК</label>
          <label><input type="checkbox" id="chk_inst"> Инст</label>
          <label><input type="checkbox" id="chk_tg"> ТГ</label>
        `;
        ["chk_vk","chk_inst","chk_tg"].forEach(id=>$(id).onchange=saveEditorDebounced);
        $("copyBtn").onclick=()=>navigator.clipboard.writeText(quill.root.innerHTML);
      });
    }

    function saveEditor(){
      if(!selectedDateKey||!quill)return;
      const type=$("editorTypeLabel").textContent.toLowerCase();
      const flags={vk:$("chk_vk").checked,inst:$("chk_inst").checked,tg:$("chk_tg").checked};
      dbRef.doc(selectedDateKey).set({[type]:quill.root.innerHTML,[`${type}Platforms`]:flags},{merge:true});
    }
    let timer; function saveEditorDebounced(){clearTimeout(timer);timer=setTimeout(saveEditor,500);}

    function loadTema(key){
      dbRef.doc(key).get().then(doc=>{
        const data=doc.exists?doc.data():{};
        $("tema_tema").value=data.temaText||"";
        $("tema_goal").value=data.temaGoal||"продажа";
        $("tema_type").value=data.temaColor||"burgundy";
      });
      $("tema_tema").oninput=saveTema;
      $("tema_goal").onchange=saveTema;
      $("tema_type").onchange=saveTema;
    }

    function saveTema(){
      const data={temaText:$("tema_tema").value,temaGoal:$("tema_goal").value,temaColor:$("tema_type").value};
      dbRef.doc(selectedDateKey).set(data,{merge:true});
      renderCalendar();
    }
  }
})();
