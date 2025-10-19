let quill = null;
let selectedDateKey = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const colorMap = {
  free:'#fff', family:'#c8f7e8', health:'#fff7c2', work:'#ffd7ea', hobby:'#e8e1ff'
};
const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById('loginSection').style.display='none';
    document.getElementById('app').style.display='block';
    renderWeekdays();
    renderCalendar();
  } else {
    document.getElementById('loginSection').style.display='block';
    document.getElementById('app').style.display='none';
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  const loginBtn=document.getElementById('loginBtn');
  const googleBtn=document.getElementById('googleBtn');
  const logoutBtn=document.getElementById('logoutBtn');
  const loginError=document.getElementById('loginError');

  loginBtn.onclick=()=>{
    const email=document.getElementById('loginEmail').value;
    const pass=document.getElementById('loginPass').value;
    auth.createUserWithEmailAndPassword(email, pass)
      .catch(err=>loginError.textContent=err.message)
      .then(()=> auth.signInWithEmailAndPassword(email, pass).catch(err=>loginError.textContent=err.message));
  };

  googleBtn.onclick=()=>{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider).catch(err=>loginError.textContent=err.message);
  };

  logoutBtn.onclick=()=>auth.signOut();

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
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).oninput=saveTemaDebounced);
  document.querySelectorAll('input[name="temaColor"]').forEach(r=>r.onchange=saveTema);
});

// ----------------- Calendar & Data -----------------
function pad(n){return String(n).padStart(2,'0');}
function makeDateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
function formatReadable(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});}

function renderWeekdays(){
  const wd=document.getElementById('weekdays'); wd.innerHTML='';
  weekdays.forEach(d=>{const div=document.createElement('div'); div.textContent=d; wd.appendChild(div);});
}

function renderCalendar(){
  const cal=document.getElementById('calendar'); cal.innerHTML='';
  document.getElementById('monthYear').textContent=`${monthNames[currentMonth]} ${currentYear}`;
  const firstDay=new Date(currentYear,currentMonth,1).getDay(); const leading=(firstDay===0?6:firstDay-1);
  for(let i=0;i<leading;i++){const e=document.createElement('div'); e.className='day-cell empty'; cal.appendChild(e);}
  const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    const userRef=db.collection('contentPlanner').doc(user.uid).collection('dates');
    for(let d=1;d<=daysInMonth;d++){
      const key=makeDateKey(currentYear,currentMonth,d);
      const cell=document.createElement('div'); cell.className='day-cell'; cell.dataset.date=key;
      const num=document.createElement('div'); num.className='day-number'; num.textContent=d; cell.appendChild(num);
      cell.style.backgroundColor=colorMap.free;
      cell.onclick=()=>openMenuForDate(key);
      userRef.doc(key).get().then(doc=>{
        if(doc.exists){
          const c=doc.data().temaColor || 'free';
          cell.style.backgroundColor=colorMap[c]||colorMap.free;
        }
      });
      cal.appendChild(cell);
    }
  });
}

function openMenuForDate(key){selectedDateKey=key; document.getElementById('menuDateTitle').textContent=formatReadable(key); showMenu();}
function showMenu(){document.getElementById('menu').classList.add('active');}
function closeMenu(){document.getElementById('menu').classList.remove('active');}
function showPanel(id){document.getElementById(id).classList.add('active');}
function hidePanel(id){document.getElementById(id).classList.remove('active');}

// ----------------- Tema -----------------
function showTema(){closeMenu(); selectedType='tema'; document.getElementById('temaDateTitle').textContent=formatReadable(selectedDateKey); showPanel('temaPage'); loadTemaData(selectedDateKey);}
function loadTemaData(key){
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).value='');
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    const docRef=db.collection('contentPlanner').doc(user.uid).collection('dates').doc(key);
    docRef.get().then(doc=>{
      if(doc.exists){
        const d=doc.data();
        if(d.tema) document.getElementById('tema_tema').value=d.tema;
        if(d.goal) document.getElementById('tema_goal').value=d.goal;
        if(d.activity) document.getElementById('tema_activity').value=d.activity;
        const c=d.temaColor||'free';
        const r=document.querySelector(`input[name="temaColor"][value="${c}"]`);
        if(r) r.checked=true;
      }
    });
  });
}

function saveTema(){
  const user=auth.currentUser;
  if(!selectedDateKey || !user) return;
  const tema=document.getElementById('tema_tema').value;
  const goal=document.getElementById('tema_goal').value;
  const activity=document.getElementById('tema_activity').value;
  const temaColor=(document.querySelector('input[name="temaColor"]:checked')||{}).value||'free';
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).set({tema,goal,activity,temaColor},{merge:true});
  updateCellColor(selectedDateKey,temaColor);
}
let temaTimer; function saveTemaDebounced(){clearTimeout(temaTimer); temaTimer=setTimeout(saveTema,500);}
function updateCellColor(key,color){
  const el=document.querySelector(`.day-cell[data-date="${key}"]`);
  if(el) el.style.backgroundColor=colorMap[color]||colorMap.free;
}

// ----------------- Editor -----------------
function showEditor(type){
  if(!selectedDateKey) return;
  selectedType=type;
  document.getElementById('editorDateTitle').textContent=formatReadable(selectedDateKey);
  document.getElementById('editorTypeLabel').textContent=type.charAt(0).toUpperCase()+type.slice(1);
  showPanel('editorPage');
  if(!quill){
    quill=new Quill('#editorText',{theme:'snow',modules:{toolbar:'#editorToolbar'}});
    quill.on('text-change',saveEditorDebounced);
  }
  loadEditorData(selectedDateKey,type);
}

function loadEditorData(key,type){
  const user=auth.currentUser;
  if(!user || !quill) return;
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(key).get().then(doc=>{
    if(doc.exists && doc.data()[type]) quill.root.innerHTML=doc.data()[type]; else quill.root.innerHTML='';
  });
}

let editorTimer; function saveEditorDebounced(){clearTimeout(editorTimer); editorTimer=setTimeout(saveEditor,500);}
function saveEditor(){
  const user=auth.currentUser;
  if(!user || !selectedDateKey || !selectedType || !quill) return;
  const content=quill.root.innerHTML;
  const obj={}; obj[selectedType]=content;
  db.collection('contentPlanner').doc(user.uid).collection('dates').doc(selectedDateKey).set(obj,{merge:true});
}

function copyEditorText(){if(quill) navigator.clipboard.writeText(quill.getText());}
