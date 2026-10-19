// ==========================================================================
// Asistente de IA — Peines y Tijeras
// Probador Virtual Fotográfico Realista + Gemini 3.1 Pro Master Prompt
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
let colorSeleccionado = null;
let estiloSeleccionado = "Undercut";
let hexColorSeleccionado = null;

const MAPA_COLORES = {
  "Castaño oscuro": "#24160E",
  "Castaño chocolate": "#532D15",
  "Cobrizo": "#B35422",
  "Rubio miel": "#CBA457",
  "Rubio platinado": "#E2D3A5",
  "Vino tinto": "#5A1728"
};

// Rutas locales de los assets PNG transparentes
const PELUCAS_LOCALES = {
  "Bob clásico": "./assets/cortes/bob_clasico.png",
  "Capas largas": "./assets/cortes/capas_largas.png",
  "Pixie": "./assets/cortes/pixie.png",
  "Flequillo": "./assets/cortes/flequillo.png",
  "Midi wavy": "./assets/cortes/midi_wavy.png",
  "Undercut": "./assets/cortes/undercut.png"
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

// 5. Montaje de Peluca PNG con Textura Fotográfica y Calce Anatómico
function montarPelucaLocal(estilo, colorHex) {
  return new Promise((resolve) => {
    const imgBase = new Image();
    imgBase.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgBase.width;
      canvas.height = imgBase.height;
      const ctx = canvas.getContext("2d");

      // 1. Dibujar fotografía base original
      ctx.drawImage(imgBase, 0, 0);

      const rutaPeluca = PELUCAS_LOCALES[estilo] || PELUCAS_LOCALES["Undercut"];
      const imgPeluca = new Image();

      imgPeluca.onload = () => {
        // Lienzo auxiliar para teñir la peluca preservando hebras y sombras
        const cP = document.createElement("canvas");
        cP.width = imgPeluca.width;
        cP.height = imgPeluca.height;
        const ctxP = cP.getContext("2d");

        // Dibujar el asset PNG con su textura capilar original
        ctxP.drawImage(imgPeluca, 0, 0);

        if (colorHex) {
          // Capa de colorimetría: tintado cromático manteniendo textura
          ctxP.save();
          ctxP.globalCompositeOperation = "color";
          ctxP.fillStyle = colorHex;
          ctxP.globalAlpha = 0.85;
          ctxP.fillRect(0, 0, cP.width, cP.height);
          ctxP.restore();

          // Resalte de volumen y brillo
          ctxP.save();
          ctxP.globalCompositeOperation = "soft-light";
          ctxP.fillStyle = colorHex;
          ctxP.globalAlpha = 0.50;
          ctxP.fillRect(0, 0, cP.width, cP.height);
          ctxP.restore();

          // Asegurar que las zonas transparentes sigan perfectamente limpias
          ctxP.save();
          ctxP.globalCompositeOperation = "destination-in";
          ctxP.drawImage(imgPeluca, 0, 0);
          ctxP.restore();
        }

        // Posicionamiento anatómico calibrado:
        // Ancho al 92% para ajustarse al cráneo sin salirse
        const anchoPelo = canvas.width * 0.92;
        const altoPelo = (imgPeluca.height / imgPeluca.width) * anchoPelo;
        const posX = (canvas.width - anchoPelo) / 2;
        // Asentado al 3% de la altura total: queda justo sobre el nacimiento del cabello y despeja la frente y cejas
        const posY = canvas.height * 0.03;

        ctx.drawImage(cP, posX, posY, anchoPelo, altoPelo);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };

      imgPeluca.onerror = () => {
        console.warn(`No se encontró el activo ${rutaPeluca}`);
        resolve(fotoOriginalSrc);
      };

      imgPeluca.src = rutaPeluca;
    };
    imgBase.src = fotoOriginalSrc;
  });
}

// 6. Diagnóstico morfológico con Prompt Maestro de Estilismo
async function consultarAsesorEstilista(detalles) {
  const promptMaestro = `Eres el Director Creativo y Máster Estilista del salón capilar "Peines y Tijeras".
Analiza con rigor morfológico la fotografía adjunta (evalúa contorno facial, proporciones óseas, línea de mandíbula, frente y subtono de piel).
El cliente desea visualizarse con la siguiente propuesta de look: ${detalles}.

Redacta un diagnóstico técnico y personalizado en exactamente 4 puntos concisos:
1. ANÁLISIS MORFOLÓGICO: Identifica el tipo de rostro del cliente y explica por qué la estructura de este corte equilibra o desfavorece sus facciones.
2. COLORIMETRÍA CAPILAR: Evalúa el contraste del tono seleccionado frente a su subtono de piel (cálido/frío/neutro) y su impacto en la iluminación del rostro.
3. ADAPTACIÓN TÉCNICA EN SALÓN: Indica qué técnica personalizada de corte o degradado (texturizado, fade, desfilado o capas) se aplicará para que se integre a su caída natural.
4. PLAN DE ACCIÓN: Una recomendación puntual para la preparación del cabello previa a la cita en "Peines y Tijeras".

Sé sumamente profesional, certero y directo. No uses saludos largos ni texto de relleno.`;

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
    note.innerHTML = "<em>Renderizando cabello con textura real y analizando morfología con IA…</em>";

    try {
      const [fotoResultado, diagnostico] = await Promise.all([
        montarPelucaLocal(estiloSeleccionado, hexColorSeleccionado),
        consultarAsesorEstilista(detalleTexto)
      ]);

      mostrarImagen(fotoResultado);

      note.innerHTML = `
        <div style="line-height:1.6;">
          <strong>Diagnóstico Máster Estilista (${detalleTexto}):</strong><br>
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