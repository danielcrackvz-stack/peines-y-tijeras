// ==========================================================================
// Conexión con Firebase — Peines y Tijeras
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk3zlKHsX3TVHwP1VShKC19zDIyx67Qvg",
  authDomain: "peines-y-tijeras.firebaseapp.com",
  projectId: "peines-y-tijeras",
  storageBucket: "peines-y-tijeras.firebasestorage.app",
  messagingSenderId: "183519014306",
  appId: "1:183519014306:web:7da94d82f96a101f3016fb"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, serverTimestamp };