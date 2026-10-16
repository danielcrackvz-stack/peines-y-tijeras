// api/gemini.js — Backend seguro en Vercel
export default async function handler(req, res) {
  // Configuración de encabezados CORS para permitir peticiones
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel" });
  }

  try {
    const { prompt, fotoBase64 } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: fotoBase64 } }
          ]
        }]
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data?.error?.message || "Error al llamar a Gemini" });
    }

    const respuestaTexto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
    return res.status(200).json({ respuesta: respuestaTexto });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}