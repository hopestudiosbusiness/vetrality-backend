// api/claude.js — Vetrality Backend Proxy
// La tua API key rimane segreta sul server Vercel.

export default async function handler(req, res) {
  // Gestisce preflight CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key non configurata." });

  try {
    const body = req.body;

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
        // Necessario per il tool web_search
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}
