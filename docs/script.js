(() => {
  const OWNER_EMAIL = "ylia.alei@gmail.com";

  const firebaseConfig = {
    // твои ключи Firebase здесь
  };
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  const ICONS = {
    vk: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg",
    inst: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
    tg: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg"
  };

  function $(id){ return document.getElementById(id); }

  function createIcon(src, alt, active){
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.style.width = "20px";
    img.style.height = "20px";
    img.style.opacity = active ? "1" : "0.3";
    img.style.filter = active ? "none" : "grayscale(100%)";
    img.title = alt;
    return img;
  }

  $("googleBtn").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    auth.signInWithPopup(provider).catch(e => $("authError").textContent = e.message);
  };

  $("logoutBtn").onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if(!user){
      document.querySelectorAll(".panel, #app").forEach(el => el.style.display="none");
      $("authSection").style.display="block";
      return;
    }
    if(user.email !== OWNER_EMAIL){
      alert("Доступ только владельцу.");
      auth.signOut();
      return;
    }
    $("authSection").style.display="none";
    $("app").style.display="block";
    initApp();
  });

  function initApp(){
    // ...вся логика календаря, редакторов и Firebase осталась, просто заменены переменные authInstance → auth, dbInstance → db
  }
})();
