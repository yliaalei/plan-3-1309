// --- защищённый script.js ---
// Попытка инициализация Firebase (если SDK и firebaseConfig подключены корректно)
let db = null;
try {
  if (window.firebase && typeof firebase.initializeApp === 'function' && typeof firebaseConfig !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    if (firebase.firestore) {
      db = firebase.firestore();
      console.log('Firebase Firestore initialized');
    } else {
      console.warn('Firebase loaded but firestore not found');
    }
  } else {
    console.warn('Firebase SDK or firebaseConfig not found — работаем в offline режиме (localStorage)');
  }
} catch (e) {
  console.warn('Ошибка инициализации Firebase:', e);
  db = null;
}

// Локальное хранилище fallback
const LOCAL_KEY = 'cp_entries_fallback_v1';
function loadLocalAll(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch (e){ return {}; }
}
function saveLocalAll(obj){
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(obj)); } catch(e){ console.warn(e); }
}
function getLocalDoc(iso){ const all = loadLocalAll(); return all[iso] || {}; }
function setLocalDoc(iso, data){
  const all = loadLocalAll();
  all[iso] = Object.assign({}, all[iso] || {}, data);
  saveLocalAll(all);
  return Promise.resolve();
}

// Универсальные helper'ы для чтения/записи "документа даты"
function getDoc(iso){
  if (!iso) return Promise.resolve({});
  if (db) {
    return db.collection('contentPlanner').doc(iso).get()
      .then(doc => (doc.exists ? doc.data() : {}))
      .catch(err => {
        console.warn('Firestore get error, fallback to local:', err);
        return getLocalDoc(iso);
      });
  } else {
    return Promise.resolve(getLocalDoc(iso));
  }
}
function setDoc(iso, obj){
  if (!iso) return Promise.resolve();
  if (db) {
    return db.collection('contentPlanner').doc(iso).set(obj, { merge: true }).catch(err=>{
      console.warn('Firestore set error, fallback to local:', err);
      return setLocalDoc(iso, obj);
    });
  } else {
    return setLocalDoc(iso, obj);
  }
}

// Цвета и состояние
const colorMap = {
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};
let selectedDate = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Вставляем дни недели (если есть контейнер)
  const weekdaysRow = document.getElementById('weekdays');
  if (weekdaysRow) {
    weekdaysRow.innerHTML = '';
    weekdays.forEach(d => {
      const el = document.createElement('div');
      el.textContent = d;
      weekdaysRow.appendChild(el);
    });
  }

  // Проверим, существует ли элемент monthYear; если нет — создадим его прямо перед календарём
  if (!document.getElementById('monthYear')) {
    const calNav = document.getElementById('calendarNav');
    if (calNav) {
      const span = document.createElement('span');
      span.id = 'monthYear';
      span.style.fontWeight = '700';
      calNav.insertBefore(span, calNav.children[1] || null);
    }
  }

  renderCalendar();
});

// renderCalendar всегда проставляет monthYear (даже если Firebase упал)
function renderCalendar(){
  const calendar = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  if (!calendar) return console.warn('Нет #calendar в DOM');
  if (monthYear) monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  calendar.innerHTML = '';
  // вычисляем смещение: в JS getDay(): 0 вс, 1 пн, ... -> нам нужен пн..вс
  const firstDayJS = new Date(currentYear, currentMonth, 1).getDay();
  const offset = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // пустые ячейки перед началом месяца
  for (let i=0;i<offset;i++){
    const empty = document.createElement('div');
    calendar.appendChild(empty);
  }

  for (let d=1; d<=daysInMonth; d++){
    const date = new Date(currentYear, currentMonth, d);
    const iso = date.toISOString().slice(0,10);
    const cell = document.createElement('div');
    cell.textContent = d;
    cell.dataset.date = iso;
    cell.addEventListener('click', ()=>openMenu(iso, cell));
    // пытаемся поставить цвет (если есть данные)
    getDoc(iso).then(data=>{
      if (data && data.temaColor) cell.style.backgroundColor = colorMap[data.temaColor] || '';
      // можно добавить индикатор заполненности
      if (data && (data.tema || data.stories || data.post || data.reel)) {
        cell.style.boxShadow = 'inset 0 -6px 0 rgba(0,0,0,0.04)';
      }
    });
    calendar.appendChild(cell);
  }
}

