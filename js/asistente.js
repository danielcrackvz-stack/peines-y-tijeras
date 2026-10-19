// ==========================================================================
// Asistente de IA — Peines y Tijeras
// Módulo: Asesor de Visagismo y Diagnóstico Morfológico Capilar con IA
// Motor: Gemini 3.1 Pro Preview (con tolerancia a fallos)
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

function mostrarImagen(src) {
  if (preview) {
    preview.style.background = "transparent";
    preview.style.height = "auto";
  }
  preview.innerHTML = `
    <div style="position:relative; width:100%; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <img id="previewImg" src="${src}" alt="Fotografía del cliente" style="width:100%; height:auto; display:block; object-fit:contain;">
    </div>
  `;
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
    note.textContent = "Foto lista. Selecciona un corte y color a evaluar, luego presiona 'Simular'.";
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
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
  });
});

// 5. Diagnóstico Morfológico y Visagismo con Gemini Pro
async function consultarAsesorEstilista(detalles) {
  const promptMaestro = `Eres el Director Creativo y Máster Estilista del salón capilar "Peines y Tijeras".
Analiza con rigor de visagismo la fotografía adjunta (evalúa contorno facial, proporciones óseas, línea de mandíbula, frente y subtono de piel).
El cliente desea evaluar la siguiente propuesta de look: ${detalles}.

Redacta un diagnóstico técnico y personalizado en exactamente 4 puntos concisos:
1. ANÁLISIS MORFOLÓGICO: Identifica la tipología de rostro del cliente y explica cómo este estilo equilibra sus facciones.
2. COLORIMETRÍA CAPILAR: Evalúa el contraste del tono seleccionado frente a su subtono de piel y la iluminación que aportará al rostro.
3. ADAPTACIÓN TÉCNICA EN SALÓN: Qué técnica personalizada de corte o degradado (fade, texturizado, desfilado o capas) se aplicará para integrarlo a su caída natural.
4. RECOMENDACIÓN PREVIA: Consejo práctico de cuidado capilar para llegar preparado a su cita en "Peines y Tijeras".

Sé sumamente profesional, certero y empático. No uses saludos largos ni texto de relleno.`;

  const payload = {
    contents: [{
      parts: [
        { text: promptMaestro },
        { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }
      ]
    }]
  };

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY.trim()
  };

  let ultimoError = null;

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

      ultimoError = data?.error?.message || `Error HTTP ${response.status}`;
    } catch (err) {
      ultimoError = err.message;
    }
  }

  throw new Error(ultimoError || "Modelos de IA ocupados temporalmente.");
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

    btnSim.disabled = true;
    note.innerHTML = "<em>Analizando morfología facial y colorimetría con Gemini…</em>";

    try {
      const diagnostico = await consultarAsesorEstilista(detalleTexto);

      note.innerHTML = `
        <div style="line-height:1.6; text-align:left; background:#fff; padding:16px; border-radius:8px; border-left:4px solid #B86E36; margin-top:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <h4 style="margin:0 0 10px 0; color:#3A271D; font-size:1rem;">Diagnóstico Máster Estilista (${detalleTexto}):</h4>
          <div style="color:#4A3B32; font-size:0.88rem;">${diagnostico.replace(/\n/g, "<br>")}</div>
          <div style="margin-top:16px; text-align:center;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 20px; display:inline-block; border-radius:6px; text-decoration:none;">
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