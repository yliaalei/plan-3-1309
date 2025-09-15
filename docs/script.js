/* 
  script.js
  - календарь с навигацией
  - тема (автосохранение)
  - Quill-редактор для сторис/постов/рилс (с поддержкой ссылок и изображений)
  - при тапе на ссылку — мгновенный переход (capture listener)
  - кнопка "Скачать" скачивает первую картинку в редакторе (fetch -> blob -> download)
  - сохраняет HTML редактора в Firestore (коллекция contentPlanner, документ key YYYY-MM-DD)
*/

/* ---------- init Firebase (firebase-config.js должен быть рядом) ---------- */
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ---------- конфиг цветов ---------- */
const colorMap = {
  free: '#ffffff',
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

/* ---------- состояние и константы ---------- */
let selectedDateKey = null; // YYYY-MM-DD
let selectedType = null;    // 'stories'|'post'|'reel'|'tema'
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let quill = null;

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

/* ---------- date helpers ---------- */
function pad(n){ return String(n).padStart(2,'0'); }
function makeDateKey(y,m,d){ /* m — 0..11 */ return `${y}-${pad(m+1)}-${pad(d)}`; }
function parseDateKeyToLocal(key){ const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); }
function formatReadable(key){ const dt = parseDateKeyToLocal(key); return dt.toLocaleDateString('ru-RU', { day:'2-digit', month:'long', year:'numeric' }); }

/* ---------- DOM init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prevBtn').addEventListener('click', ()=>{ currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); });
  document.getElementById('nextBtn').addEventListener('click', ()=>{ currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); });

  // menu buttons
  document.getElementById('menuClose').addEventListener('click', closeMenu);
  document.getElementById('btnTema').addEventListener('click', showTema);
  document.getElementById('btnStories').addEventListener('click', ()=>showEditor('stories'));
  document.getElementById('btnPost').addEventListener('click', ()=>showEditor('post'));
  document.getElementById('btnReel').addEventListener('click', ()=>showEditor('reel'));

  // tema panel
  document.getElementById('temaBack').addEventListener('click', ()=>hidePanel('temaPage'));
  ['tema_tema','tema_goal','tema_activity'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', debounce(saveTema, 500));
  });
  document.querySelectorAll('input[name="temaColor"]').forEach(r => r.addEventListener('change', saveTema));

  // editor panel
  document.getElementById('editorBack').addEventListener('click', ()=>hidePanel('editorPage'));
  document.getElementById('copyBtn').addEventListener('click', copyEditorHTML);
  document.getElementById('downloadBtn').addEventListener('click', downloadImageFromEditor);

  // render UI
  renderWeekdays();
  renderCalendar();
});

/* ---------- render weekdays ---------- */
function renderWeekdays(){
  const wd = document.getElementById('weekdays');
  wd.innerHTML = '';
  weekdays.forEach(d => { const div = document.createElement('div'); div.textContent = d; wd.appendChild(div); });
}

/* ---------- render calendar ---------- */
function renderCalendar(){
  const cal = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  cal.innerHTML = '';
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // getDay(): 0 (Sun) - 6 (Sat)
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const leading = (firstDayWeekday === 0) ? 6 : (firstDayWeekday - 1); // shift so Monday=0

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

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    cell.appendChild(num);

    // default marked free
    cell.style.backgroundColor = colorMap.free;

    // click opens menu
    cell.addEventListener('click', ()=> openMenuForDate(key) );

    // load saved color if exists
    loadDataForCell(key, cell);

    cal.appendChild(cell);
  }
}

/* ---------- menu open/close ---------- */
function openMenuForDate(key){
  selectedDateKey = key;
  document.getElementById('menuDateTitle').textContent = formatReadable(key);
  showMenu();
}
function showMenu(){ const m = document.getElementById('menu'); m.classList.add('active'); m.setAttribute('aria-hidden','false'); }
function closeMenu(){ const m = document.getElementById('menu'); m.classList.remove('active'); m.setAttribute('aria-hidden','true'); }

/* ---------- tema (load/save) ---------- */
function showTema(){
  closeMenu();
  selectedType = 'tema';
  document.getElementById('temaDateTitle').textContent = formatReadable(selectedDateKey);
  showPanel('temaPage');
  loadTemaData(selectedDateKey);
}
function loadTemaData(key){
  document.getElementById('tema_tema').value = '';
  document.getElementById('tema_goal').value = '';
  document.getElementById('tema_activity').value = '';
  const freeRadio = document.querySelector('input[name="temaColor"][value="free"]'); if(freeRadio) freeRadio.checked = true;

  db.collection('contentPlanner').doc(key).get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      if(data.tema) document.getElementById('tema_tema').value = data.tema;
      if(data.goal) document.getElementById('tema_goal').value = data.goal;
      if(data.activity) document.getElementById('tema_activity').value = data.activity;
      const c = data.temaColor || 'free';
      const radio = document.querySelector(`input[name="temaColor"][value="${c}"]`);
      if(radio) radio.checked = true;
    }
  }).catch(err => console.error('loadTemaData', err));
}
function saveTema(){
  if(!selectedDateKey) return;
  const tema = document.getElementById('tema_tema').value || '';
  const goal = document.getElementById('tema_goal').value || '';
  const activity = document.getElementById('tema_activity').value || '';
  const temaColor = (document.querySelector('input[name="temaColor"]:checked') || {}).value || 'free';

  db.collection('contentPlanner').doc(selectedDateKey).set({ tema, goal, activity, temaColor }, { merge:true })
    .then(()=> updateCellColor(selectedDateKey, temaColor))
    .catch(err => console.error('saveTema', err));
}