// Навигация месяцев
function prevMonth(){
  currentMonth--;
  if (currentMonth < 0){ currentMonth = 11; currentYear--; }
  renderCalendar();
}
function nextMonth(){
  currentMonth++;
  if (currentMonth > 11){ currentMonth = 0; currentYear++; }
  renderCalendar();
}
function goToday(){
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  renderCalendar();
}

// Меню / открытие страниц
function openMenu(iso, cell){
  selectedDate = iso;
  // проставим заголовок даты в меню
  const menuDateTitle = document.getElementById('menuDateTitle');
  if (menuDateTitle) menuDateTitle.textContent = iso;
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'block';
}
function closeMenu(){
  const m = document.getElementById('menu'); if (m) m.style.display = 'none';
}

function showTema(){
  closeMenu();
  selectedType = 'tema';
  const temaPage = document.getElementById('temaPage');
  if (!temaPage) return;
  temaPage.style.display = 'block';
  // загружаем данные и ставим в поля
  getDoc(selectedDate).then(data=>{
    const t = document.getElementById('tema_tema');
    const g = document.getElementById('tema_goal');
    const a = document.getElementById('tema_activity');
    if (t) t.value = data.tema || '';
    if (g) g.value = data.goal || '';
    if (a) a.value = data.activity || '';
    if (data.temaColor){
      const r = document.querySelector(`input[name="temaColor"][value="${data.temaColor}"]`);
      if (r) r.checked = true;
    } else {
      // снимем радио если ничего нет
      document.querySelectorAll('input[name="temaColor"]').forEach(i=>i.checked=false);
    }
  });

  // автосохранение при вводе/смене цвета
  const saveHandler = debounce(()=>saveTema(), 600);
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.oninput = saveHandler;
  });
  document.querySelectorAll('input[name="temaColor"]').forEach(r=>{
    r.onchange = ()=>saveTema();
  });
}

function closeTema(){
  const p = document.getElementById('temaPage'); if (p) p.style.display = 'none';
  selectedType = null;
  renderCalendar(); // обновим цвета
}

// Сохраняем тему (в Firestore, иначе в localStorage)
function saveTema(){
  if (!selectedDate) return;
  const tema = (document.getElementById('tema_tema')?.value || '').trim();
  const goal = (document.getElementById('tema_goal')?.value || '').trim();
  const activity = (document.getElementById('tema_activity')?.value || '').trim();
  const temaColor = document.querySelector('input[name="temaColor"]:checked')?.value || '';

  const payload = { tema, goal, activity, temaColor };
  setDoc(selectedDate, payload).then(()=>{
    // проставим цвет в календаре немедленно
    const cell = document.querySelector(`div[data-date="${selectedDate}"]`);
    if (cell) cell.style.backgroundColor = colorMap[temaColor] || '';
  });
}

// Editor (stories/post/reel)
function showEditor(type){
  closeMenu();
  selectedType = type;
  const editorPage = document.getElementById('editorPage');
  if (!editorPage) return;
  document.getElementById('editorTitle').textContent = type.charAt(0).toUpperCase()+type.slice(1);
  editorPage.style.display = 'block';
  getDoc(selectedDate).then(data=>{
    document.getElementById('editorText').value = data[type] || '';
  });
  // автосохранение
  const et = document.getElementById('editorText');
  if (et) et.oninput = debounce(()=>saveEditor(), 700);
}
function closeEditor(){
  const ep = document.getElementById('editorPage'); if (ep) ep.style.display = 'none';
  selectedType = null;
  renderCalendar();
}
function saveEditor(){
  if (!selectedDate || !selectedType) return;
  const val = document.getElementById('editorText')?.value || '';
  const obj = {}; obj[selectedType] = val;
  setDoc(selectedDate, obj);
}

// debounce util
function debounce(fn, wait){ let t; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }

