// ==========================================================================
// Obtiene el catálogo de servicios desde Firestore (colección "servicios").
// Si Firestore aún no tiene datos, o falla la conexión, usa el catálogo
// de respaldo definido en config.js para que el sitio nunca se vea vacío.
// ==========================================================================

import { db } from "./firebase-config.js";
import { DEFAULT_SERVICIOS } from "./config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

export async function fetchServicios() {
  try {
    const snapshot = await getDocs(collection(db, "servicios"));
    if (snapshot.empty) return DEFAULT_SERVICIOS;

    const servicios = [];
    snapshot.forEach((doc) => servicios.push({ id: doc.id, ...doc.data() }));
    return servicios;
  } catch (error) {
    console.warn("No se pudo leer Firestore, usando catálogo de respaldo:", error);
    return DEFAULT_SERVICIOS;
  }
}