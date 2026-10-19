// ==========================================================================
// Asistente de IA — Peines y Tijeras (Ajuste Libre Calibrado + Gemini Pro)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const MODELOS_EN_CASCADA = [
  "gemini-3.1-pro-preview",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite"
];

const preview = document.getElementById("capturePreview");
const btnCam = document.getElementById("btnStartCamera");
const btnCap = document.getElementById("btnCapture");
const fileInput = document.getElementById("fileInput");
const btnSim = document.getElementById("btnSimular");
const note = document.getElementById("resultNote");

let stream = null;
let fotoBase64 = null;
let fotoOriginalSrc = null;
let estiloSeleccionado = "Undercut";
let colorSeleccionado = "Cobrizo";

// Rutas locales a los archivos PNG transparentes
const PELUCAS_LOCALES = {
  "Bob clásico": "./assets/cortes/bob_clasico.png",
  "Capas largas": "./assets/cortes/capas_largas.png",
  "Pixie": "./assets/cortes/pixie.png",
  "Flequillo": "./assets/cortes/flequillo.png",
  "Midi wavy": "./assets/cortes/midi_wavy.png",
  "Undercut": "./assets/cortes/undercut.png"
};

// Valores iniciales calibrados para calzar naturalmente sobre la cabeza
let wigTop = -12;     // Altura (%)
let wigLeft = 50;     // Centrado horizontal (%)
let wigScale = 180;   // Tamaño inicial amplio (%)

function renderizarVistaInteractiva() {
  if (!fotoOriginalSrc) return;

  const rutaPeluca = PELUCAS_LOCALES[estiloSeleccionado] || PELUCAS_LOCALES["Undercut"];

  // Limpiar estilos forzados del contenedor exterior para evitar franjas negras
  if (preview) {
    preview.style.background = "transparent";
    preview.style.height = "auto";
    preview.style.overflow = "visible";
  }

  preview.innerHTML = `
    <!-- Contenedor de la foto y peluca -->
    <div id="canvasWrapper" style="position:relative; width:100%; border-radius:8px; overflow:hidden; background:transparent; line-height:0;">
      <img id="baseImg" src="${fotoOriginalSrc}" style="width:100%; height:auto; display:block; margin:0 auto; object-fit:contain;">
      <img id="wigOverlay" src="${rutaPeluca}" alt="Corte" style="position:absolute; left:${wigLeft}%; top:${wigTop}%; width:${wigScale}%; transform:translate(-50%, 0); pointer-events:none; z-index:10; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
    </div>

    <!-- Panel de controles ubicado ordenadamente DEBAJO de la foto -->
    <div style="background:#F6F0E6; border:1px solid #E5D5C0; padding:12px 14px; border-radius:8px; margin-top:12px; display:flex; flex-direction:column; gap:10px; font-size:0.8rem; box-shadow:0 2px 6px rgba(0,0,0,0.05); text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:#3A271D;">Tamaño de peluca:</span>
        <input type="range" id="sliderScale" min="80" max="400" value="${wigScale}" style="width:58%; accent-color:#B86E36;">
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:#3A271D;">Subir / Bajar:</span>
        <input type="range" id="sliderTop" min="-50" max="60" value="${wigTop}" style="width:58%; accent-color:#B86E36;">
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:#3A271D;">Mover izquierda / derecha:</span>
        <input type="range" id="sliderLeft" min="10" max="90" value="${wigLeft}" style="width:58%; accent-color:#B86E36;">
      </div>
    </div>
  `;

  // Controladores interactivos en tiempo real
  const sliderScale = document.getElementById("sliderScale");
  const sliderTop = document.getElementById("sliderTop");
  const sliderLeft = document.getElementById("sliderLeft");
  const wigEl = document.getElementById("wigOverlay");

  sliderScale.addEventListener("input", (e) => {
    wigScale = e.target.value;
    wigEl.style.width = `${wigScale}%`;
  });

  sliderTop.addEventListener("input", (e) => {
    wigTop = e.target.value;
    wigEl.style.top = `${wigTop}%`;
  });

  sliderLeft.addEventListener("input", (e) => {
    wigLeft = e.target.value;
    wigEl.style.left = `${wigLeft}%`;
  });
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
  renderizarVistaInteractiva();
}

