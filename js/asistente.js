// ==========================================================================
// Asistente de IA — Peines y Tijeras (Simulación Capilar Real + Gemini 3.8)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const MODELO_GEMINI = "gemini-3.8-flash";

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
let hexColorSeleccionado = "#6B3A1F";

// Tonos capilares del salón
const MAPA_COLORES = {
  "Castaño oscuro": "#2B1B12",
  "Castaño chocolate": "#6B3A1F",
  "Cobrizo": "#B85324",
  "Rubio miel": "#C99E56",
  "Rubio platinado": "#E5D19A",
  "Vino tinto": "#5E1929"
};

function mostrarImagen(src) {
  preview.innerHTML = `<img id="previewImg" src="${src}" alt="Tu simulación" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
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
    if (stream) stream.getTracks().forEach((track) => track.stop());
    btnCap.disabled = true;
    note.textContent = "Foto lista. Selecciona un corte y color, luego presiona 'Simular'.";
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
    hexColorSeleccionado = MAPA_COLORES[colorSeleccionado] || "#6B3A1F";
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
  });
});

// 5. Motor de Simulación Capilar Real sobre tu foto (Canvas Layering)
function renderizarSimulacionSobreTuRostro(colorHex, estilo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // 1. Dibujar tu fotografía original intacta
      ctx.drawImage(img, 0, 0);

      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.28;
      const rw = canvas.width * 0.46;
      const rh = canvas.height * 0.32;

      ctx.save();

      // 2. Modificación de silueta según el corte elegido
      if (estilo === "Bob clásico" || estilo === "Midi wavy") {
        ctx.beginPath();
        ctx.arc(cx, cy, rw * 0.95, Math.PI, 0, false);
        ctx.bezierCurveTo(cx + rw * 1.1, cy + rh * 1.2, cx + rw * 0.7, cy + rh * 1.6, cx + rw * 0.4, cy + rh * 1.5);
        ctx.lineTo(cx - rw * 0.4, cy + rh * 1.5);
        ctx.bezierCurveTo(cx - rw * 0.7, cy + rh * 1.6, cx - rw * 1.1, cy + rh * 1.2, cx - rw * 0.95, cy);
        ctx.closePath();
      } else if (estilo === "Pixie" || estilo === "Undercut") {
        ctx.beginPath();
        ctx.arc(cx, cy * 0.95, rw * 0.88, Math.PI, 0, false);
        ctx.lineTo(cx + rw * 0.85, cy + rh * 0.4);
        ctx.lineTo(cx - rw * 0.85, cy + rh * 0.4);
        ctx.closePath();
      } else if (estilo === "Flequillo") {
        ctx.beginPath();
        ctx.arc(cx, cy, rw * 0.92, Math.PI, 0, false);
        ctx.lineTo(cx + rw * 0.7, cy + rh * 0.6);
        ctx.lineTo(cx - rw * 0.7, cy + rh * 0.6);
        ctx.closePath();
      } else {
        // Capas largas
        ctx.beginPath();
        ctx.arc(cx, cy, rw * 0.95, Math.PI, 0, false);
        ctx.lineTo(cx + rw * 1.05, cy + rh * 2.1);
        ctx.lineTo(cx + rw * 0.45, cy + rh * 2.1);
        ctx.lineTo(cx - rw * 0.45, cy + rh * 2.1);
        ctx.lineTo(cx - rw * 1.05, cy + rh * 2.1);
        ctx.closePath();
      }

      // 3. Aplicar textura de color integrada sin tapar tus facciones
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.58;
      ctx.globalCompositeOperation = "multiply";
      ctx.fill();

      // Resalte de brillo capilar
      ctx.globalAlpha = 0.28;
      ctx.globalCompositeOperation = "screen";
      ctx.fill();

      ctx.restore();

      // Etiqueta informativa
      ctx.save();
      ctx.fillStyle = "rgba(23, 16, 13, 0.82)";
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      ctx.fillStyle = "#F7EFE1";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`Simulación: ${estilo || "Corte personalizado"} • Tono ${colorSeleccionado || "Elegido"}`, 16, canvas.height - 15);
      ctx.restore();

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = fotoOriginalSrc;
  });
}

// 6. Diagnóstico morfológico real con Gemini 3.8 Flash
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Observa detalladamente la fotografía adjunta (evalúa morfología del rostro, facciones y tono de piel de la persona).
El cliente desea realizarse este cambio de look: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este estilo y color armonizan con la estructura real de su rostro y por qué.
2. Da una recomendación técnica concreta para cuando asista al salón.
Sé empática, directa y no incluyas saludos largos.`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }
      ]
    }]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY.trim()
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta del modelo.";
}

// 7. Botón Simular
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
    note.innerHTML = "<em>Generando simulación sobre tu foto y analizando rasgos con Gemini 3.8…</em>";

    try {
      const [fotoSimuladaUrl, diagnostico] = await Promise.all([
        renderizarSimulacionSobreTuRostro(hexColorSeleccionado, estiloSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      mostrarImagen(fotoSimuladaUrl);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Simulación (${detalleTexto}):</strong><br>
          ${diagnostico.replace(/\n/g, "<br>")}
          <div style="margin-top:14px;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 18px; display:inline-block;">
              Agendar cita con este estilo →
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      note.textContent = "Error en la simulación: " + err.message;
    } finally {
      btnSim.disabled = false;
    }
  });
}