import { WHATSAPP_NUMBER, buildWhatsappUrl } from "js/config.js";

document.addEventListener("DOMContentLoaded", () => {
  // Menú móvil responsivo
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Enlace directo en el botón flotante de WhatsApp
  const whatsappFloat = document.getElementById("whatsappFloat");
  if (whatsappFloat) {
    whatsappFloat.href = buildWhatsappUrl("¡Hola Peines y Tijeras! Quisiera hacer una consulta sobre los servicios del salón.");
  }
});