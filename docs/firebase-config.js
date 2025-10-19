// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqUEri9DzMftxtS7ker4tfC-EnZNK6nMA",
  authDomain: "content-planner-ffb8e.firebaseapp.com",
  projectId: "content-planner-ffb8e",
  storageBucket: "content-planner-ffb8e.appspot.com",
  messagingSenderId: "615520592527",
  appId: "1:615520592527:web:7478b8c3de904c924086fa"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Function to get a user's calendar collection
function getUserCalendar(uid) {
  return db.collection('users').doc(uid).collection('calendar');
}

// Optional: set Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    console.warn("Persistence could not be enabled:", err.code);
  });
