// ==========================================================================
// Asistente de IA — Peines y Tijeras
// Motor: Gemini 3.1 Pro Preview + Probador Virtual Local (Assets PNG)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

// Modelo avanzado de razonamiento morfológico
const MODELO_GEMINI = "gemini-3.1-pro-preview";

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

// Mapa de colores con mezclas tonales del salón
const MAPA_COLORES = {
  "Castaño oscuro": "#1C140E",
  "Castaño chocolate": "#4A2711",
  "Cobrizo": "#A44A1B",
  "Rubio miel": "#C59B4B",
  "Rubio platinado": "#DFCE9A",
  "Vino tinto": "#4F1424"
};

// Rutas a la biblioteca local de cortes transparentes
const PELUCAS_LOCALES = {
  "Bob clásico": "assets/cortes/bob_clasico.png",
  "Capas largas": "assets/cortes/capas_largas.png",
  "Pixie": "assets/cortes/pixie.png",
  "Flequillo": "assets/cortes/flequillo.png",
  "Midi wavy": "assets/cortes/midi_wavy.png",
  "Undercut": "assets/cortes/undercut.png"
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
    hexColorSeleccionado = MAPA_COLORES[colorSeleccionado] || null;
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
  });
});

// 5. Motor de Montaje y Tintado de Peluca sobre el Rostro
function montarPelucaLocal(estilo, colorHex) {
  return new Promise((resolve) => {
    const imgBase = new Image();
    imgBase.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgBase.width;
      canvas.height = imgBase.height;
      const ctx = canvas.getContext("2d");

      // 1. Dibujar rostro original
      ctx.drawImage(imgBase, 0, 0);

      const rutaPeluca = PELUCAS_LOCALES[estilo];
      if (!rutaPeluca) {
        resolve(fotoOriginalSrc);
        return;
      }

      const imgPeluca = new Image();
      imgPeluca.onload = () => {
        // Lienzo temporal para teñir la peluca respetando sombras
        const cP = document.createElement("canvas");
        cP.width = imgPeluca.width;
        cP.height = imgPeluca.height;
        const ctxP = cP.getContext("2d");

        ctxP.drawImage(imgPeluca, 0, 0);

        if (colorHex) {
          ctxP.save();
          ctxP.globalCompositeOperation = "color";
          ctxP.fillStyle = colorHex;
          ctxP.globalAlpha = 0.85;
          ctxP.fillRect(0, 0, cP.width, cP.height);
          ctxP.restore();
        }

        // Posicionar corte en la parte superior del cráneo
        const anchoPelo = canvas.width * 0.94;
        const altoPelo = (imgPeluca.height / imgPeluca.width) * anchoPelo;
        const posX = (canvas.width - anchoPelo) / 2;
        const posY = canvas.height * 0.02;

        ctx.drawImage(cP, posX, posY, anchoPelo, altoPelo);

        // Marca de agua informativa
        ctx.fillStyle = "rgba(23, 16, 13, 0.82)";
        ctx.fillRect(0, canvas.height - 38, canvas.width, 38);
        ctx.fillStyle = "#FAF6F0";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`Corte: ${estilo || "Actual"} • Tono: ${colorSeleccionado || "Base"}`, 16, canvas.height - 14);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };

      imgPeluca.onerror = () => {
        console.warn(`No se encontró el activo ${rutaPeluca}. Asegúrate de ubicarlo en la carpeta.`);
        resolve(fotoOriginalSrc);
      };
      imgPeluca.src = rutaPeluca;
    };
    imgBase.src = fotoOriginalSrc;
  });
}

// 6. Diagnóstico morfológico con Gemini 3.1 Pro Preview
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Analiza detalladamente la fotografía adjunta (evalúa la forma del rostro, simetría, facciones y tonalidad de piel).
El cliente desea este cambio de estilo: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este estilo y color armonizan con su morfología y facciones particulares.
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
    note.innerHTML = "<em>Procesando look y analizando morfología con Gemini 3.1 Pro…</em>";

    try {
      const [fotoResultado, diagnostico] = await Promise.all([
        montarPelucaLocal(estiloSeleccionado, hexColorSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      mostrarImagen(fotoResultado);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Diagnóstico Morfológico (${detalleTexto}):</strong><br>
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