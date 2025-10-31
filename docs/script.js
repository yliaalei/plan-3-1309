/* script.js for "Мой контент-план" (updated) */
const OWNER_EMAIL = "ylia.alei@gmail.com";

function $(id){ return document.getElementById(id); }
function safeAssign(id, prop, handler){ const el=$(id); if(el) el[prop]=handler; }

if(typeof firebase==="undefined"||typeof db==="undefined"||typeof auth==="undefined"){
  console.error("Firebase не инициализирован. Проверьте firebase-config.js");
}

const ICONS = {
  vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
  inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
};

// 🔹 Фоны месяцев
const monthBackgrounds = [
  "https://i.pinimg.com/736x/ac/0f/a9/ac0fa9912b3c74e34d99c9c0e0b57323.jpg", // Янв
  "https://i.pinimg.com/736x/ac/5e/74/ac5e740afe0ad061777b979f5e4a0808.jpg",
  "https://i.pinimg.com/736x/d4/c4/b4/d4c4b455ebe734b9d69dfd16635de086.jpg",
  "https://i.pinimg.com/736x/a5/33/db/a533db51f86acc360d2f34b9ab2de7b3.jpg",
  "https://i.pinimg.com/736x/fa/1f/2e/fa1f2ebc900dd29049e1cf26098a6039.jpg",
  "https://i.pinimg.com/736x/d8/a5/20/d8a520e299b09faf6b0805f0eebe4e74.jpg",
  "https://i.pinimg.com/1200x/40/c4/31/40c43185d7067a13c9cc999f596c377e.jpg",
  "https://i.pinimg.com/736x/fb/f7/ee/fbf7ee009c3cd6189d7ce6044f408c0f.jpg",
  "https://i.pinimg.com/736x/4c/42/43/4c4243788c34ad2c357e6895b66c12eb.jpg",
  "https://i.pinimg.com/736x/01/18/c2/0118c2cc54622adb4edb500703a063eb.jpg",
  "https://i.pinimg.com/736x/94/78/0d/94780d2437de26d5fbd37c702467a4a5.jpg",
  "https://i.pinimg.com/736x/95/bb/85/95bb85acb69721441b666577aefd7ad7.jpg"
];

window.addEventListener("load", () => {
  // auth UI buttons
  safeAssign("googleBtn","onclick", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch(e){ $("authHint").textContent = e.message; }
  });

  safeAssign("registerBtn","onclick", async () => {
    const email = $("regEmail").value.trim();
    const pass = $("regPass").value;
    if(!email || !pass){ $("authHint").textContent="Введите email и пароль"; return; }
    try {
      await auth.createUserWithEmailAndPassword(email, pass);
    } catch(e){ $("authHint").textContent = e.message; }
  });

  safeAssign("loginBtn","onclick", async () => {
    const email = $("loginEmail").value.trim();
    const pass = $("loginPass").value;
    if(!email || !pass){ $("authHint").textContent="Введите email и пароль"; return; }
    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch(e){ $("authHint").textContent = e.message; }
  });

  safeAssign("logoutBtn","onclick", ()=> auth.signOut());

  safeAssign("payBtn","onclick", createPaymentForCurrentUser);
  safeAssign("restoreTrialBtn","onclick", ()=> alert("Напишите владельцу: "+OWNER_EMAIL));

  auth.onAuthStateChanged(user => {
    if(!user){
      // show auth
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
      $("authSection").style.display = "block";
      return;
    }

    // if not owner and email not verified? we still allow
    if(user.email === OWNER_EMAIL){
      // owner always gets full app
      $("authSection").style.display = "none";
      $("paymentPage").style.display = "none";
      $("app").style.display = "block";
      initApp(user);
      return;
    }

    // check users/{uid} doc for trial/payment
    const userDocRef = db.collection("users").doc(user.uid);
    userDocRef.get().then(docSnap => {
      const now = Date.now();
      if(!docSnap.exists){
        // new user: create with trial
        const trialEnds = now + 7*24*60*60*1000;
        userDocRef.set({ createdAt: now, trialEnds, paid: false }).then(()=>{
          $("authSection").style.display = "none";
          $("paymentPage").style.display = "none";
          $("app").style.display = "block";
          initApp(user);
        });
      } else {
        const data = docSnap.data();
        if(data.paid){
          $("authSection").style.display = "none";
          $("paymentPage").style.display = "none";
          $("app").style.display = "block";
          initApp(user);
        } else if(now < data.trialEnds){
          $("authSection").style.display = "none";
          $("paymentPage").style.display = "none";
          $("app").style.display = "block";
          initApp(user);
        } else {
          // trial over -> require payment
          document.querySelectorAll(".panel, #app").forEach(el => el.style.display = "none");
          $("paymentPage").style.display = "block";
        }
      }
    }).catch(err=>{
      console.error(err);
      $("authHint").textContent = "Ошибка доступа к БД";
    });
  });
});