// 1. Activar Cámara
if (btnCam) {
  btnCam.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      preview.innerHTML = "";
      if (preview) {
        preview.style.background = "transparent";
        preview.style.height = "auto";
      }
      const v = document.createElement("video");
      v.autoplay = true;
      v.playsInline = true;
      v.muted = true;
      v.srcObject = stream;
      v.style.width = "100%";
      v.style.height = "auto";
      v.style.display = "block";
      v.style.borderRadius = "8px";
      preview.appendChild(v);
      if (btnCap) btnCap.disabled = false;
      note.textContent = "Cámara lista. Ubícate al centro y presiona 'Tomar foto'.";
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
    if (stream) stream.getTracks().forEach((track) => track.stop());
    btnCap.disabled = true;
    note.textContent = "Foto lista. Usa los controles inferiores para acomodar el corte a tu cabeza y presiona 'Simular'.";
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
    note.textContent = "Foto cargada. Ajusta el corte con los controles y presiona 'Simular'.";
  });
}

// 4. Selección de Color y Corte
document.querySelectorAll(".swatch").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    colorSeleccionado = s.dataset.color || s.getAttribute("title");
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
    if (fotoOriginalSrc) renderizarVistaInteractiva();
  });
});

// 5. Diagnóstico Morfológico con IA (Gemini)
async function consultarAsesorEstilista(detalles) {
  const prompt = `Eres el Director Creativo y Estilista Máster del salón de belleza capilar "Peines y Tijeras".
Evalúa con rigor profesional la fotografía adjunta (evalúa contorno facial, proporciones óseas, línea de mandíbula, frente y subtono de piel).
El cliente está probando este look: ${detalles}.

Redacta un diagnóstico técnico y personalizado en exactamente 4 puntos concisos:
1. ANÁLISIS MORFOLÓGICO: Identifica el tipo de rostro del cliente y explica por qué la estructura de este corte equilibra sus facciones.
2. COLORIMETRÍA CAPILAR: Evalúa el contraste del tono seleccionado frente a su subtono de piel y la iluminación de su rostro.
3. ADAPTACIÓN TÉCNICA EN SALÓN: Qué técnica personalizada de corte o degradado (fade, texturizado, capas) se aplicará para integrarlo a su caída natural.
4. PLAN DE ACCIÓN: Una recomendación puntual para preparar el cabello antes de su cita en "Peines y Tijeras".

Sé directo, sumamente profesional y certero. Sin saludos largos ni texto de relleno.`;

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

  for (const modelo of MODELOS_EN_CASCADA) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn(`Error en ${modelo}:`, err);
    }
  }

  throw new Error("No se pudo obtener el diagnóstico en este momento.");
}

// 6. Botón Simular
if (btnSim) {
  btnSim.addEventListener("click", async () => {
    if (!fotoBase64) {
      note.textContent = "Primero debes tomarte una foto o subir una imagen.";
      return;
    }

    const elecciones = [];
    if (estiloSeleccionado) elecciones.push(`Corte: ${estiloSeleccionado}`);
    if (colorSeleccionado) elecciones.push(`Color: ${colorSeleccionado}`);
    const detalleTexto = elecciones.join(" y ");

    btnSim.disabled = true;
    note.innerHTML = "<em>Generando diagnóstico morfológico profesional con Gemini…</em>";

    try {
      const diagnostico = await consultarAsesorEstilista(detalleTexto);

      note.innerHTML = `
        <div style="line-height:1.6; text-align:left;">
          <strong>Diagnóstico Máster Estilista (${detalleTexto}):</strong><br>
          ${diagnostico.replace(/\n/g, "<br>")}
          <div style="margin-top:14px; text-align:center;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 18px; display:inline-block;">
              Agendar cita con este estilo →
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      note.textContent = "Error al conectar con el asistente de IA: " + err.message;
    } finally {
      btnSim.disabled = false;
    }
  });
}