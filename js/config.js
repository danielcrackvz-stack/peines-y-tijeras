// ==========================================================================
// Configuración general del sitio — Peines y Tijeras
// ==========================================================================

export const WHATSAPP_NUMBER = "59162016968";

// Tu clave oficial de Google AI Studio
export const GEMINI_API_KEY = "AQ.Ab8RN6Lcg0Lgid4nHAT5DKuX4QsnMQifCcvtHAvRAtzbLhypOg";

export const DEFAULT_SERVICIOS = [
  {
    nombre: "Corte clásico dama",
    categoria: "Corte",
    descripcion: "Corte a medida según la forma de tu rostro, incluye lavado y peinado final.",
    precio: "Bs. 35",
    imagen: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80"
  },
  {
    nombre: "Corte de varón / degradado",
    categoria: "Corte",
    descripcion: "Corte moderno con degradado o clásico a tijera y máquina.",
    precio: "Bs. 25",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
  },
  {
    nombre: "Alizado permanente",
    categoria: "Alizado",
    descripcion: "Tratamiento alisador intensivo para un cabello liso, suave y sin frizz.",
    precio: "Bs. 220",
    imagen: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80"
  },
  {
    nombre: "Tinte completo",
    categoria: "Color",
    descripcion: "Aplicación de color uniforme de raíz a puntas con productos de alta fijación.",
    precio: "Bs. 120",
    imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
  },
  {
    nombre: "Mechas / Balayage",
    categoria: "Color",
    descripcion: "Técnica de iluminación degradada natural adaptada a tu tono base.",
    precio: "Bs. 180",
    imagen: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80"
  },
  {
    nombre: "Cambio de look integral",
    categoria: "Cambio de look",
    descripcion: "Asesoramiento morfológico con IA, corte personalizado y colorimetría completa.",
    precio: "Bs. 280",
    imagen: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80"
  }
];

export function buildWhatsappUrl(mensaje) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}