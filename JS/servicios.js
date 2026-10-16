import { db, collection, getDocs } from "./firebase-config.js";
import { DEFAULT_SERVICIOS } from "./config.js";

export async function fetchServicios() {
  try {
    const snapshot = await getDocs(collection(db, "servicios"));
    if (snapshot.empty) {
      return DEFAULT_SERVICIOS;
    }
    const servicios = [];
    snapshot.forEach((doc) => servicios.push({ id: doc.id, ...doc.data() }));
    return servicios;
  } catch (error) {
    console.warn("Usando catálogo por defecto:", error);
    return DEFAULT_SERVICIOS;
  }
}