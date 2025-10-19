let calendarRef;
let quill;
let selectedDateKey = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const colorMap = { free:'#fff', family:'#c8f7e8', health:'#fff7c2', work:'#ffd7ea', hobby:'#e8e1ff' };

// ------------------- Auth -------------------
auth.onAuthStateChanged(user => {
  const loginSection = document.getElementById('loginSection');
  const appDiv = document.getElementById('app');
  if(user){
    loginSection.style.display = 'none';
    appDiv.style.display = 'block';

    // Определяем коллекцию
    if(user.email === 'ylia.alei@gmail.com'){
      calendarRef = db.collection('contentPlanner');
    } else {
      calendarRef = db.collection('users').doc(user.uid).collection('calendar');
    }
    initApp();
  } else {
    loginSection.style.display = 'block';
    appDiv.style.display = 'none';
  }
});

// ------------------- DOM -------------------
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const googleBtn = document.getElementById('googleBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  loginBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => loginError.textContent = err.message);
  };

  registerBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    auth.createUserWithEmailAndPassword(email, pass).catch(err => loginError.textContent = err.message);
  };

  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    auth.signInWithPopup(provider).catch(err => loginError.textContent = err.message);
  };

  logoutBtn.onclick = () => auth.signOut();
});

// ------------------- App -------------------
function initApp(){
  renderWeekdays();
  renderCalendar();

  // Навигация
  document.getElementById('prevBtn').onclick = () => {currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar();};
  document.getElementById('nextBtn').onclick = () => {currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar();};

  // Меню
  document.getElementById('menuClose').onclick = closeMenu;
  document.getElementById('btnTema').onclick = showTema;
  document.getElementById('btnStories').onclick = () => showEditor('stories');
  document.getElementById('btnPost').onclick = () => showEditor('post');
  document.getElementById('btnReel').onclick = () => showEditor('reel');
  document.getElementById('temaBack').onclick = () => hidePanel('temaPage');
  document.getElementById('editorBack').onclick = () => hidePanel('editorPage');
  document.getElementById('copyBtn').onclick = copyEditorText;
}

// ------------------- Calendar -------------------
function pad(n){return String(n).padStart(2,'0');}
function makeDateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
function formatReadable(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});}

function renderWeekdays(){
  const wd = document.getElementById('weekdays');
  wd.innerHTML = '';
  weekdays.forEach(d => {const div=document.createElement('div'); div.textContent=d; wd.appendChild(div);});
}

function renderCalendar(){
  const cal=document.getElementById('calendar'); cal.innerHTML='';
  document.getElementById('monthYear').textContent=`${monthNames[currentMonth]} ${currentYear}`;
  const firstDay=new Date(currentYear,currentMonth,1).getDay(); 
  const offset = firstDay===0?6:firstDay-1;
  const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
  for(let i=0;i<offset;i++){const div=document.createElement('div'); cal.appendChild(div);}
  for(let d=1; d<=daysInMonth; d++){
    const key = makeDateKey(currentYear,currentMonth,d);
    const div = document.createElement('div');
    div.className='day-cell';
    div.dataset.key = key;
    const span=document.createElement('div'); span.className='day-number'; span.textContent=d; div.appendChild(span);
    div.onclick = ()=>openMenu(key, div);
    cal.appendChild(div);
    loadTemaData(key); // окрашивание
  }
}

function updateCellColor(key,color){
  const cell=document.querySelector(`.day-cell[data-key="${key}"]`);
  if(cell) cell.style.background=colorMap[color]||'#fff';
}

// ------------------- Menu -------------------
function openMenu(key, div){
  selectedDateKey = key;
  document.getElementById('menuDateTitle').textContent = formatReadable(key);
  document.getElementById('menu').classList.add('active');
}

function closeMenu(){
  document.getElementById('menu').classList.remove('active');
}

// ------------------- Tema -------------------
function showTema(){
  closeMenu();
  const panel = document.getElementById('temaPage');
  panel.classList.add('active');
  document.getElementById('temaDateTitle').textContent = formatReadable(selectedDateKey);
  loadTemaData(selectedDateKey);
}

function loadTemaData(key){
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).value='');
  calendarRef.doc(key).get().then(doc=>{
    if(doc.exists){
      const d=doc.data();
      if(d.tema) document.getElementById('tema_tema').value=d.tema;
      if(d.goal) document.getElementById('tema_goal').value=d.goal;
      if(d.activity) document.getElementById('tema_activity').value=d.activity;
      const c = d.temaColor || 'free';
      const r = document.querySelector(`input[name="temaColor"][value="${c}"]`);
      if(r) r.checked = true;
      updateCellColor(key,c);
    }
  });
}

document.querySelectorAll('input[name="temaColor"]').forEach(radio=>{
  radio.addEventListener('change',()=>saveTema());
});

function saveTema(){
  const tema = document.getElementById('tema_tema').value;
  const goal = document.getElementById('tema_goal').value;
  const activity = document.getElementById('tema_activity').value;
  const temaColor = (document.querySelector('input[name="temaColor"]:checked')||{}).value || 'free';
  if(selectedDateKey) {
    calendarRef.doc(selectedDateKey).set({tema,goal,activity,temaColor},{merge:true});
    updateCellColor(selectedDateKey,temaColor);
  }
}

function hidePanel(id){document.getElementById(id).classList.remove('active');}

// ------------------- Editor -------------------
function showEditor(type){
  closeMenu();
  selectedType = type;
  const panel = document.getElementById('editorPage');
  panel.classList.add('active');
  document.getElementById('editorTypeLabel').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('editorDateTitle').textContent = formatReadable(selectedDateKey);

  if(!quill) quill = new Quill('#editorText',{modules:{toolbar:'#editorToolbar'},theme:'snow'});

  calendarRef.doc(selectedDateKey).get().then(doc=>{
    if(doc.exists){
      const d = doc.data();
      quill.setText(d[type]||'');
    } else quill.setText('');
  });

  quill.on('text-change',()=>saveEditor());
}

function saveEditor(){
  if(!selectedDateKey || !selectedType) return;
  const val = quill.getText();
  calendarRef.doc(selectedDateKey).set({[selectedType]:val},{merge:true});
}

function copyEditorText(){
  navigator.clipboard.writeText(quill.getText());
}
