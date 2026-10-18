// ==========================================================================
// Asistente de IA — Peines y Tijeras (Edición Fotográfica Nano Banana 2.1)
// ==========================================================================
import { GEMINI_API_KEY } from "./config.js";

const MODELO_IMAGEN = "gemini-nano-banana-2.1";
const MODELO_TEXTO = "gemini-3.8-flash";

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
    note.textContent = "Foto lista. Ahora selecciona un estilo o color y presiona 'Simular'.";
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

// 5. Petición de edición visual a Nano Banana 2.1
async function generarEdicionImagen(instrucciones) {
  const prompt = `Realistic photograph edit: Modify the hair of the person in this image. ` +
                 `Apply hairstyle "${estiloSeleccionado || 'same cut'}" and hair color "${colorSeleccionado || 'same color'}". ` +
                 `Keep the exact same face, skin tone, facial features, clothing, and background completely unchanged. High resolution, salon finish.`;

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY.trim()
  };

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }
      ]
    }]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_IMAGEN}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
  }

  // Buscar imagen binaria inline devuelta por el modelo
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData || p.inline_data);
  if (imgPart) {
    const d = imgPart.inlineData || imgPart.inline_data;
    return `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`;
  }

  // Si devuelve texto descriptivo en lugar de imagen directa
  const txtPart = parts.find((p) => p.text);
  if (txtPart) {
    return { soloTexto: txtPart.text };
  }

  throw new Error("El modelo no devolvió una imagen procesada.");
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
    note.innerHTML = "<em>Generando edición fotográfica con Nano Banana 2.1... (puede tomar unos segundos)</em>";

    try {
      const resultado = await generarEdicionImagen(detalleTexto);
      
      if (typeof resultado === "string") {
        mostrarImagen(resultado);
        note.innerHTML = `
          <strong>¡Simulación lista!</strong> Se aplicó ${detalleTexto}.<br>
          <div style="margin-top:12px;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 18px; display:inline-block;">
              Agendar este estilo en el salón →
            </a>
          </div>
        `;
      } else {
        note.innerHTML = `
          <strong>Diagnóstico:</strong> ${resultado.soloTexto}<br>
          <div style="margin-top:12px;">
            <a href="reservas.html?servicio=${encodeURIComponent(elecciones.join(' - '))}" class="btn btn-primary" style="font-size:0.85rem; padding:10px 18px; display:inline-block;">
              Agendar este estilo en el salón →
            </a>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      note.textContent = "Error al editar imagen: " + err.message;
    } finally {
      btnSim.disabled = false;
    }
  });
}