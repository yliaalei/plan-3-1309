// --------------------
// ИНСТРУКЦИИ:
// 1) Убедись, что firebase-config.js с твоим конфигом лежит рядом (в docs).
// 2) Firestore: коллекция будет 'contentPlanner', документы — ключ 'YYYY-MM-DD' (локальная дата).
// --------------------

// Инициализация Firebase (предполагается, что firebaseConfig задан в firebase-config.js)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Цвета (включая белый 'free')
const colorMap = {
  free: '#ffffff',
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

let selectedDateKey = null; // 'YYYY-MM-DD'
let selectedType = null;    // 'tema' | 'stories' | 'post' | 'reel'
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

/* ---------- помощники для работы с датами (локально, без UTC-сдвигов) ---------- */
function pad(n){ return String(n).padStart(2,'0'); }
// формируем ключ YYYY-MM-DD по локальной дате (y, m 0..11, d)
function makeDateKey(y, m, d){
  return `${y}-${pad(m+1)}-${pad(d)}`;
}
// преобразуем ключ YYYY-MM-DD в объект Date в локальной зоне
function parseDateKeyToLocal(isoKey){
  const [y, m, d] = isoKey.split('-').map(Number);
  return new Date(y, m-1, d);
}
// читаемый формат для пользователя
function formatReadable(isoKey){
  const dt = parseDateKeyToLocal(isoKey);
  return dt.toLocaleDateString('ru-RU', { day:'2-digit', month:'long', year:'numeric' });
}

/* ---------- инициализация UI ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // nav buttons
  document.getElementById('prevBtn').addEventListener('click', prevMonth);
  document.getElementById('nextBtn').addEventListener('click', nextMonth);

  // menu buttons
  document.getElementById('menuClose').addEventListener('click', closeMenu);
  document.getElementById('btnTema').addEventListener('click', showTema);
  document.getElementById('btnStories').addEventListener('click', ()=>showEditor('stories'));
  document.getElementById('btnPost').addEventListener('click', ()=>showEditor('post'));
  document.getElementById('btnReel').addEventListener('click', ()=>showEditor('reel'));

  // panel navigation
  document.getElementById('temaBack').addEventListener('click', ()=>{ hidePanel('temaPage'); });
  document.getElementById('tema_tema').addEventListener('input', saveTemaDebounced);
  document.getElementById('tema_goal').addEventListener('input', saveTemaDebounced);
  document.getElementById('tema_activity').addEventListener('input', saveTemaDebounced);
  document.querySelectorAll('input[name="temaColor"]').forEach(r=> r.addEventListener('change', saveTema));

  document.getElementById('editorBack').addEventListener('click', ()=>{ hidePanel('editorPage'); });
  document.getElementById('editorText').addEventListener('input', saveEditorDebounced);
  document.getElementById('copyBtn').addEventListener('click', copyEditorText);

  // отрисовать дни недели и календарь
  renderWeekdays();
  renderCalendar();
});

/* ---------- отрисовка дней недели ---------- */
function renderWeekdays(){
  const wd = document.getElementById('weekdays');
  wd.innerHTML = '';
  weekdays.forEach(d => {
    const div = document.createElement('div');
    div.textContent = d;
    wd.appendChild(div);
  });
}

/* ---------- календарь (перелистывание мес.) ---------- */
function renderCalendar(){
  const cal = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  cal.innerHTML = '';
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // какой день недели — 0 (воскресенье) .. 6 (суббота) — нам нужен сдвиг для Пн..Вс
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0..6
  // вычислим пустые ячейки перед первым днём (сдвиг понедельник=0)
  const leading = (firstDayWeekday === 0) ? 6 : (firstDayWeekday - 1);

  for(let i=0;i<leading;i++){
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    cal.appendChild(empty);
  }

  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
  for(let d=1; d<=daysInMonth; d++){
    const key = makeDateKey(currentYear, currentMonth, d);
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.date = key;

    // номер дня
    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    cell.appendChild(num);

    // по умолчанию пометим как свободно (white)
    cell.style.backgroundColor = colorMap.free;

    // при клике
    cell.addEventListener('click', ()=> openMenuForDate(key));

    // асинхронно загрузим данные и при наличии темы изменим фон
    loadDataForCell(key, cell);

    cal.appendChild(cell);
  }
}

/* переключение месяцев */
function prevMonth(){ currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); }
function nextMonth(){ currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); }

/* ---------- меню выбора действий ---------- */
function openMenuForDate(dateKey){
  selectedDateKey = dateKey;
  document.getElementById('menuDateTitle').textContent = formatReadable(dateKey);
  showMenu();
}
function showMenu(){ const m = document.getElementById('menu'); m.classList.add('active'); m.setAttribute('aria-hidden','false'); }
function closeMenu(){ const m = document.getElementById('menu'); m.classList.remove('active'); m.setAttribute('aria-hidden','true'); }

