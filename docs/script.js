// --- Firebase авторизация ---
auth.onAuthStateChanged(async user => {
  if (user) {
    // Проверка владельца (только ты)
    if (user.email !== "ylia.alei@gmail.com") {
      alert("Только владелец может использовать это приложение.");
      auth.signOut();
      return;
    }
    initApp();
    showSection("app");
  } else {
    showSection("authSection");
  }
});

function showSection(id) {
  document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

// --- События при загрузке страницы ---
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleBtn");
  if (googleBtn) {
    googleBtn.onclick = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      auth.signInWithPopup(provider)
        .catch(e => document.getElementById("loginError").textContent = e.message);
    };
  }

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById("loginEmail").value;
      const pass = document.getElementById("loginPass").value;
      auth.signInWithEmailAndPassword(email, pass)
        .catch(e => document.getElementById("loginError").textContent = e.message);
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => auth.signOut();
});

// --- Основная логика приложения ---
function initApp() {
  const dbRef = db.collection("contentPlanner");
  const colorMap = {
    free: "#fff",
    family: "#c8f7e8",
    health: "#fff7c2",
    work: "#ffd7ea",
    hobby: "#e8e1ff"
  };

  let selectedDateKey = null;
  let selectedType = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  function pad(n){return String(n).padStart(2,'0');}
  function makeDateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
  function formatReadable(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});}

  document.getElementById('prevBtn').onclick=()=>{currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar();};
  document.getElementById('nextBtn').onclick=()=>{currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar();};
  document.getElementById('menuClose').onclick=closeMenu;
  document.getElementById('btnTema').onclick=showTema;
  document.getElementById('btnStories').onclick=()=>showEditor('stories');
  document.getElementById('btnPost').onclick=()=>showEditor('post');
  document.getElementById('btnReel').onclick=()=>showEditor('reel');
  document.getElementById('temaBack').onclick=()=>hidePanel('temaPage');
  document.getElementById('editorBack').onclick=()=>hidePanel('editorPage');
  document.getElementById('copyBtn').onclick=copyEditorText;
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>{document.getElementById(id).oninput=saveTemaDebounced;});
  document.querySelectorAll('input[name="temaColor"]').forEach(r=>r.onchange=saveTema);

  renderWeekdays(); renderCalendar();

  function renderWeekdays(){
    const wd=document.getElementById('weekdays');
    wd.innerHTML='';
    weekdays.forEach(d=>{
      const div=document.createElement('div');
      div.textContent=d;
      wd.appendChild(div);
    });
  }

  function renderCalendar(){
    const cal=document.getElementById('calendar');
    cal.innerHTML='';
    document.getElementById('monthYear').textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){
      const e=document.createElement('div');
      e.className='day-cell empty';
      cal.appendChild(e);
    }
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key=makeDateKey(currentYear,currentMonth,d);
      const cell=document.createElement('div');
      cell.className='day-cell';
      cell.dataset.date=key;
      const num=document.createElement('div');
      num.className='day-number';
      num.textContent=d;
      cell.appendChild(num);
      cell.style.backgroundColor=colorMap.free;
      cell.onclick=()=>openMenuForDate(key);
      loadDataForCell(key,cell);
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey=key;
    document.getElementById('menuDateTitle').textContent=formatReadable(key);
    showMenu();
  }
  function showMenu(){document.getElementById('menu').classList.add('active');}
  function closeMenu(){document.getElementById('menu').classList.remove('active');}
  function showTema(){
    closeMenu(); selectedType='tema';
    document.getElementById('temaDateTitle').textContent=formatReadable(selectedDateKey);
    showPanel('temaPage');
    loadTemaData(selectedDateKey);
  }

  function showEditor(type){
    closeMenu(); selectedType=type;
    document.getElementById('editorDateTitle').textContent=formatReadable(selectedDateKey);
    document.getElementById('editorTypeLabel').textContent=type.charAt(0).toUpperCase()+type.slice(1);
    showPanel('editorPage');

    // --- Добавляем флажки для публикации ---
    const toolbar = document.getElementById('editorToolbar');
    let checkContainer = document.getElementById('publishChecks');
    if (!checkContainer) {
      checkContainer = document.createElement('div');
      checkContainer.id = 'publishChecks';
      checkContainer.style.display = 'flex';
      checkContainer.style.justifyContent = 'center';
      checkContainer.style.gap = '12px';
      checkContainer.style.margin = '8px 0';
      checkContainer.innerHTML = `
        <label><input type="checkbox" id="chk_vk"> ВК</label>
        <label><input type="checkbox" id="chk_inst"> Инст</label>
        <label><input type="checkbox" id="chk_tg"> ТГ</label>
      `;
      toolbar.parentNode.insertBefore(checkContainer, toolbar.nextSibling);
      ['chk_vk','chk_inst','chk_tg'].forEach(id=>{
        document.getElementById(id).onchange = saveEditorDebounced;
      });
    }

    if(!quill){
      quill=new Quill('#editorText',{theme:'snow',modules:{toolbar:'#editorToolbar'}});
      quill.root.addEventListener('click',e=>{
        if(e.target.tagName==='A'){e.preventDefault(); window.open(e.target.href,'_blank');}
      });
      quill.on('text-change',saveEditorDebounced);
    }

    loadEditorData(selectedDateKey,type);
  }

  function showPanel(id){document.getElementById(id).classList.add('active');}
  function hidePanel(id){document.getElementById(id).classList.remove('active');}

  function loadDataForCell(key,cell){
    dbRef.doc(key).get().then(doc=>{
      if(doc.exists){
        const d=doc.data();
        const c=d.temaColor||'free';
        cell.style.backgroundColor=colorMap[c]||colorMap.free;
      }
    });
  }

  function loadTemaData(key){
    ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).value='');
    dbRef.doc(key).get().then(doc=>{
      if(doc.exists){
        const d=doc.data();
        if(d.tema)document.getElementById('tema_tema').value=d.tema;
        if(d.goal)document.getElementById('tema_goal').value=d.goal;
        if(d.activity)document.getElementById('tema_activity').value=d.activity;
        const c=d.temaColor||'free';
        const r=document.querySelector(`input[name="temaColor"][value="${c}"]`);
        if(r)r.checked=true;
      }
    });
  }

  function saveTema(){
    if(!selectedDateKey)return;
    const tema=document.getElementById('tema_tema').value;
    const goal=document.getElementById('tema_goal').value;
    const activity=document.getElementById('tema_activity').value;
    const temaColor=(document.querySelector('input[name="temaColor"]:checked')||{}).value||'free';
    dbRef.doc(selectedDateKey).set({tema,goal,activity,temaColor},{merge:true});
    updateCellColor(selectedDateKey,temaColor);
  }
  let temaTimer; 
  function saveTemaDebounced(){clearTimeout(temaTimer); temaTimer=setTimeout(saveTema,500);}
  function updateCellColor(key,color){
    const el=document.querySelector(`.day-cell[data-date="${key}"]`);
    if(el)el.style.backgroundColor=colorMap[color]||colorMap.free;
  }

  function loadEditorData(key,type){
    if(!quill)return;
    quill.setContents([]);
    dbRef.doc(key).get().then(doc=>{
      if(doc.exists){
        const d=doc.data();
        if(d[type]) quill.root.innerHTML=d[type];
        const flags = d[`${type}Platforms`] || {};
        document.getElementById('chk_vk').checked = !!flags.vk;
        document.getElementById('chk_inst').checked = !!flags.inst;
        document.getElementById('chk_tg').checked = !!flags.tg;
      } else {
        ['chk_vk','chk_inst','chk_tg'].forEach(id => document.getElementById(id).checked=false);
      }
    });
  }

  function saveEditor(){
    if(!selectedDateKey||!selectedType||!quill)return;
    const val = quill.root.innerHTML;
    const flags = {
      vk: document.getElementById('chk_vk').checked,
      inst: document.getElementById('chk_inst').checked,
      tg: document.getElementById('chk_tg').checked
    };
    dbRef.doc(selectedDateKey).set({
      [selectedType]: val,
      [`${selectedType}Platforms`]: flags
    }, {merge:true});
  }

  let editorTimer;
  function saveEditorDebounced(){
    clearTimeout(editorTimer);
    editorTimer=setTimeout(saveEditor,700);
  }

  function copyEditorText(){
    if(!quill)return;
    navigator.clipboard.writeText(quill.root.innerHTML).then(()=>{
      const b=document.getElementById('copyBtn');
      const old=b.textContent;
      b.textContent='Скопировано';
      setTimeout(()=>b.textContent=old,1000);
    });
  }
}
