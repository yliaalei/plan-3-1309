// ===== Firebase init =====
const db = firebase.firestore();
const auth = firebase.auth();

// ===== Google Auth =====
const googleBtn = document.getElementById('googleBtn');
const authSection = document.getElementById('authSection');
const appDiv = document.getElementById('app');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

googleBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    const user = result.user;
    if (user.email !== 'ylia.alei@gmail.com') {
      auth.signOut();
      authError.textContent = 'Доступ разрешён только владельцу';
    }
  }).catch(err => {
    authError.textContent = err.message;
  });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// ===== Calendar setup =====
const monthYearLabel = document.getElementById('monthYear');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const weekdaysContainer = document.getElementById('weekdays');
const calendarContainer = document.getElementById('calendar');
const calendarBg = document.getElementById('calendarContainer');

const calendarButtons = {
  tema: document.getElementById('btnTema'),
  stories: document.getElementById('btnStories'),
  post: document.getElementById('btnPost'),
  reel: document.getElementById('btnReel')
};

const editors = {
  temaPage: document.getElementById('temaPage'),
  editorPage: document.getElementById('editorPage'),
  editorText: document.getElementById('editorText'),
  temaBack: document.getElementById('temaBack'),
  editorBack: document.getElementById('editorBack'),
  temaFields: {
    tema: document.getElementById('tema_tema'),
    goal: document.getElementById('tema_goal'),
    type: document.getElementById('tema_type')
  }
};

const monthBackgrounds = [
  'https://i.pinimg.com/736x/f1/60/2d/f1602d2c149edac0031b3bc9712f7aa0.jpg',
  'https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg',
  'https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg',
  'https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg',
  'https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg',
  'https://i.pinimg.com/736x/b6/4a/40/b64a40d46d76c07b38f402b700a68ebf.jpg',
  'https://i.pinimg.com/736x/4b/c9/9c/4bc99c0eb0510c4afa3def6130fb5d5e.jpg',
  'https://i.pinimg.com/736x/8d/75/94/8d75944f391040cc5158c2b30e562f10.jpg',
  'https://i.pinimg.com/1200x/0d/76/0e/0d760ea90c9a8b8c8dcbf746c654274b.jpg',
  'https://i.pinimg.com/736x/c2/72/11/c272119855bf0720da0d29c3a3d4957c.jpg',
  'https://i.pinimg.com/736x/aa/13/7a/aa137acb45295656a15a8ae1c3a061cd.jpg',
  'https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg'
];

let currentDate = new Date();

// ===== Functions =====
function formatWeekdays() {
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  weekdaysContainer.innerHTML = '';
  days.forEach(d => {
    const el = document.createElement('div');
    el.textContent = d;
    weekdaysContainer.appendChild(el);
  });
}

function updateCalendarBackground() {
  const month = currentDate.getMonth();
  calendarBg.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${monthBackgrounds[month]})`;
  calendarBg.style.backgroundSize = 'cover';
  calendarBg.style.backgroundPosition = 'center';
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  monthYearLabel.textContent = `${currentDate.toLocaleString('ru', { month:'long' })} ${year}`;
  calendarContainer.innerHTML = '';
  calendarContainer.appendChild(weekdaysContainer);

  let startIndex = firstDay === 0 ? 6 : firstDay - 1; // adjust for Mon-Sun
  for(let i=0;i<startIndex;i++){
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('day-cell','empty');
    calendarContainer.appendChild(emptyCell);
  }
  for(let i=1;i<=lastDate;i++){
    const cell = document.createElement('div');
    cell.classList.add('day-cell');
    const dayNum = document.createElement('div');
    dayNum.classList.add('day-number');
    dayNum.textContent = i;
    cell.appendChild(dayNum);
    cell.addEventListener('click', ()=>openTemaEditor(i));
    calendarContainer.appendChild(cell);
  }
  updateCalendarBackground();
}

// ===== Editor functions =====
function openTemaEditor(day){
  editors.temaPage.classList.add('active');
  const month = currentDate.getMonth()+1;
  const year = currentDate.getFullYear();
  document.getElementById('temaDateTitle').textContent = `${day}.${month}.${year}`;
  // load data from Firestore
}

function closeTemaEditor(){
  editors.temaPage.classList.remove('active');
}

function openEditor(day,type){
  editors.editorPage.classList.add('active');
  const month = currentDate.getMonth()+1;
  const year = currentDate.getFullYear();
  document.getElementById('editorDateTitle').textContent = `${day}.${month}.${year}`;
  editors.editorText.innerHTML = '';
}

function closeEditor(){
  editors.editorPage.classList.remove('active');
}

// ===== Navigation =====
prevBtn.addEventListener('click', ()=>{
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
});
nextBtn.addEventListener('click', ()=>{
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
});

// ===== Buttons =====
calendarButtons.tema.addEventListener('click', ()=>openTemaEditor(new Date().getDate()));
calendarButtons.stories.addEventListener('click', ()=>openEditor(new Date().getDate(),'stories'));
calendarButtons.post.addEventListener('click', ()=>openEditor(new Date().getDate(),'post'));
calendarButtons.reel.addEventListener('click', ()=>openEditor(new Date().getDate(),'reel'));
editors.temaBack.addEventListener('click', closeTemaEditor);
editors.editorBack.addEventListener('click', closeEditor);

// ===== Auth state =====
auth.onAuthStateChanged(user=>{
  if(user && user.email==='ylia.alei@gmail.com'){
    authSection.classList.remove('active');
    appDiv.style.display='block';
    renderCalendar();
    formatWeekdays();
  } else {
    authSection.classList.add('active');
    appDiv.style.display='none';
  }
});

