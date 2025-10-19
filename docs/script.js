let quill;
let selectedDateKey = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const colorMap = { free:'#fff', family:'#c8f7e8', health:'#fff7c2', work:'#ffd7ea', hobby:'#e8e1ff' };
const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

auth.onAuthStateChanged(user=>{
  if(user){ document.getElementById('loginSection').style.display='none'; document.getElementById('app').style.display='block'; initApp(user); }
  else{ document.getElementById('loginSection').style.display='block'; document.getElementById('app').style.display='none'; }
});

document.addEventListener('DOMContentLoaded',()=>{
  const loginBtn=document.getElementById('loginBtn');
  const googleBtn=document.getElementById('googleBtn');
  const logoutBtn=document.getElementById('logoutBtn');
  const loginError=document.getElementById('loginError');

  loginBtn.onclick=()=>{
    const email=document.getElementById('loginEmail').value;
    const pass=document.getElementById('loginPass').value;
    auth.signInWithEmailAndPassword(email,pass).catch(err=>{
      if(err.code==='auth/user-not-found'){ auth.createUserWithEmailAndPassword(email,pass).catch(e=>loginError.textContent=e.message); }
      else loginError.textContent=err.message;
    });
  };

  googleBtn.onclick=()=>{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider).catch(err=>loginError.textContent=err.message);
  };

  logoutBtn.onclick=()=>auth.signOut();
});

function pad(n){return String(n).padStart(2,'0');}
function makeDateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
function formatReadable(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});}

function initApp(user){
  renderWeekdays();
  renderCalendar(user);

  document.getElementById('prevBtn').onclick=()=>{currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(user);};
  document.getElementById('nextBtn').onclick=()=>{currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(user);};
  document.getElementById('menuClose').onclick=closeMenu;
  document.getElementById('btnTema').onclick=()=>showTema(user);
  document.getElementById('btnStories').onclick=()=>showEditor(user,'stories');
  document.getElementById('btnPost').onclick=()=>showEditor(user,'post');
  document.getElementById('btnReel').onclick=()=>showEditor(user,'reel');
  document.getElementById('temaBack').onclick=()=>hidePanel('temaPage');
  document.getElementById('editorBack').onclick=()=>hidePanel('editorPage');
  document.getElementById('copyBtn').onclick=copyEditorText;

  ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).oninput=()=>saveTemaDebounced(user));
  document.querySelectorAll('input[name="temaColor"]').forEach(r=>r.onchange=()=>saveTema(user));
}

function renderWeekdays(){
  const wd=document.getElementById('weekdays'); wd.innerHTML=''; weekdays.forEach(d=>{const div=document.createElement('div'); div.textContent=d; wd.appendChild(div);});
}

function renderCalendar(user){
  const cal=document.getElementById('calendar'); cal.innerHTML='';
  document.getElementById('monthYear').textContent=`${monthNames[currentMonth]} ${currentYear}`;
  const firstDay=new Date(currentYear,currentMonth,1).getDay(); const leading=(firstDay===0?6:firstDay-1);
  for(let i=0;i<leading;i++){const e=document.createElement('div'); e.className='day-cell empty'; cal.appendChild(e);}
  const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
  for(let d=1;d<=daysInMonth;d++){
    const key=makeDateKey(currentYear,currentMonth,d);
    const cell=document.createElement('div'); cell.className='day-cell'; cell.dataset.date=key;
    const num=document.createElement('div'); num.className='day-number'; num.textContent=d; cell.appendChild(num);
    cell.style.backgroundColor=colorMap.free;
    cell.onclick=()=>openMenuForDate(key);
    loadDataForCell(user,key,cell);
    cal.appendChild(cell);
  }
}

function openMenuForDate(key){selectedDateKey=key; document.getElementById('menuDateTitle').textContent=formatReadable(key); showMenu();}
function showMenu(){document.getElementById('menu').classList.add('active');}
function closeMenu(){document.getElementById('menu').classList.remove('active');}
function showPanel(id){document.getElementById(id).classList.add('active');}
function hidePanel(id){document.getElementById(id).classList.remove('active');}

function showTema(user){closeMenu(); selectedType='tema'; document.getElementById('temaDateTitle').textContent=formatReadable(selectedDateKey); showPanel('temaPage'); loadTemaData(user);}
function showEditor(user,type){closeMenu(); selectedType=type; document.getElementById('editorDateTitle').textContent=formatReadable(selectedDateKey); document.getElementById('editorTypeLabel').textContent=type.charAt(0).toUpperCase()+type.slice(1); showPanel('editorPage');
  if(!quill){ quill=new Quill('#editorText',{theme:'snow',modules:{toolbar:'#editorToolbar'}}); quill.on('text-change',()=>saveEditorDebounced(user)); } loadEditorData(user,type);
}

function loadDataForCell(user,key,cell){
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(key).get().then(doc=>{if(doc.exists){const d=doc.data(); const c=d.temaColor||'free'; cell.style.backgroundColor=colorMap[c]||colorMap.free;}});
}

function loadTemaData(user){
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).value='');
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).get().then(doc=>{
    if(doc.exists){
      const d=doc.data();
      if(d.tema) document.getElementById('tema_tema').value=d.tema;
      if(d.goal) document.getElementById('tema_goal').value=d.goal;
      if(d.activity) document.getElementById('tema_activity').value=d.activity;
      const c=d.temaColor||'free';
      const r=document.querySelector(`input[name="temaColor"][value="${c}"]`); if(r) r.checked=true;
    }
  });
}

function saveTema(user){
  if(!user || !selectedDateKey) return;
  const tema=document.getElementById('tema_tema').value;
  const goal=document.getElementById('tema_goal').value;
  const activity=document.getElementById('tema_activity').value;
  const temaColor=(document.querySelector('input[name="temaColor"]:checked')||{}).value||'free';
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).set({tema,goal,activity,temaColor},{merge:true});
  updateCellColor(selectedDateKey,temaColor);
}

let temaTimer; function saveTemaDebounced(user){clearTimeout(temaTimer); temaTimer=setTimeout(()=>saveTema(user),500);}
function updateCellColor(key,color){const el=document.querySelector(`.day-cell[data-date="${key}"]`); if(el) el.style.backgroundColor=colorMap[color]||colorMap.free;}

function loadEditorData(user,type){
  if(!quill) return; quill.setContents([]);
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).get().then(doc=>{
    if(doc.exists){ quill.root.innerHTML=doc.data()[type]||''; }
  });
}

let editorTimer; function saveEditorDebounced(user){clearTimeout(editorTimer); editorTimer=setTimeout(()=>saveEditor(user),500);}
function saveEditor(user){
  if(!user || !selectedDateKey || !selectedType || !quill) return;
  const obj={}; obj[selectedType]=quill.root.innerHTML;
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).set(obj,{merge:true});
}

function copyEditorText(){if(quill) navigator.clipboard.writeText(quill.getText());}