// ---------------- utilities ----------------

function getUserId(){
  const u = auth.currentUser;
  return u ? u.uid : null;
}

function usersCollectionRef(){
  return db.collection("users");
}

function userContentCollectionRef(){
  const uid = getUserId();
  if(!uid) throw new Error("User not signed in");
  return db.collection("users").doc(uid).collection("contentPlanner");
}

// ---------------- APP logic (calendar etc) ----------------

function initApp(user){
  // existing logic mostly preserved — but data reads/writes go to per-user collection
  const colorMap = { burgundy:"#800020", orange:"#FFA500", green:"#006400", brown:"#8B4513", beige:"#F5F5DC" };

  let selectedDateKey = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let quill = null;
  let currentEditorType = null;

  const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  safeAssign("prevBtn","onclick",()=>{currentMonth--;if(currentMonth<0){currentMonth=11;currentYear--;}renderCalendar();});
  safeAssign("nextBtn","onclick",()=>{currentMonth++;if(currentMonth>11){currentMonth=0;currentYear++;}renderCalendar();});

  safeAssign("menuClose","onclick",()=>closeMenu());
  safeAssign("temaBack","onclick",()=>closeEditor("temaPage"));
  safeAssign("editorBack","onclick",()=>closeEditor("editorPage"));
  safeAssign("copyBtn","onclick",copyEditorText);

  safeAssign("menuBtnTema","onclick",()=>openEditor("tema"));
  safeAssign("menuBtnPost","onclick",()=>openEditor("post"));
  safeAssign("menuBtnReel","onclick",()=>openEditor("reel"));
  safeAssign("menuBtnStories","onclick",()=>openEditor("stories"));

  renderWeekdays(); renderCalendar();

  function renderWeekdays(){
    const wd=$("weekdays"); wd.innerHTML="";
    weekdays.forEach(d=>{const div=document.createElement("div");div.textContent=d;wd.appendChild(div);});
  }

  async function renderCalendar(){
    const cal=$("calendar"); cal.innerHTML="";
    $("monthYear").textContent=`${monthNames[currentMonth]} ${currentYear}`;

    // Установка фона по месяцу
    document.body.style.backgroundImage = `url('${monthBackgrounds[currentMonth]}')`;

    const firstDay=new Date(currentYear,currentMonth,1).getDay();
    const leading=(firstDay===0?6:firstDay-1);
    for(let i=0;i<leading;i++){
      const e=document.createElement("div"); e.className="day-cell empty"; cal.appendChild(e);
    }

    const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const key=`${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const cell=document.createElement("div");
      cell.className="day-cell";
      const num=document.createElement("div");
      num.className="day-number";
      num.textContent=d;
      cell.appendChild(num);

      cell.addEventListener("click",()=>openMenuForDate(key));
      // fetch per-user doc
      try{
        const docSnap = await userContentCollectionRef().doc(key).get();
        const data = docSnap.exists ? docSnap.data() : {};
        const c = data.temaColor || null;
        if(c && colorMap[c]) cell.style.backgroundColor = colorMap[c] + "33";
      }catch(e){
        console.error("Ошибка чтения doc", key, e);
      }
      cal.appendChild(cell);
    }
  }

  function openMenuForDate(key){
    selectedDateKey = key;
    $("menuDateTitle").textContent = key;
    $("menu").classList.add("active");
    $("menu").style.display = "block";
  }
  function closeMenu(){
    $("menu").classList.remove("active");
    $("menu").style.display="none";
  }

  function openEditor(type){
    closeMenu();
    currentEditorType = type;
    selectedDateKey && (type==="tema" ? openTema() : openTextEditor(type));
  }

  // === ТЕМА ===
  function openTema(){
    $("temaPage").style.display="block";
    $("temaDateTitle").textContent = selectedDateKey;

    userContentCollectionRef().doc(selectedDateKey).get().then(docSnap=>{
      const data = docSnap.exists?docSnap.data():{};
      $("tema_tema").value = data.temaText || "";
      $("tema_goal").value = data.temaGoal || "";
      $("tema_type").value = data.temaColor || "";
    });

    ["tema_tema","tema_goal","tema_type"].forEach(id=>{
      $(id).oninput = saveTemaDebounced;
      $(id).onchange = saveTemaDebounced;
    });
  }

  let temaTimer;
  function saveTemaDebounced(){
    clearTimeout(temaTimer);
    temaTimer = setTimeout(saveTema, 600);
  }
  function saveTema(){
    if(!selectedDateKey) return;
    const payload = {
      temaText: $("tema_tema").value.trim(),
      temaGoal: $("tema_goal").value,
      temaColor: $("tema_type").value
    };
    userContentCollectionRef().doc(selectedDateKey).set(payload,{merge:true}).then(()=>renderCalendar());
  }

  // === POST / REEL / STORIES ===
  function openTextEditor(type){
    $("editorPage").style.display="block";
    $("editorTypeLabel").textContent = type.toUpperCase();
    $("editorDateTitle").textContent = selectedDateKey;

    if(!quill){
      quill = new Quill("#editorText", { theme:"snow", modules:{ toolbar:[["bold","italic"],["link","image"]] } });
      quill.on("text-change", saveEditorDebounced);
    }

    userContentCollectionRef().doc(selectedDateKey).get().then(docSnap=>{
      const data = docSnap.exists?docSnap.data():{};
      quill.root.innerHTML = data[type] || "";
      renderPublishChecks(data[`${type}Platforms`] || {});
    });
  }

  let saveTimer;
  function saveEditorDebounced(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveEditor,600);
  }
  function saveEditor(){
    if(!selectedDateKey || !currentEditorType || !quill) return;
    const html = quill.root.innerHTML;
    const flags = {
      vk: $("chk_vk") ? $("chk_vk").checked : false,
      inst: $("chk_inst") ? $("chk_inst").checked : false,
      tg: $("chk_tg") ? $("chk_tg").checked : false
    };
    const payload = {};
    payload[currentEditorType] = html;
    payload[`${currentEditorType}Platforms`] = flags;
    userContentCollectionRef().doc(selectedDateKey).set(payload,{merge:true}).then(()=>renderCalendar());
  }

  function renderPublishChecks(flags){
    const div = $("publishChecks");
    div.innerHTML = `
      <label><input type="checkbox" id="chk_vk"> ВК</label>
      <label><input type="checkbox" id="chk_inst"> Инст</label>
      <label><input type="checkbox" id="chk_tg"> ТГ</label>
    `;
    $("chk_vk").checked = !!flags.vk;
    $("chk_inst").checked = !!flags.inst;
    $("chk_tg").checked = !!flags.tg;
    ["chk_vk","chk_inst","chk_tg"].forEach(id=>{
      $(id).onchange = saveEditorDebounced;
    });
  }

  function closeEditor(panelId){
    $(panelId).style.display="none";
    renderCalendar();
  }

  function copyEditorText(){
    if(!quill) return;
    navigator.clipboard.writeText(quill.root.innerText||"");
    const btn=$("copyBtn");
    btn.textContent="Скопировано!";
    setTimeout(()=>btn.textContent="Копировать",900);
  }
}

// ---------------- PAYMENT flow ----------------

async function createPaymentForCurrentUser(){
  const user = auth.currentUser;
  if(!user) return alert("Пожалуйста, войдите");

  // Ваш бекенд (разверните / укажите URL)
  const API_URL = "https://ВАШ_БЕКЕНД_URL/createPayment"; // <-- замените

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid })
    });
    const data = await res.json();
    if(data && data.confirmation && data.confirmation.confirmation_url){
      // перенаправляем пользователя
      window.location.href = data.confirmation.confirmation_url;
    } else {
      console.error("Ошибка создания платежа", data);
      alert("Не удалось создать платёж. Проверьте бэкенд.");
    }
  } catch(e){
    console.error(e);
    alert("Ошибка связи с сервером.");
  }
}

