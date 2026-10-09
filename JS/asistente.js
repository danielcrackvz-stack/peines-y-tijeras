// ==========================================================================
// Asistente de IA — Peines y Tijeras (Gemini, Google AI Studio)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const MODELO_IMAGEN = "gemini-2.5-flash-image"; // edita la foto (si tu cuenta lo permite)
const MODELO_TEXTO = "gemini-2.5-flash";        // respaldo gratuito: consejos en texto
const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

const preview = document.getElementById("capturePreview");
const btnCam = document.getElementById("btnStartCamera");
const btnCap = document.getElementById("btnCapture");
const fileInput = document.getElementById("fileInput");
const btnSim = document.getElementById("btnSimular");
const note = document.getElementById("resultNote");

let stream = null;
let fotoBase64 = null;
let color = null;
let estilo = null;

function mostrarImagen(src) {
  preview.innerHTML = `<img src="${src}" alt="Foto">`;
}

// Reduce la foto a máx. 768 px para que la IA responda más rápido
function procesarImagen(imgEl) {
  const max = 768;
  const w = imgEl.videoWidth || imgEl.width;
  const h = imgEl.videoHeight || imgEl.height;
  const esc = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * esc);
  c.height = Math.round(h * esc);
  c.getContext("2d").drawImage(imgEl, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.85);
  fotoBase64 = url.split(",")[1];
  mostrarImagen(url);
}

// ---------- Cámara y subida ----------
btnCam.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    preview.innerHTML = "";
    const v = document.createElement("video");
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true;
    v.srcObject = stream;
    preview.appendChild(v);
    btnCap.disabled = false;
  } catch {
    note.textContent = "No se pudo abrir la cámara. Revisa los permisos o sube una foto.";
  }
});

btnCap.addEventListener("click", () => {
  const v = preview.querySelector("video");
  if (!v) return;
  procesarImagen(v);
  stream?.getTracks().forEach((t) => t.stop());
  btnCap.disabled = true;
});

fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => procesarImagen(img);
  img.src = URL.createObjectURL(f);
});

// ---------- Selección de color y corte ----------
document.querySelectorAll(".swatch").forEach((s) =>
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    color = s.dataset.color;
  })
);
document.querySelectorAll(".style-chip").forEach((s) =>
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estilo = s.dataset.style;
  })
);

// ---------- Llamadas a Gemini ----------
async function llamarGemini(modelo, texto) {
  const r = await fetch(`${BASE}${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: texto }, { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }] }]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Error ${r.status}`);
  return data?.candidates?.[0]?.content?.parts || [];
}

async function simularImagen(cambios) {
  const prompt =
    `Edita esta fotografía: ${cambios}. Mantén exactamente la misma persona, rostro, expresión, ` +
    `fondo e iluminación. Cambia solo el cabello. Resultado realista, como una foto.`;
  const parts = await llamarGemini(MODELO_IMAGEN, prompt);
  const img = parts.find((p) => p.inlineData || p.inline_data);
  if (!img) throw new Error("La IA no devolvió una imagen.");
  const d = img.inlineData || img.inline_data;
  return `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`;
}

async function asesorarEnTexto(cambios) {
  const prompt =
    `Eres una estilista profesional de un salón de belleza capilar. Observa la foto y, considerando ` +
    `la forma del rostro y el tipo de cabello, opina en español, en 4 a 5 líneas cortas, si le quedaría bien ` +
    `lo siguiente: ${cambios}. Menciona un consejo concreto y una alternativa. Sin saludos largos.`;
  const parts = await llamarGemini(MODELO_TEXTO, prompt);
  return parts.map((p) => p.text || "").join("").trim();
}

// ---------- Botón Simular ----------
btnSim.addEventListener("click", async () => {
  if (!fotoBase64) { note.textContent = "Primero toma o sube una foto."; return; }
  if (!color && !estilo) { note.textContent = "Elige un color o un corte."; return; }
  if (!import.meta.env.VITE_GCP_API_KEY) {
    note.textContent = "Falta configurar la clave de Gemini en js/config.js.";
    return;
  }

  const partes = [];
  if (estilo) partes.push(`cambia el corte de cabello a un estilo "${estilo}"`);
  if (color) partes.push(`tiñe el cabello de color "${color}"`);
  const cambios = partes.join(" y ");

  btnSim.disabled = true;
  note.textContent = "Generando simulación… puede tardar unos segundos.";
  try {
    const src = await simularImagen(cambios);
    mostrarImagen(src);
    note.textContent = "Simulación referencial: el resultado real lo define la estilista. ¡Reserva por WhatsApp cuando decidas!";
  } catch (e) {
    console.warn("Fallo la generación de imagen:", e);
    try {
      note.textContent = "No se pudo generar la imagen; la IA te da su opinión…";
      const consejo = await asesorarEnTexto(cambios);
      note.textContent = "Opinión de la IA: " + consejo;
    } catch (e2) {
      note.textContent = "No se pudo conectar con la IA: " + e2.message;
    }
  } finally {
    btnSim.disabled = false;
  }
});