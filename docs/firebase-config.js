// firebase-config.js — оставляем как у тебя, но аккуратно единожды инициализируем Firebase

const firebaseConfig = {
  apiKey: "AIzaSyAqUEri9DzMftxtS7ker4tfC-EnZNK6nMA",
  authDomain: "content-planner-ffb8e.firebaseapp.com",
  projectId: "content-planner-ffb8e",
  storageBucket: "content-planner-ffb8e.appspot.com",
  messagingSenderId: "615520592527",
  appId: "1:615520592527:web:7478b8c3de904c924086fa"
};

if(!firebase.apps || !firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
