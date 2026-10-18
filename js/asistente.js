// ==========================================================================
// Asistente de IA — Peines y Tijeras (Transformación Img2Img + Gemini 3.8 Flash)
// ==========================================================================
import { GEMINI_API_KEY, HF_ACCESS_TOKEN } from "./config.js";

const MODELO_GEMINI = "gemini-3.8-flash";
// Modelo de difusión para inferencia basada en imagen
const MODELO_IMG2IMG = "runwayml/stable-diffusion-v1-5";

const preview = document.getElementById("capturePreview");
const btnCam = document.getElementById("btnStartCamera");
const btnCap = document.getElementById("btnCapture");
const fileInput = document.getElementById("fileInput");
const btnSim = document.getElementById("btnSimular");
const note = document.getElementById("resultNote");

let stream = null;
let fotoBase64 = null;
let fotoBlob = null;
let colorSeleccionado = null;
let estiloSeleccionado = null;

const COLOR_EN = {
  "Castaño oscuro": "dark brown",
  "Castaño chocolate": "rich chocolate brown",
  "Cobrizo": "vibrant copper auburn",
  "Rubio miel": "warm honey blonde",
  "Rubio platinado": "platinum blonde",
  "Vino tinto": "deep burgundy wine red"
};

const ESTILO_EN = {
  "Bob clásico": "classic bob haircut",
  "Capas largas": "long layered hairstyle",
  "Pixie": "pixie cut",
  "Flequillo": "hairstyle with front bangs",
  "Midi wavy": "midi wavy lob haircut",
  "Undercut": "modern undercut hairstyle"
};

function mostrarImagen(src) {
  preview.innerHTML = `<img id="previewImg" src="${src}" alt="Simulación" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
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
  
  c.toBlob((blob) => {
    fotoBlob = blob;
    const url = URL.createObjectURL(blob);
    mostrarImagen(url);
  }, "image/jpeg", 0.9);

  fotoBase64 = c.toDataURL("image/jpeg", 0.85).split(",")[1];
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
      note.textContent = "No se pudo acceder a la cámara. Concede permisos o sube una foto.";
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

// 4. Selectores de corte y color
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

// 5. Inferencia Img2Img por Proxy CORS (evita el error Failed to fetch)
async function transformarFotoConIA(corte, color, reintentos = 2) {
  const estiloEn = ESTILO_EN[corte] || "styled haircut";
  const colorEn = COLOR_EN[color] || "colored hair";

  // Prompt enfocado en preservar rasgos faciales y modificar únicamente el cabello
  const prompt = `portrait photograph of the same person, maintaining identical face, facial features, skin tone and clothes, but with professional ${estiloEn} and vibrant ${colorEn} hair, 8k salon photography`;

  // Canalización por proxy CORS público para evitar el bloqueo del navegador
  const endpointHf = `https://api-inference.huggingface.co/models/${MODELO_IMG2IMG}`;
  const urlProxy = "https://corsproxy.io/?" + encodeURIComponent(endpointHf);

  const response = await fetch(urlProxy, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_ACCESS_TOKEN.trim()}`,
      "Accept": "image/jpeg"
    },
    body: fotoBlob
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Manejo de carga en frío (modelo inicializando en el servidor)
    if (response.status === 503 && reintentos > 0) {
      note.innerHTML = "<em>El servidor de IA está iniciando el modelo. Esperando 15 segundos…</em>";
      await new Promise((r) => setTimeout(r, 15000));
      return transformarFotoConIA(corte, color, reintentos - 1);
    }
    throw new Error(`Error en el modelo (${response.status}): ${errorBody}`);
  }

  const resultBlob = await response.blob();
  return URL.createObjectURL(resultBlob);
}

// 6. Diagnóstico Estilista con Gemini 3.8 Flash
async function consultarAsesorEstilista(detalles) {
  const prompt = `Actúa como estilista profesional del salón de belleza capilar "Peines y Tijeras".
Evalúa morfología y tono de piel en la foto adjunta frente a este cambio de look: ${detalles}.
Entrega un diagnóstico profesional en 4 líneas breves indicando si le favorece, por qué y un consejo técnico para cuando asista al salón. Sé directa y sin saludos largos.`;

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
    if (!fotoBase64 || !fotoBlob) {
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
    note.innerHTML = "<em>Transformando tu look con IA y analizando tu morfología…</em>";

    try {
      // Ejecución paralela: Imagen modificada + Diagnóstico Gemini
      const [urlImagenGenerada, diagnostico] = await Promise.all([
        transformarFotoConIA(estiloSeleccionado, colorSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      mostrarImagen(urlImagenGenerada);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Simulación Fotográfica (${detalleTexto}):</strong><br>
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