/* ---------- editor (Quill) ---------- */
function showEditor(type){
  closeMenu();
  selectedType = type; // stories/post/reel
  document.getElementById('editorDateTitle').textContent = formatReadable(selectedDateKey);
  document.getElementById('editorTypeLabel').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  showPanel('editorPage');

  if(!quill){
    quill = new Quill('#editorText', {
      theme: 'snow',
      modules: {
        toolbar: '#editorToolbar'
      }
    });

    // Перехватываем клики на ссылках — открывать сразу
    quill.root.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a');
      if(a && a.href){
        e.preventDefault();
        // открываем в новой вкладке
        window.open(a.href, '_blank', 'noopener');
      }
    }, true); // capture = true чтобы избежать поведения Quill

    // Также перехватываем touchstart на мобильных (чтобы не показывались тултипы)
    quill.root.addEventListener('touchstart', function(e){
      const a = e.target.closest && e.target.closest('a');
      if(a && a.href){
        e.preventDefault();
        window.open(a.href, '_blank', 'noopener');
      }
    }, { passive:false, capture:true });

    // Автосохранение при изменении
    quill.on('text-change', debounce(saveEditor, 700));
  }

  // загрузить содержимое (HTML) в редактор
  loadEditorData(selectedDateKey, type);
}

function loadEditorData(key, type){
  if(!quill) return;
  quill.setContents([]); // пусто
  db.collection('contentPlanner').doc(key).get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      if(data[type]){
        // вставляем HTML
        quill.root.innerHTML = data[type];
        // Установим target для всех ссылок (на случай)
        quill.root.querySelectorAll('a').forEach(a=>a.setAttribute('target','_blank'));
      } else {
        quill.root.innerHTML = '';
      }
    } else {
      quill.root.innerHTML = '';
    }
  }).catch(err=> console.error('loadEditorData', err));
}

function saveEditor(){
  if(!selectedDateKey || !selectedType || !quill) return;
  const html = quill.root.innerHTML;
  db.collection('contentPlanner').doc(selectedDateKey).set({ [selectedType]: html }, { merge:true })
    .catch(err => console.error('saveEditor', err));
}

/* ---------- загрузка данных в клетку (цвет) ---------- */
function loadDataForCell(key, cellEl){
  db.collection('contentPlanner').doc(key).get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      const c = data.temaColor || 'free';
      cellEl.style.backgroundColor = colorMap[c] || colorMap.free;
    } else {
      cellEl.style.backgroundColor = colorMap.free;
    }
  }).catch(err => {
    console.error('loadDataForCell', err);
    cellEl.style.backgroundColor = colorMap.free;
  });
}

function updateCellColor(key, color){
  const el = document.querySelector(`.day-cell[data-date="${key}"]`);
  if(el) el.style.backgroundColor = colorMap[color] || colorMap.free;
}

/* ---------- кнопка копировать (копируем HTML) ---------- */
function copyEditorHTML(){
  if(!quill) return;
  const html = quill.root.innerHTML;
  navigator.clipboard.writeText(html).then(()=>{
    const btn = document.getElementById('copyBtn');
    const old = btn.textContent;
    btn.textContent = 'Скопировано';
    setTimeout(()=> btn.textContent = old, 1000);
  }).catch(()=> alert('Не удалось скопировать'));
}

/* ---------- кнопка скачать — скачиваем первую картинку в редакторе ---------- */
async function downloadImageFromEditor(){
  if(!quill) return alert('Редактор не готов');
  const img = quill.root.querySelector('img');
  if(!img || !img.src) return alert('Изображение не найдено в тексте');

  const src = img.src;
  try {
    const resp = await fetch(src, { mode: 'cors' }); // работает для data: и для CORS-совместных URLs
    const blob = await resp.blob();
    let mime = blob.type || 'image/png';
    // определяем расширение
    const ext = mimeToExt(mime);
    const filename = `image.${ext}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('downloadImage error', err);
    // fallback: если fetch не удался (CORS), попытаемся открыть изображение в новой вкладке, чтобы пользователь смог сохранить вручную
    const tryOpen = confirm('Не удалось автоматически скачать картинку (возможная блокировка CORS). Открыть изображение в новой вкладке для сохранения вручную?');
    if(tryOpen) window.open(src, '_blank', 'noopener');
  }
}

function mimeToExt(mime){
  if(!mime) return 'png';
  mime = mime.toLowerCase();
  if(mime.includes('jpeg')) return 'jpg';
  if(mime.includes('jpg')) return 'jpg';
  if(mime.includes('png')) return 'png';
  if(mime.includes('gif')) return 'gif';
  return 'png';
}

/* ---------- utils: debounce ---------- */
function debounce(fn, wait){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=> fn.apply(this, args), wait);
  };
}

/* ---------- простые debounce-обёртки (если нужно) ---------- */
const debounceSaveEditor = debounce(saveEditor, 700);

/* Экспонируем для отладки (опционально) */
window._app = { saveEditor, saveTema };

/* ---------- конец файла ---------- */
