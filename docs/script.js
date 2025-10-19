// --- Авторизация ---
auth.onAuthStateChanged(user => {
  const loginSection = document.getElementById('loginSection');
  const app = document.getElementById('app');

  if (user) {
    loginSection.style.display = 'none';
    app.style.display = 'block';
  } else {
    loginSection.style.display = 'block';
    app.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const googleBtn = document.getElementById('googleBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  // --- Вход через email/password ---
  loginBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
      loginError.textContent = "Введите email и пароль";
      loginError.style.color = 'red';
      return;
    }

    auth.signInWithEmailAndPassword(email, pass)
      .then(userCredential => {
        loginError.textContent = "";
      })
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
      });
  };

  // --- Регистрация через email/password ---
  registerBtn.onclick = () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
      loginError.textContent = "Введите email и пароль";
      loginError.style.color = 'red';
      return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
      .then(userCredential => {
        const user = userCredential.user;
        loginError.textContent = "Регистрация успешна! Вы вошли как: " + user.email;
        loginError.style.color = 'green';
      })
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
        console.error("Ошибка регистрации:", err);
      });
  };

  // --- Вход через Google ---
  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider)
      .catch(err => {
        loginError.textContent = err.message;
        loginError.style.color = 'red';
        console.error("Ошибка Google-входа:", err);
      });
  };

  // --- Выход ---
  logoutBtn.onclick = () => auth.signOut();

  // --- Инициализация приложения ---
  initApp();
});

// --- Приложение: календарь, темы, редактор ---
function initApp() {
  const colorMap = { free:'#fff', family:'#c8f7e8', health:'#fff7c2', work:'#ffd7ea', hobby:'#e8e1ff' };
  let selectedDateKey = null, selectedType = null;
  let currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear();
  let quill = null;

  const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  function pad(n){return String(n).padStart(2,'0');}
  function makeDateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
  function formatReadable(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});}

  // --- Навигация календаря ---
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

  // --- Рендер дней недели ---
  function renderWeekdays(){const wd=document.getElementById('weekdays'); wd.innerHTML=''; weekdays.forEach(d=>{const div=document.createElement('div'); div.textContent=d; wd.appendChild(div);});}

  // --- Рендер календаря ---
  function renderCalendar(){
    const cal=document.getElementById('calendar'); cal.innerHTML='';
    document.getElementById('monthYear').textContent=`${monthNames[currentMonth]} ${currentYear}`;
    const firstDay=new Date(currentYear,currentMonth,1).getDay(); const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){const e=document.createElement('div'); e.className='day-cell empty'; cal.appendChild(e);}
    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key=makeDateKey(currentYear,currentMonth,d);
      const cell=document.createElement('div');
      cell.className='day-cell';
      cell.dataset.date=key;
      const num=document.createElement('div'); num.className='day-number';
      num.textContent=d;
      cell.appendChild(num);
      cell.style.backgroundColor=colorMap.free;
      cell.onclick=()=>openMenuForDate(key);
      loadDataForCell(key,cell);
      cal.appendChild(cell);
    }
  }

  // --- Работа с меню и панелями ---
  function openMenuForDate(key){selectedDateKey=key; document.getElementById('menuDateTitle').textContent=formatReadable(key); showMenu();}
  function showMenu(){document.getElementById('menu').classList.add('active');}
  function closeMenu(){document.getElementById('menu').classList.remove('active');}
  function showPanel(id){document.getElementById(id).classList.add('active');}
  function hidePanel(id){document.getElementById(id).classList.remove('active');}
  function showTema(){closeMenu(); selectedType='tema'; document.getElementById('temaDateTitle').textContent=formatReadable(selectedDateKey); showPanel('temaPage'); loadTemaData(selectedDateKey);}
  function showEditor(type){
    closeMenu(); selectedType=type;
    document.getElementById('editorDateTitle').textContent=formatReadable(selectedDateKey);
    document.getElementById('editorTypeLabel').textContent=type.charAt(0).toUpperCase()+type.slice(1);
    showPanel('editorPage');
    if(!quill){
      quill=new Quill('#editorText',{theme:'snow',modules:{toolbar:'#editorToolbar'}});
      quill.root.addEventListener('click',e=>{
        if(e.target.tagName==='A'){e.preventDefault(); window.open(e.target.href,'_blank');} 
        if(e.target.tagName==='IMG'){showImageTooltip(e.target);}
      });
      quill.on('text-change',saveEditorDebounced);
    }
    loadEditorData(selectedDateKey,type);
  }

  // --- Данные тем ---
  function loadDataForCell(key,cell){db.collection('contentPlanner').doc(key).get().then(doc=>{if(doc.exists){const d=doc.data(); const c=d.temaColor||'free'; cell.style.backgroundColor=colorMap[c]||colorMap.free;}});}
  function loadTemaData(key){['tema_tema','tema_goal','tema_activity'].forEach(id=>document.getElementById(id).value=''); db.collection('contentPlanner').doc(key).get().then(doc=>{if(doc.exists){const d=doc.data(); if(d.tema)document.getElementById('tema_tema').value=d.tema; if(d.goal)document.getElementById('tema_goal').value=d.goal; if(d.activity)document.getElementById('tema_activity').value=d.activity; const c=d.temaColor||'free'; const r=document.querySelector(`input[name="temaColor"][value="${c}"]`); if(r)r.checked=true;}});}
  function saveTema(){const user=auth.currentUser;if(!selectedDateKey||!user)return; const tema=document.getElementById('tema_tema').value; const goal=document.getElementById('tema_goal').value; const activity=document.getElementById('tema_activity').value; const temaColor=(document.querySelector('input[name="temaColor"]:checked')||{}).value||'free'; db.collection('contentPlanner').doc(selectedDateKey).set({tema,goal,activity,temaColor},{merge:true}); updateCellColor(selectedDateKey,temaColor);}
  let temaTimer; function saveTemaDebounced(){clearTimeout(temaTimer); temaTimer=setTimeout(saveTema,500);}
  function updateCellColor(key,color){const el=document.querySelector(`.day-cell[data-date="${key}"]`); if(el)el.style.backgroundColor=colorMap[color]||colorMap.free;}
  function loadEditorData(key,type){if(!quill)return; quill.setContents([]); db.collection('contentPlanner').doc(key).get().then(doc=>{if(doc.exists){const d=doc.data(); if(d[type])quill.root.innerHTML=d[type];}});}
  function saveEditor(){const user=auth.currentUser;if(!selectedDateKey||!selectedType||!quill||!user)return; const val=quill.root.innerHTML; db.collection('contentPlanner').doc(selectedDateKey).set({[selectedType]:val},{merge:true});}
  let editorTimer; function saveEditorDebounced(){clearTimeout(editorTimer); editorTimer=setTimeout(saveEditor,700);}
  function copyEditorText(){if(!quill)return; navigator.clipboard.writeText(quill.root.innerHTML).then(()=>{const b=document.getElementById('copyBtn'); const old=b.textContent; b.textContent='Скопировано'; setTimeout(()=>b.textContent=old,1000);});}
  const tooltip=document.getElementById('imageTooltip'); function showImageTooltip(img){const rect=img.getBoundingClientRect(); tooltip.style.left=rect.left+window.scrollX+'px'; tooltip.style.top=rect.top+window.scrollY-30+'px'; tooltip.style.display='block'; tooltip.onclick=()=>{const link=document.createElement('a'); link.href=img.src; link.download='image'; document.body.appendChild(link); link.click(); link.remove(); tooltip.style.display='none';};} document.addEventListener('click',e=>{if(!e.target.closest('img')) tooltip.style.display='none';});
}
