// ==========================================================================
// Asistente de IA — Peines y Tijeras (Gemini 3.8 Flash + Simulación Visual)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const MODELO_ACTIVO = "gemini-3.8-flash";

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

// Mapa de tonos para la transformación de color en el cabello
const MAPA_COLORES = {
  "Castaño oscuro": "#2B1B12",
  "Castaño chocolate": "#6B3A1F",
  "Cobrizo": "#A85C2B",
  "Rubio miel": "#C79A56",
  "Rubio platinado": "#E8D3A0",
  "Vino tinto": "#5C2A3B"
};

function mostrarImagen(src) {
  preview.innerHTML = `<img id="previewImg" src="${src}" alt="Foto" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
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
      note.textContent = "Cámara lista. Ubícate de frente y presiona 'Tomar foto'.";
    } catch (err) {
      console.error(err);
      note.textContent = "No se pudo acceder a la cámara. Concede los permisos o sube una foto.";
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
    note.textContent = "Foto lista. Selecciona un color o estilo de corte y haz clic en Simular.";
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

// Función para aplicar simulación visual sobre la fotografía
function aplicarFiltroCabello(colorHex, estiloNombre) {
  if (!fotoOriginalSrc) return;
  const imgBase = new Image();
  imgBase.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = imgBase.width;
    canvas.height = imgBase.height;
    const ctx = canvas.getContext("2d");

    // Dibujar la imagen base
    ctx.drawImage(imgBase, 0, 0);

    // Si eligió color, aplicar capa cromática en la parte superior del cabello
    if (colorHex) {
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.44, canvas.height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Pie de foto con el estilo simulado
    ctx.save();
    ctx.fillStyle = "rgba(31, 22, 18, 0.85)";
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
    ctx.fillStyle = "#FAF6F0";
    ctx.font = "bold 14px sans-serif";
    const texto = `Look simulado: ${estiloNombre || "Corte base"} ${colorHex ? "• Tono " + colorSeleccionado : ""}`;
    ctx.fillText(texto, 16, canvas.height - 18);
    ctx.restore();

    mostrarImagen(canvas.toDataURL("image/jpeg", 0.9));
  };
  imgBase.src = fotoOriginalSrc;
}

// 5. Petición a Gemini 3.8 Flash (Diagnóstico Estilista)
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Observa detalladamente la fotografía adjunta (evalúa morfología del rostro, facciones y tono de piel).
La clienta está interesada en este cambio de look: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este estilo y tono favorecen a sus facciones y por qué.
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_ACTIVO}:generateContent`;
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

    // Aplicar transformación visual directa
    aplicarFiltroCabello(hexColorSeleccionado, estiloSeleccionado);

    btnSim.disabled = true;
    note.innerHTML = "<em>Analizando rasgos con Gemini 3.8 Flash…</em>";

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