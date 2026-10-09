// ==========================================================================
// Conexión con Firebase — Peines y Tijeras
// ==========================================================================
// 1. Ve a la Consola de Firebase -> tu proyecto -> ícono de engranaje ->
//    "Configuración del proyecto" -> pestaña "General".
// 2. En "Tus apps", registra una app web (ícono </>) si todavía no lo hiciste.
// 3. Copia el objeto "firebaseConfig" que te muestra Firebase y pégalo
//    reemplazando los valores de ejemplo de abajo.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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