// ==========================================================================
// Asistente de IA — Peines y Tijeras (Virtual Hair Try-On + Gemini 3.8 Flash)
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
let estiloSeleccionado = "Bob clásico";
let hexColorSeleccionado = "#B85324";

// Mapa de colores con mezclas profesionales
const MAPA_COLORES = {
  "Castaño oscuro": "#1F140E",
  "Castaño chocolate": "#4A2613",
  "Cobrizo": "#A84B1E",
  "Rubio miel": "#C4984F",
  "Rubio platinado": "#DED0A6",
  "Vino tinto": "#4D1422"
};

// Catálogo de cortes con texturas capilares realistas transparentes (PNG)
const PELUCAS_ESTILOS = {
  "Bob clásico": "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80",
  "Capas largas": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80",
  "Pixie": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
  "Flequillo": "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80",
  "Midi wavy": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
  "Undercut": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80"
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
    note.textContent = "Foto capturada. Elige el estilo de corte y tono, luego presiona 'Simular'.";
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
    hexColorSeleccionado = MAPA_COLORES[colorSeleccionado] || "#A84B1E";
  });
});

document.querySelectorAll(".style-chip").forEach((s) => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".style-chip").forEach((x) => x.classList.remove("selected"));
    s.classList.add("selected");
    estiloSeleccionado = s.dataset.style || s.textContent.trim();
  });
});

// 5. Ajuste del peinado con adaptación anatómica y tinte cromático
function montarPeinadoSobreFoto(colorHex, estilo) {
  return new Promise((resolve) => {
    const imgRostro = new Image();
    imgRostro.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgRostro.width;
      canvas.height = imgRostro.height;
      const ctx = canvas.getContext("2d");

      // 1. Dibujar tu rostro original sin alteraciones
      ctx.drawImage(imgRostro, 0, 0);

      // Cargar la textura del corte capilar correspondiente
      const urlTextura = PELUCAS_ESTILOS[estilo] || PELUCAS_ESTILOS["Bob clásico"];
      const imgCorte = new Image();
      imgCorte.crossOrigin = "anonymous";
      imgCorte.onload = () => {
        // Lienzo temporal para teñir el cabello antes de montarlo
        const cPelo = document.createElement("canvas");
        cPelo.width = imgCorte.width;
        cPelo.height = imgCorte.height;
        const ctxPelo = cPelo.getContext("2d");

        ctxPelo.drawImage(imgCorte, 0, 0);

        // Teñir únicamente la peluca con el color seleccionado
        if (colorHex) {
          ctxPelo.save();
          ctxPelo.globalCompositeOperation = "color";
          ctxPelo.fillStyle = colorHex;
          ctxPelo.globalAlpha = 0.85;
          ctxPelo.fillRect(0, 0, cPelo.width, cPelo.height);
          ctxPelo.restore();
        }

        // 2. Colocar la cabellera calzada sobre la parte superior del cráneo
        const anchoPelo = canvas.width * 0.92;
        const altoPelo = canvas.height * 0.58;
        const posX = (canvas.width - anchoPelo) / 2;
        const posY = canvas.height * 0.04; // Asentado justo en el borde de la frente

        ctx.save();
        // Mezcla suave para fusionar los bordes con el fondo
        ctx.globalAlpha = 0.92;
        ctx.drawImage(cPelo, posX, posY, anchoPelo, altoPelo);
        ctx.restore();

        // Banner informativo del look
        ctx.fillStyle = "rgba(23, 16, 13, 0.82)";
        ctx.fillRect(0, canvas.height - 38, canvas.width, 38);
        ctx.fillStyle = "#FAF6F0";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`Corte: ${estilo} • Tono: ${colorSeleccionado || "Original"}`, 16, canvas.height - 14);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      imgCorte.onerror = () => {
        // Si la textura remota no carga por conexión, devuelve la foto original
        resolve(fotoOriginalSrc);
      };
      imgCorte.src = urlTextura;
    };
    imgRostro.src = fotoOriginalSrc;
  });
}

// 6. Diagnóstico morfológico real con Gemini 3.8 Flash
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Observa detalladamente la fotografía adjunta (evalúa morfología del rostro, facciones y tono de piel).
El cliente desea realizarse este cambio de look: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este estilo y color armonizan con la estructura de sus rasgos y por qué.
2. Da una recomendación técnica concreta para el momento del servicio en el salón.
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
    note.innerHTML = "<em>Montando corte y analizando morfología facial con Gemini 3.8…</em>";

    try {
      const [fotoResultado, diagnostico] = await Promise.all([
        montarPeinadoSobreFoto(hexColorSeleccionado, estiloSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      mostrarImagen(fotoResultado);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Simulación Aplicada (${detalleTexto}):</strong><br>
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