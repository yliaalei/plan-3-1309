// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Цвета
const colorMap = {
  free: '#ffffff',
  family: '#c8f7e8',
  health: '#fff7c2',
  work: '#ffd7ea',
  hobby: '#e8e1ff'
};

let selectedDateKey = null;
let selectedType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let quill = null;

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function pad(n){ return String(n).padStart(2, '0'); }
function makeDateKey(y, m, d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function formatReadable(key){
  const [y,m,d] = key.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString('ru-RU', { day:'2-digit', month:'long', year:'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  // Кнопки навигации
  document.getElementById('prevBtn').addEventListener('click', () => { currentMonth--; if(currentMonth < 0){ currentMonth = 11; currentYear--; } renderCalendar(); });
  document.getElementById('nextBtn').addEventListener('click', () => { currentMonth++; if(currentMonth > 11){ currentMonth = 0; currentYear++; } renderCalendar(); });

  // Меню кнопки
  document.getElementById('menuClose').addEventListener('click', closeMenu);
  document.getElementById('btnTema').addEventListener('click', showTema);
  document.getElementById('btnStories').addEventListener('click', () => showEditor('stories'));
  document.getElementById('btnPost').addEventListener('click', () => showEditor('post'));
  document.getElementById('btnReel').addEventListener('click', () => showEditor('reel'));

  // Тема панель
  document.getElementById('temaBack').addEventListener('click', () => hidePanel('temaPage'));
  ['tema_tema','tema_goal','tema_activity'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', debounce(saveTema, 500));
  });
  document.querySelectorAll('input[name="temaColor"]').forEach(r => r.addEventListener('change', saveTema));

  // Редактор
  document.getElementById('editorBack').addEventListener('click', () => hidePanel('editorPage'));
  document.getElementById('copyBtn').addEventListener('click', copyEditorHTML);
  document.getElementById('downloadBtn').addEventListener('click', downloadImageFromEditor);

  renderWeekdays();
  renderCalendar();
});

function renderWeekdays(){
  const wd = document.getElementById('weekdays');
  wd.innerHTML = '';
  weekdays.forEach(d => {
    const div = document.createElement('div');
    div.textContent = d;
    wd.appendChild(div);
  });
}

function renderCalendar(){
  const cal = document.getElementById('calendar');
  cal.innerHTML = '';
  const monthYear = document.getElementById('monthYear');
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const leading = (firstDay === 0 ? 6 : firstDay - 1);
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

    cell.style.backgroundColor = colorMap.free;
    cell.addEventListener('click', () => openMenuForDate(key));

    loadDataForCell(key, cell);

    cal.appendChild(cell);
  }
}

function openMenuForDate(key){
  selectedDateKey = key;
  document.getElementById('menuDateTitle').textContent = formatReadable(key);
  showMenu();
}

function showMenu(){
  const m = document.getElementById('menu');
  m.classList.add('active');
  m.setAttribute('aria-hidden', 'false');
}

function closeMenu(){
  const m = document.getElementById('menu');
  m.classList.remove('active');
  m.setAttribute('aria-hidden', 'true');
}

function showTema(){
  closeMenu();
  selectedType = 'tema';
  document.getElementById('temaDateTitle').textContent = formatReadable(selectedDateKey);
  showPanel('temaPage');
  loadTemaData(selectedDateKey);
}

function loadTemaData(key){
  ['tema_tema','tema_goal','tema_activity'].forEach(id => { document.getElementById(id).value = ''; });
  const freeRadio = document.querySelector('input[name="temaColor"][value="free"]');
  if(freeRadio) freeRadio.checked = true;
  db.collection('contentPlanner').doc(key).get().then(docSnap => {
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
  db.collection('contentPlanner').doc(selectedDateKey).set({
    tema, goal, activity, temaColor
  }, { merge:true }).then(()=>{
    updateCellColor(selectedDateKey, temaColor);
  }).catch(err=> console.error('saveTema', err));
}

function showEditor(type){
  closeMenu();
  selectedType = type;
  document.getElementById('editorDateTitle').textContent = formatReadable(selectedDateKey);
  document.getElementById('editorTypeLabel').textContent = type.charAt(0).toUpperCase() + type.slice(1);

  showPanel('editorPage');
  if(!quill){
    quill = new Quill('#editorText', {
      theme: 'snow',
      modules: { toolbar: '#editorToolbar' }
    });
    quill.root.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a');
      if(a && a.href){
        e.preventDefault();
        window.open(a.href, '_blank', 'noopener');
      }
    }, true);
    quill.on('text-change', debounce(saveEditor, 700));
  }
  loadEditorData(selectedDateKey, type);
}

function loadEditorData(key, type){
  if(!quill) return;
  quill.setContents([]);
  db.collection('contentPlanner').doc(key).get().then(docSnap => {
    if(docSnap.exists){
      const data = docSnap.data();
      if(data[type]){
        quill.root.innerHTML = data[type];
        quill.root.querySelectorAll('a').forEach(a=>a.setAttribute('target','_blank'));
      }
    }
  }).catch(err=> console.error('loadEditorData', err));
}

function saveEditor(){
  if(!selectedDateKey || !selectedType || !quill) return;
  const html = quill.root.innerHTML;
  db.collection('contentPlanner').doc(selectedDateKey).set({ [selectedType]: html }, { merge:true }).catch(err=> console.error('saveEditor', err));
}

let editorTimer;
function debounce(fn, ms){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=> fn.apply(this, args), ms);
  }
}

function copyEditorHTML(){
  if(!quill) return;
  const html = quill.root.innerHTML;
  navigator.clipboard.writeText(html).then(()=>{
    const btn = document.getElementById('copyBtn');
    const old = btn.textContent;
    btn.textContent = 'Скопировано';
    setTimeout(()=> btn.textContent = old, 1000);
  });
}

async function downloadImageFromEditor(){
  if(!quill) return alert('Редактор не готов');
  const img = quill.root.querySelector('img');
  if(!img || !img.src) return alert('Изображение не найдено');
  const src = img.src;
  try {
    const resp = await fetch(src, { mode: 'cors' });
    const blob = await resp.blob();
    const mime = blob.type || 'image/png';
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
  } catch(err){
    console.error('download error', err);
    const tryOpen = confirm('Не удалось скачать автоматически. Открыть изображение в новой вкладке?');
    if(tryOpen) window.open(src, '_blank', 'noopener');
  }
}

function mimeToExt(mime){
  mime = mime.toLowerCase();
  if(mime.includes('jpeg')) return 'jpg';
  if(mime.includes('jpg')) return 'jpg';
  if(mime.includes('png')) return 'png';
  if(mime.includes('gif')) return 'gif';
  return 'png';
}
