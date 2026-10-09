// ==========================================================================
// Configuración general del sitio — Peines y Tijeras
// ==========================================================================

// TODO: reemplaza con el número real de WhatsApp de la encargada de
// recepción, en formato internacional sin "+" ni espacios.
// Ejemplo Bolivia: 591 + número de celular -> "59170000000"
export const WHATSAPP_NUMBER = "59162016968";

// Catálogo de respaldo: se muestra si todavía no cargaste servicios en
// Firestore, o si la conexión falla. Una vez que crees la colección
// "servicios" en Firebase, el sitio usará esos datos en su lugar.
export const DEFAULT_SERVICIOS = [
  {
    nombre: "Corte clásico",
    categoria: "Corte",
    descripcion: "Corte a medida según la forma de tu rostro, incluye lavado y peinado final.",
    precio: "Desde Bs. 60"
  },
  {
    nombre: "Corte + diseño",
    categoria: "Corte",
    descripcion: "Corte con líneas y diseño personalizado, ideal para looks más definidos.",
    precio: "Desde Bs. 80"
  },
  {
    nombre: "Alizado permanente",
    categoria: "Alizado",
    descripcion: "Tratamiento de alizado de larga duración para un cabello liso y manejable.",
    precio: "Desde Bs. 250"
  },
  {
    nombre: "Alizado japonés",
    categoria: "Alizado",
    descripcion: "Alisado profundo hebra por hebra, resultado liso natural de larga duración.",
    precio: "Desde Bs. 350"
  },
  {
    nombre: "Color completo",
    categoria: "Color",
    descripcion: "Cambio de color de raíz a puntas, en el tono que elijas junto a tu estilista.",
    precio: "Desde Bs. 180"
  },
  {
    nombre: "Mechas / Balayage",
    categoria: "Color",
    descripcion: "Técnica de mechas con efecto degradado natural, sin marcar raíz.",
    precio: "Desde Bs. 220"
  },
  {
    nombre: "Cambio de look completo",
    categoria: "Cambio de look",
    descripcion: "Asesoramiento integral: corte, color y peinado en una sola sesión.",
    precio: "Desde Bs. 300"
  }
];

export function buildWhatsappUrl(mensaje) {
  const texto = encodeURIComponent(mensaje);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${texto}`;
}
// ==========================================================================
// Gemini (Google AI Studio) — asistente de IA
// Pega aquí tu clave de https://aistudio.google.com/apikey
// IMPORTANTE: en Google Cloud Console > Credenciales, restringe esta clave
// por "Referentes HTTP" a tu sitio (tu URL de GitHub Pages/Firebase y localhost)
// ==========================================================================
export const GEMINI_API_KEY = "PEGA_AQUI_TU_CLAVE";