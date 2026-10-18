// ==========================================================================
// Asistente de IA — Peines y Tijeras (Gemini 3.8 Flash + Canvas Styling)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const preview = document.getElementById("capturePreview");
const btnCam = document.getElementById("btnStartCamera");
const btnCap = document.getElementById("btnCapture");
const fileInput = document.getElementById("fileInput");
const btnSim = document.getElementById("btnSimular");
const note = document.getElementById("resultNote");

let stream = null;
let fotoBase64 = null;
let fotoOriginalSrc = null;
let colorSeleccionado = null;
let estiloSeleccionado = null;
let hexColorSeleccionado = null;

// Mapa de colores hexadecimales según la selección
const MAPA_COLORES = {
  "Castaño oscuro": "#2B1B12",
  "Castaño chocolate": "#6B3A1F",
  "Cobrizo": "#A85C2B",
  "Rubio miel": "#C79A56",
  "Rubio platinado": "#E8D3A0",
  "Vino tinto": "#5C2A3B"
};

function mostrarImagen(src) {
  preview.innerHTML = `<img id="previewImg" src="${src}" alt="Tu foto" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
}

function procesarImagen(imgEl) {
  const max = 768;
  const w = imgEl.videoWidth || imgEl.naturalWidth || imgEl.width;
  const h = imgEl.videoHeight || imgEl.naturalHeight || imgEl.height;
  const esc = Math.min(1, max / Math.max(w, h));
  
  const c = document.createElement("canvas");
  c.width = Math.round(w * esc);
  c.height = Math.round(h * esc);
  const ctx = c.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, c.width, c.height);
  
  fotoOriginalSrc = c.toDataURL("image/jpeg", 0.9);
  fotoBase64 = fotoOriginalSrc.split(",")[1];
  mostrarImagen(fotoOriginalSrc);
}

// 1. Activar Cámara
if (btnCam) {
  btnCam.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      preview.innerHTML = "";
      const v = document.createElement("video");
      v.autoplay = true;
      v.playsInline = true;
      v.muted = true;
      v.srcObject = stream;
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";
      preview.appendChild(v);
      if (btnCap) btnCap.disabled = false;
      note.textContent = "Cámara lista. Colócate de frente y presiona 'Tomar foto'.";
    } catch (err) {
      console.error(err);
      note.textContent = "No se pudo acceder a la cámara. Concede los permisos o sube una foto desde tu galería.";
    }
  });
}

// 2. Tomar Foto
if (btnCap) {
  btnCap.addEventListener("click", () => {
    const v = preview.querySelector("video");
    if (!v) return;
    procesarImagen(v);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    btnCap.disabled = true;
    note.textContent = "Foto capturada. Ahora elige un color o corte y haz clic en Simular.";
  });
}

// 3. Subir archivo
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => procesarImagen(img);
    img.src = URL.createObjectURL(f);
    note.textContent = "Foto cargada. Elige tus opciones y presiona 'Simular'.";
  });
}

// 4. Selección de Color y Corte
document.querySelectorAll(".swatch").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    colorSeleccionado = s.dataset.color || s.getAttribute("title");
    hexColorSeleccionado = MAPA_COLORES[colorSeleccionado] || s.style.backgroundColor;
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
  });
});

// Función de simulación visual sobre la foto usando Canvas
function aplicarTransformacionVisual(colorHex, estiloNombre) {
  if (!fotoOriginalSrc) return;
  const imgBase = new Image();
  imgBase.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = imgBase.width;
    canvas.height = imgBase.height;
    const ctx = canvas.getContext("2d");

    // Dibujar la foto original capturada
    ctx.drawImage(imgBase, 0, 0);

    // Si seleccionó color, aplicar filtro cromático en la zona capilar
    if (colorHex) {
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.55;
      // Capa aplicada en la corona y laterales del rostro
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.42, canvas.height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Marca de simulación estética
    ctx.save();
    ctx.fillStyle = "rgba(33, 23, 18, 0.75)";
    ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
    ctx.fillStyle = "#F6EFE3";
    ctx.font = "bold 13px sans-serif";
    const etiqueta = `Simulación: ${estiloNombre || "Corte actual"} ${colorHex ? "• " + colorSeleccionado : ""}`;
    ctx.fillText(etiqueta, 20, canvas.height - 20);
    ctx.restore();

    mostrarImagen(canvas.toDataURL("image/jpeg", 0.9));
  };
  imgBase.src = fotoOriginalSrc;
}

// 5. Petición a Gemini 3.8 Flash
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Observa detalladamente la fotografía adjunta (evalúa morfología del rostro, facciones y tono de piel).
La clienta está interesada en este cambio de look: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este corte y/o color armoniza con sus facciones y por qué.
2. Da una recomendación técnica concreta para el momento en que se atienda en el salón.
Sé empática, directa y no incluyas saludos largos.`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }
      ]
    }]
  };

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY.trim()
  };

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta del modelo.";
}

// 6. Botón Simular
if (btnSim) {
  btnSim.addEventListener("click", async () => {
    if (!fotoBase64) {
      note.textContent = "Primero debes tomarte una foto o subir una imagen.";
      return;
    }
    if (!colorSeleccionado && !estiloSeleccionado) {
      note.textContent = "Selecciona al menos un color o un corte a evaluar.";
      return;
    }

    const elecciones = [];
    if (estiloSeleccionado) elecciones.push(`Corte: ${estiloSeleccionado}`);
    if (colorSeleccionado) elecciones.push(`Color: ${colorSeleccionado}`);
    const detalleTexto = elecciones.join(" y ");

    // Aplicar transformación visual directa sobre la foto
    aplicarTransformacionVisual(hexColorSeleccionado, estiloSeleccionado);

    btnSim.disabled = true;
    note.innerHTML = "<em>Procesando look y analizando morfología con Gemini 3.8…</em>";

    try {
      const respuesta = await consultarAsesorEstilista(detalleTexto);
      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Diagnóstico Personalizado de Estilo:</strong><br>
          ${respuesta.replace(/\n/g, "<br>")}
          <div style="margin-top:14px;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 18px; display:inline-block;">
              Agendar cita con este estilo →
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      note.textContent = "Error al conectar con la IA: " + err.message;
    } finally {
      btnSim.disabled = false;
    }
  });
}