/* ---------- панели (tema/editor) ---------- */
function showTema(){
  closeMenu();
  selectedType = 'tema';
  document.getElementById('temaDateTitle').textContent = formatReadable(selectedDateKey);
  document.getElementById('temaPage').classList.add('active');
  document.getElementById('temaPage').setAttribute('aria-hidden','false');
  loadTemaData(selectedDateKey);
}
function showEditor(type){
  closeMenu();
  selectedType = type;
  document.getElementById('editorDateTitle').textContent = formatReadable(selectedDateKey);
  document.getElementById('editorTypeLabel').textContent = type.charAt(0).toUpperCase()+type.slice(1);
  document.getElementById('editorPage').classList.add('active');
  document.getElementById('editorPage').setAttribute('aria-hidden','false');
  loadEditorData(selectedDateKey, type);
}
function hidePanel(panelId){
  const panel = document.getElementById(panelId);
  panel.classList.remove('active');
  panel.setAttribute('aria-hidden','true');
}

/* ---------- Firestore: загрузка/сохранение ---------- */
function loadDataForCell(dateKey, cellElement){
  // документ по ключу dateKey
  db.collection('contentPlanner').doc(dateKey).get().then(docSnap => {
    if(docSnap.exists){
      const data = docSnap.data();
      const c = data.temaColor || 'free';
      cellElement.style.backgroundColor = colorMap[c] || colorMap.free;
    } else {
      // оставляем default free
      cellElement.style.backgroundColor = colorMap.free;
    }
  }).catch(err=>{
    console.error('loadDataForCell error', err);
  });
}

/* ----- ТЕМА: загрузка и сохранение ----- */
function loadTemaData(dateKey){
  // set default values (clears)
  document.getElementById('tema_tema').value = '';
  document.getElementById('tema_goal').value = '';
  document.getElementById('tema_activity').value = '';
  // default radio to free
  const freeRadio = document.querySelector('input[name="temaColor"][value="free"]');
  if(freeRadio) freeRadio.checked = true;

  db.collection('contentPlanner').doc(dateKey).get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      if(data.tema) document.getElementById('tema_tema').value = data.tema;
      if(data.goal) document.getElementById('tema_goal').value = data.goal;
      if(data.activity) document.getElementById('tema_activity').value = data.activity;
      const c = data.temaColor || 'free';
      const radio = document.querySelector(`input[name="temaColor"][value="${c}"]`);
      if(radio) radio.checked = true;
    }
  }).catch(err=> console.error('loadTemaData', err));
}

// сохраняем тему (merge)
function saveTema(){
  if(!selectedDateKey) return;
  const tema = document.getElementById('tema_tema').value || '';
  const goal = document.getElementById('tema_goal').value || '';
  const activity = document.getElementById('tema_activity').value || '';
  const temaColor = (document.querySelector('input[name="temaColor"]:checked') || {}).value || 'free';

  const payload = { tema, goal, activity, temaColor };
  db.collection('contentPlanner').doc(selectedDateKey).set(payload, { merge:true })
    .then(()=> {
      // обновим цвет ячейки на экране
      updateCellColor(selectedDateKey, temaColor);
    }).catch(err=> console.error('saveTema', err));
}

// дебаунс для автосохранения
let saveTemaTimer = null;
function saveTemaDebounced(){
  clearTimeout(saveTemaTimer);
  saveTemaTimer = setTimeout(saveTema, 500);
}

/* обновление клетки на странице (если отрисована) */
function updateCellColor(dateKey, color){
  const el = document.querySelector(`.day-cell[data-date="${dateKey}"]`);
  if(el) el.style.backgroundColor = colorMap[color] || colorMap.free;
}

/* ----- РЕДАКТОР (stories/post/reel) ----- */
function loadEditorData(dateKey, type){
  const ta = document.getElementById('editorText');
  ta.value = '';
  db.collection('contentPlanner').doc(dateKey).get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      if(data[type]) ta.value = data[type];
    }
  }).catch(err=> console.error('loadEditorData', err));
}
function saveEditor(){
  if(!selectedDateKey || !selectedType) return;
  const val = document.getElementById('editorText').value || '';
  db.collection('contentPlanner').doc(selectedDateKey).set({ [selectedType]: val }, { merge:true })
    .catch(err=> console.error('saveEditor', err));
}
let saveEditorTimer = null;
function saveEditorDebounced(){
  clearTimeout(saveEditorTimer);
  saveEditorTimer = setTimeout(saveEditor, 600);
}

/* копирование текста из редактора */
function copyEditorText(){
  const ta = document.getElementById('editorText');
  if(!ta) return;
  navigator.clipboard.writeText(ta.value).then(()=>{
    // короткое визуальное подтверждение
    const b = document.getElementById('copyBtn');
    const old = b.textContent;
    b.textContent = 'Скопировано';
    setTimeout(()=> b.textContent = old, 1100);
  }).catch(()=> {
    alert('Не удалось скопировать текст');
  });
}

/* ---------- вспомогательные: при загрузке ячеек подставим free по умолчанию ---------- */
/* Обработчик загрузки для отдельных ячеек реализован в loadDataForCell */

// -------------------- конец script.js --------------------
