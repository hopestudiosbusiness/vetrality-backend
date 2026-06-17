// api/claude.js — Vetrality Backend Proxy
// Questo file gira su Vercel come serverless function.
// La tua API key di Anthropic rimane segreta nel server,
// i clienti non la vedono mai.

export default async function handler(req, res) {
  // Accetta solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS — permette al frontend di chiamare questo endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Legge la API key dall'ambiente Vercel (mai esposta al client)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key non configurata sul server." });
  }

  try {
    const body = req.body;

    // Forza sempre il modello corretto e un max_tokens ragionevole
    const payload = {
      model: "claude-sonnet-4-6",
      max_tokens: body.max_tokens || 1000,
      ...(body.system && { system: body.system }),
      ...(body.tools && { tools: body.tools }),
      messages: body.messages,
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Passa la risposta di Anthropic direttamente al frontend
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}
