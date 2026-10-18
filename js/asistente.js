// ==========================================================================
// Asistente de IA — Peines y Tijeras (Generación de Imagen + Diagnóstico Gemini)
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
let colorSeleccionado = null;
let estiloSeleccionado = null;

// Traducción de colores para el generador de imágenes en inglés (mayor precisión)
const COLOR_EN = {
  "Castaño oscuro": "dark brown",
  "Castaño chocolate": "chocolate brown",
  "Cobrizo": "copper auburn",
  "Rubio miel": "honey blonde",
  "Rubio platinado": "platinum blonde",
  "Vino tinto": "burgundy wine red"
};

// Traducción de estilos de corte
const ESTILO_EN = {
  "Bob clásico": "classic bob",
  "Capas largas": "long layered",
  "Pixie": "pixie cut",
  "Flequillo": "fringe bangs",
  "Midi wavy": "midi wavy lob",
  "Undercut": "modern undercut"
};

function mostrarImagen(src) {
  preview.innerHTML = `<img id="previewImg" src="${src}" alt="Simulación generada" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
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
  
  const url = c.toDataURL("image/jpeg", 0.85);
  fotoBase64 = url.split(",")[1];
  mostrarImagen(url);
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
    note.textContent = "Foto lista. Selecciona el corte y color deseados y presiona 'Simular'.";
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

// 5. Generar Imagen Nueva con IA
function generarNuevaImagen(corte, color) {
  return new Promise((resolve, reject) => {
    const estiloIngles = ESTILO_EN[corte] || "modern hairstyle";
    const colorIngles = COLOR_EN[color] || "natural hair color";

    const prompt = encodeURIComponent(
      `professional portrait photograph of a woman with a ${estiloIngles} haircut and ${colorIngles} hair, salon lighting, hyperrealistic, clean background, 8k photography`
    );

    // Semilla aleatoria para variar las generaciones
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=768&height=960&seed=${seed}&nologo=true`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(imageUrl);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen generada por IA."));
    img.src = imageUrl;
  });
}

// 6. Diagnóstico con Gemini 3.8 Flash sobre la foto de la clienta
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Observa detalladamente la fotografía adjunta (evalúa morfología del rostro, facciones y tono de piel).
La clienta desea realizarse: ${detalles}.
Entrega un diagnóstico en español en 4 líneas breves y profesionales:
1. Explica si este estilo y color armonizan con sus rasgos particulares.
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

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY.trim()
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent`;
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
    note.innerHTML = "<em>Generando fotografía del look con IA y analizando tu foto…</em>";

    try {
      // Ejecutar la generación visual y el análisis en paralelo
      const [imagenGeneradaUrl, diagnostico] = await Promise.all([
        generarNuevaImagen(estiloSeleccionado, colorSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      // Reemplazar el contenedor con la imagen generada por IA
      mostrarImagen(imagenGeneradaUrl);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Look Generado por IA (${detalleTexto}):</strong><br>
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
      note.textContent = "Error durante la simulación: " + err.message;
    } finally {
      btnSim.disabled = false;
    }
  });
}