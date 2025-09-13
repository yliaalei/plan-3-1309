<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<title>Контент-планировщик</title>
<style>
  :root{
    --bg:#f6fbff; /* light blue */
    --beige:#f3efe6;
    --blue:#4a90e2;
    --muted:#6b7280;
    --card:#ffffff;
    --mint:#c8f7e8;
    --yellow:#fff7c2;
    --pink:#ffd7ea;
    --lavender:#e8e1ff;
    --cell-border: rgba(0,0,0,0.06);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  }
  html,body{height:100%;margin:0;background:linear-gradient(180deg,var(--bg) 0%, #f0f6fb 100%);}
  .app {
    max-width:760px;
    margin:0 auto;
    padding:14px;
  }
  header{
    display:flex;
    gap:12px;
    align-items:start;
    margin-bottom:8px;
  }
  .title {
    flex:1;
  }
  .title h1{
    font-size:20px;
    margin:0;
    color:var(--blue);
    letter-spacing:0.2px;
  }
  .subtitle{
    font-size:12px;
    color:var(--muted);
    margin-top:6px;
    background:linear-gradient(90deg, rgba(243,239,230,0.6), rgba(255,255,255,0));
    padding:8px;
    border-radius:8px;
  }

  /* description under title */
  .desc {
    font-size:13px;
    color:var(--muted);
    margin:10px 0 12px 0;
    padding:10px;
    border-radius:10px;
    background:linear-gradient(90deg, rgba(242,248,255,0.6), rgba(249,246,240,0.5));
  }

  /* calendar */
  .calendar-card{
    background:var(--card);
    border-radius:12px;
    padding:10px;
    box-shadow: 0 4px 18px rgba(20,40,80,0.06);
    margin-bottom:14px;
  }
  .cal-head{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:8px;
    margin-bottom:8px;
  }
  .cal-head .month{
    font-weight:600;
    color:var(--blue);
  }
  .cal-nav button{
    background:transparent;
    border:1px solid var(--cell-border);
    padding:6px 8px;
    border-radius:8px;
    font-size:14px;
  }
  table.calendar{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    font-size:13px;
  }
  table.calendar th{
    text-align:center;
    padding:6px 0;
    color:var(--muted);
    font-weight:600;
    font-size:12px;
  }
  table.calendar td{
    width:14.285%;
    border:1px solid var(--cell-border);
    vertical-align:top;
    padding:6px;
    height:72px;
    box-sizing:border-box;
    position:relative;
    background:transparent;
    border-radius:8px;
    overflow:hidden;
  }
  .date-btn{
    display:block;
    width:100%;
    height:100%;
    border-radius:8px;
    padding:4px;
    text-align:left;
    cursor:pointer;
    background:transparent;
    border:none;
  }
  .date-num{
    font-weight:600;
    font-size:14px;
    color:var(--blue);
  }
  .filled {
    transition:background-color 220ms ease;
  }

  /* small legend under app name */
  .legend {
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:8px;
    font-size:13px;
  }
  .legend .item{
    display:flex;
    gap:6px;
    align-items:center;
    padding:6px 8px;
    border-radius:10px;
    background:var(--beige);
    color:var(--muted);
    font-weight:600;
  }
  .swatch{width:14px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,0.06);}

  /* modal / menu */
  .menu {
    position:fixed;
    left:0;right:0;bottom:0;
    background:linear-gradient(180deg,#fff, #f7fbff);
    border-top-left-radius:14px;
    border-top-right-radius:14px;
    box-shadow: 0 -18px 40px rgba(20,40,80,0.12);
    padding:12px;
    display:none;
    z-index:40;
  }
  .menu.active{display:block;}
  .menu h3{margin:0 0 8px 0;color:var(--blue);}
  .menu .opt{display:block;padding:12px;border-radius:10px;margin-bottom:8px;background:var(--beige);text-align:left;font-weight:700;color:var(--muted);}

  /* editor pages */
  .page{
    display:none;
    padding-bottom:90px;
  }
  .page.active{display:block;}
  .page .topbar{
    display:flex;align-items:center;gap:8px;margin-bottom:10px;
  }
  .btn{
    padding:8px 12px;border-radius:10px;border:none;font-weight:700;
    background:var(--blue);color:white;
  }
  .btn.ghost{
    background:transparent;border:1px solid var(--cell-border);color:var(--muted);
  }
  .container{
    padding:8px;
  }
  label{font-weight:700;color:var(--muted);display:block;margin-bottom:6px;font-size:13px;}
  textarea{
    width:100%;
    min-height:120px;
    border-radius:10px;
    border:1px solid var(--cell-border);
    padding:10px;
    font-size:14px;
    box-sizing:border-box;
    resize:vertical;
    background: #fbfdff;
  }
  .small{
    font-size:12px;color:var(--muted);
  }
  .row{display:flex;gap:8px;align-items:center;}
  .field{
    flex:1;
  }

  /* topic table */
  .topic-table{
    width:100%;
    border-collapse:collapse;
    margin-top:8px;
  }
  .topic-table th, .topic-table td{
    border:1px solid var(--cell-border);
    padding:8px;
    text-align:left;
    vertical-align:top;
    font-size:14px;
  }
  .color-pickers{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
  .color-option{
    display:flex;gap:6px;align-items:center;padding:8px;border-radius:10px;background:var(--beige);
    cursor:pointer;
  }
  .color-option input{display:none;}
  .color-label{font-weight:700;color:var(--muted);font-size:13px;}

  /* bottom space for menu */
  .spacer{height:88px;}

  /* mobile tweaks */
  @media (max-width:420px){
    .date-num{font-size:13px;}
    table.calendar td{height:68px;padding:4px;}
    header{gap:8px;}
  }
</style>
</head>
<body>
<div class="app">
  <header>
    <div class="title">
      <h1>Контент-планировщик</h1>
      <div class="subtitle">Планируй публикации — темы, сторис, посты и рилсы. Цвет темы заполняет дату (меняется только в «Тема»).</div>
    </div>
  </header>

  <div class="desc">
    <strong>Описание цветов и характеристик:</strong>
    <div style="margin-top:8px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <div class="item" style="background:var(--mint);padding:6px 8px;border-radius:8px;">семья — мятный</div>
        <div class="item" style="background:var(--yellow);padding:6px 8px;border-radius:8px;">здоровье — желтый</div>
        <div class="item" style="background:var(--pink);padding:6px 8px;border-radius:8px;">работа — розовый</div>
        <div class="item" style="background:var(--lavender);padding:6px 8px;border-radius:8px;">хобби/развитие — лавандовый</div>
      </div>
    </div>
  </div>

  <div class="calendar-card" id="calendarCard">
    <div class="cal-head">
      <div class="month" id="monthLabel">Месяц Год</div>
      <div class="cal-nav">
        <button id="prevMonth" aria-label="Предыдущий месяц">‹</button>
        <button id="todayBtn" aria-label="Сегодня">Сегодня</button>
        <button id="nextMonth" aria-label="Следующий месяц">›</button>
      </div>
    </div>

    <table class="calendar" id="calendarTable" role="grid" aria-label="Календарь">
      <thead>
        <tr><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th></tr>
      </thead>
      <tbody id="calBody"></tbody>
    </table>
  </div>

  <!-- hidden menu: choose type -->
  <div class="menu" id="menu">
    <h3 id="menuDateTitle">Выберите действие</h3>
    <button class="opt" data-type="tema">Тема и Цель</button>
    <button class="opt" data-type="stories">Сторис</button>
    <button class="opt" data-type="post">Пост</button>
    <button class="opt" data-type="reel">Рилс</button>
    <div style="height:8px"></div>
    <button class="opt" id="closeMenu" style="background:transparent;border:1px solid var(--cell-border);">Отмена</button>
  </div>

  <!-- pages -->
  <div id="pages">
    <!-- Тема -->
    <section class="page" id="page-tema" aria-hidden="true">
      <div class="topbar container">
        <button class="btn ghost" id="backFromTema">↩ назад</button>
        <div style="flex:1"></div>
        <button class="btn" id="copyTema">Скопировать</button>
      </div>
      <div class="container">
        <div id="temaDateTitle" style="font-weight:800;color:var(--blue);margin-bottom:8px"></div>
        <label>Выберите тему (цвет заполняет ячейку даты):</label>
        <div class="color-pickers">
          <label class="color-option" data-val="family">
            <input type="radio" name="temaColor" value="family">
            <div class="swatch" style="background:var(--mint)"></div>
            <div class="color-label">семья</div>
          </label>
          <label class="color-option" data-val="health">
            <input type="radio" name="temaColor" value="health">
            <div class="swatch" style="background:var(--yellow)"></div>
            <div class="color-label">здоровье</div>
          </label>
          <label class="color-option" data-val="work">
            <input type="radio" name="temaColor" value="work">
            <div class="swatch" style="background:var(--pink)"></div>
            <div class="color-label">работа</div>
          </label>
          <label class="color-option" data-val="hobby">
            <input type="radio" name="temaColor" value="hobby">
            <div class="swatch" style="background:var(--lavender)"></div>
            <div class="color-label">хобби/развитие</div>
          </label>
        </div>

        <table class="topic-table" aria-label="Тема таблица">
          <thead>
            <tr><th>Пункт</th><th>Текст</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style="width:35%;font-weight:800">Тема</td>
              <td><textarea id="tema_tema" placeholder="Введите тему..."></textarea></td>
            </tr>
            <tr>
              <td style="font-weight:800">Цель</td>
              <td><textarea id="tema_goal" placeholder="Что хотите получить?"></textarea></td>
            </tr>
            <tr>
              <td style="font-weight:800">Активность</td>
              <td><textarea id="tema_activity" placeholder="Какие действия (лайки, репост, сторис)..."></textarea></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Generic editor page template (used for Stories/Post/Reel) -->
    <section class="page" id="page-editor" aria-hidden="true">
      <div class="topbar container">
        <button class="btn ghost" id="backFromEditor">↩ назад</button>
        <div style="flex:1"></div>
        <button class="btn" id="copyEditor">Скопировать</button>
      </div>
      <div class="container">
        <div id="editorDateTitle" style="font-weight:800;color:var(--blue);margin-bottom:8px"></div>
        <label id="editorTypeLabel">Тип</label>
        <textarea id="editorText" placeholder="Введите текст..." ></textarea>
      </div>
    </section>
  </div>

  <div class="spacer"></div>
</div>

<script>
(function(){
  // Utilities and state
  const LO_KEY = 'cp_entries_v1'; // stores per date & type text
  const META_KEY = 'cp_meta_v1'; // stores per date meta like tema color
  const state = {
    view: 'calendar',
    year: null,
    month: null, // 0-indexed
    selectedDateISO: null, // 'YYYY-MM-DD'
    selectedType: null
  };

  // color mapping
  const colorMap = {
    family: 'var(--mint)',
    health: 'var(--yellow)',
    work: 'var(--pink)',
    hobby: 'var(--lavender)'
  };

  // load storage
  function loadEntries(){ try{ return JSON.parse(localStorage.getItem(LO_KEY) || '{}'); }catch(e){return{}} }
  function saveEntries(obj){ localStorage.setItem(LO_KEY, JSON.stringify(obj)); }
  function loadMeta(){ try{ return JSON.parse(localStorage.getItem(META_KEY) || '{}'); }catch(e){return{}} }
  function saveMeta(obj){ localStorage.setItem(META_KEY, JSON.stringify(obj)); }

  // date helpers
  function formatISO(y,m,d){
    const mm = String(m+1).padStart(2,'0');
    const dd = String(d).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  function formatReadable(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {day:'2-digit', month:'long', year:'numeric'});
  }

  // init month to today
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();

  // DOM refs
  const calBody = document.getElementById('calBody');
  const monthLabel = document.getElementById('monthLabel');
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  const todayBtn = document.getElementById('todayBtn');
  const menu = document.getElementById('menu');
  const menuDateTitle = document.getElementById('menuDateTitle');
  const closeMenu = document.getElementById('closeMenu');
  const pageTema = document.getElementById('page-tema');
  const pageEditor = document.getElementById('page-editor');
  const pages = document.getElementById('pages');

  // editor elements
  const temaDateTitle = document.getElementById('temaDateTitle');
  const tema_tema = document.getElementById('tema_tema');
  const tema_goal = document.getElementById('tema_goal');
  const tema_activity = document.getElementById('tema_activity');
  const temaColorInputs = document.querySelectorAll('input[name="temaColor"]');

  const editorDateTitle = document.getElementById('editorDateTitle');
  const editorTypeLabel = document.getElementById('editorTypeLabel');
  const editorText = document.getElementById('editorText');

  const menuOptions = document.querySelectorAll('.menu .opt[data-type]');

  const backFromTema = document.getElementById('backFromTema');
  const backFromEditor = document.getElementById('backFromEditor');
  const copyTema = document.getElementById('copyTema');
  const copyEditor = document.getElementById('copyEditor');

  // render calendar for state.year/state.month
  function renderCalendar(){
    calBody.innerHTML = '';
    const y = state.year, m = state.month;
    const first = new Date(y,m,1);
    const last = new Date(y,m+1,0);
    const daysInMonth = last.getDate();
    // in JS Sunday=0 — we want week starting Monday. compute index Monday=0...Sunday=6
    const firstWeekday = (first.getDay() + 6) % 7;
    monthLabel.textContent = first.toLocaleString('ru-RU', {month:'long', year:'numeric'});

    // Build cells: start with empty cells until firstWeekday
    const rows = [];
    let cells = [];
    for(let i=0;i<firstWeekday;i++){
      cells.push(null);
    }
    for(let d=1; d<=daysInMonth; d++){
      cells.push(d);
      if(cells.length === 7){
        rows.push(cells);
        cells = [];
      }
    }
    if(cells.length>0){
      while(cells.length<7) cells.push(null);
      rows.push(cells);
    }

    const meta = loadMeta();

    // create rows
    rows.forEach(week=>{
      const tr = document.createElement('tr');
      week.forEach(day=>{
        const td = document.createElement('td');
        if(day===null){
          td.innerHTML = '';
        } else {
          const iso = formatISO(y,m,day);
          const btn = document.createElement('button');
          btn.className = 'date-btn';
          btn.setAttribute('data-iso', iso);
          btn.setAttribute('aria-label', 'Открыть ' + iso);
          const num = document.createElement('div');
          num.className = 'date-num';
          num.textContent = day;
          btn.appendChild(num);

          // small indicator if entries exist
          const entries = loadEntries();
          const hasAny = ['tema','stories','post','reel'].some(t=> entries[iso] && entries[iso][t] && entries[iso][t].trim().length>0);
          if(hasAny){
            const dot = document.createElement('div');
            dot.style.position='absolute';
            dot.style.right='6px';
            dot.style.bottom='6px';
            dot.style.width='8px';
            dot.style.height='8px';
            dot.style.borderRadius='50%';
            dot.style.background = 'rgba(74,144,226,0.9)';
            btn.appendChild(dot);
          }

          // apply saved tema color if any
          if(meta[iso] && meta[iso].temaColor){
            td.style.background = colorMap[meta[iso].temaColor];
            td.classList.add('filled');
          }

          btn.addEventListener('click', (e)=>{
            e.stopPropagation();
            openMenuForDate(iso, td);
          });

          td.appendChild(btn);
        }
        tr.appendChild(td);
      });
      calBody.appendChild(tr);
    });
  }

  function openMenuForDate(iso, tdCell){
    state.selectedDateISO = iso;
    // show menu
    menuDateTitle.textContent = formatReadable(iso);
    menu.classList.add('active');
    // keep reference to the cell to set color later
    menu._targetCell = tdCell;
  }

  function closeMenuFunc(){
    menu.classList.remove('active');
    menu._targetCell = null;
  }

  // handle option selection open respective page
  menuOptions.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const type = btn.getAttribute('data-type');
      state.selectedType = type;
      closeMenuFunc();
      if(type === 'tema'){
        openTemaPage(state.selectedDateISO);
      } else {
        openEditorPage(state.selectedDateISO, type);
      }
    });
  });

  closeMenu.addEventListener('click', closeMenuFunc);

  // open tema
  function openTemaPage(iso){
    showPage('tema');
    temaDateTitle.textContent = formatReadable(iso);
    // load existing values
    const entries = loadEntries();
    const meta = loadMeta();
    const e = (entries[iso] && entries[iso].tema) ? entries[iso].tema : {tema: '', goal:'', activity:''};
    // In storage we'll keep tema as object; but older values might be string so handle gracefully
    if(typeof e === 'string'){ // fallback
      tema_tema.value = e;
      tema_goal.value = '';
      tema_activity.value = '';
    } else {
      tema_tema.value = e.tema || '';
      tema_goal.value = e.goal || '';
      tema_activity.value = e.activity || '';
    }
    // set color radios
    const currentMeta = meta[iso] || {};
    temaColorInputs.forEach(inp=>{
      inp.checked = (inp.value === currentMeta.temaColor);
    });
    // bind autosave
    debouncedAutoSave_tema();
  }

  // open generic editor
  function openEditorPage(iso, type){
    showPage('editor');
    editorDateTitle.textContent = formatReadable(iso);
    const typeLabel = {
      stories: 'Сторис',
      post: 'Пост',
      reel: 'Рилс'
    }[type] || type;
    editorTypeLabel.textContent = typeLabel;
    // load existing
    const entries = loadEntries();
    editorText.value = (entries[iso] && entries[iso][type]) ? entries[iso][type] : '';
    // bind autosave
    debouncedAutoSave_editor();
  }

  function showPage(name){
    // hide calendar/menu
    menu.classList.remove('active');
    document.getElementById('calendarCard').style.display = (name === 'calendar') ? 'block' : 'none';
    // pages
    pageTema.classList.remove('active');
    pageEditor.classList.remove('active');
    if(name === 'tema'){ pageTema.classList.add('active'); state.view='tema'; pageTema.setAttribute('aria-hidden','false'); pageEditor.setAttribute('aria-hidden','true'); } 
    else if(name === 'editor'){ pageEditor.classList.add('active'); state.view='editor'; pageEditor.setAttribute('aria-hidden','false'); pageTema.setAttribute('aria-hidden','true'); }
    else { state.view='calendar'; }
    // ensure calendar visible if name calendar
    if(name === 'calendar') document.getElementById('calendarCard').style.display = 'block';
    else document.getElementById('calendarCard').style.display = 'none';
  }

  // navigation buttons
  backFromTema.addEventListener('click', ()=>{
    showPage('calendar');
    renderCalendar();
  });
  backFromEditor.addEventListener('click', ()=>{
    showPage('calendar');
    renderCalendar();
  });

  // copy buttons
  copyTema.addEventListener('click', ()=>{
    const text = [
      'Тема: ' + (tema_tema.value||''),
      'Цель: ' + (tema_goal.value||''),
      'Активность: ' + (tema_activity.value||'')
    ].join('\n');
    navigator.clipboard?.writeText(text).then(()=> {
      alert('Текст скопирован');
    }).catch(()=> {
      // fallback
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      alert('Текст скопирован');
    });
  });

  copyEditor.addEventListener('click', ()=>{
    const text = editorText.value || '';
    navigator.clipboard?.writeText(text).then(()=> {
      alert('Текст скопирован');
    }).catch(()=> {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      alert('Текст скопирован');
    });
  });

  // autosave logic
  function saveTemaImmediate(){
    const iso = state.selectedDateISO;
    if(!iso) return;
    const entries = loadEntries();
    const obj = entries[iso] || {};
    obj.tema = {
      tema: tema_tema.value,
      goal: tema_goal.value,
      activity: tema_activity.value
    };
    entries[iso] = obj;
    saveEntries(entries);
    // also save meta color
    const meta = loadMeta();
    const checked = document.querySelector('input[name="temaColor"]:checked');
    if(checked){
      meta[iso] = meta[iso] || {};
      meta[iso].temaColor = checked.value;
      saveMeta(meta);
      // apply color to calendar cell if present
      applyColorToCalendarCell(iso, checked.value);
    }
  }
  function saveEditorImmediate(){
    const iso = state.selectedDateISO;
    if(!iso) return;
    const entries = loadEntries();
    entries[iso] = entries[iso] || {};
    entries[iso][state.selectedType] = editorText.value;
    saveEntries(entries);
  }

  // debounce helper
  function debounce(fn, wait){
    let t;
    return function(...a){
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(this,a), wait);
    };
  }
  const debouncedAutoSave_tema = debounce(saveTemaImmediate, 500);
  const debouncedAutoSave_editor = debounce(saveEditorImmediate, 500);

  // bind input events
  tema_tema.addEventListener('input', debouncedAutoSave_tema);
  tema_goal.addEventListener('input', debouncedAutoSave_tema);
  tema_activity.addEventListener('input', debouncedAutoSave_tema);
  temaColorInputs.forEach(inp=>{
    inp.addEventListener('change', ()=>{
      // save immediately when color changed
      saveTemaImmediate();
    });
  });

  editorText.addEventListener('input', debouncedAutoSave_editor);

  // apply color to calendar cell by ISO
  function applyColorToCalendarCell(iso, temaColor){
    // find button with data-iso
    const btn = document.querySelector('.date-btn[data-iso="'+iso+'"]');
    if(btn){
      const td = btn.closest('td');
      td.style.background = colorMap[temaColor] || '';
      if(temaColor) td.classList.add('filled'); else td.classList.remove('filled');
    }
  }

  // previous / next / today controls
  prevMonth.addEventListener('click', ()=>{
    state.month--;
    if(state.month < 0){ state.month = 11; state.year--; }
    renderCalendar();
  });
  nextMonth.addEventListener('click', ()=>{
    state.month++;
    if(state.month > 11){ state.month = 0; state.year++; }
    renderCalendar();
  });
  todayBtn.addEventListener('click', ()=>{
    const t = new Date();
    state.year = t.getFullYear();
    state.month = t.getMonth();
    renderCalendar();
  });

  // open editor choices mapped to menu indexes handled above

  // when menu closes, ensure focus back etc.
  document.addEventListener('click', function(e){
    // close menu if click outside and active
    if(menu.classList.contains('active')){
      const within = menu.contains(e.target) || (e.target.closest && e.target.closest('.date-btn'));
      if(!within) closeMenuFunc();
    }
  });

  // on load, render calendar and apply saved colors
  function init(){
    renderCalendar();
    // apply any saved colors
    const meta = loadMeta();
    Object.keys(meta).forEach(iso=>{
      if(meta[iso] && meta[iso].temaColor){
        applyColorToCalendarCell(iso, meta[iso].temaColor);
      }
    });
  }

  // before unload save current editor if open
  window.addEventListener('beforeunload', ()=>{
    if(state.view === 'tema') saveTemaImmediate();
    if(state.view === 'editor') saveEditorImmediate();
  });

  // expose programmatic open when clicking outside cells with keyboard navigation
  init();

  // small accessibility: allow pressing Escape to go back to calendar
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      if(menu.classList.contains('active')) closeMenuFunc();
      else showPage('calendar');
      renderCalendar();
    }
  });

})();
</script>
</body>
</html>
