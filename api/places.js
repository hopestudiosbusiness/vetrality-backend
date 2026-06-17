// api/places.js — Vetrality: ricerca attività via SerpApi (Google Maps)
// Restituisce una LISTA di risultati (per gestire omonimi: l'utente sceglie).
// Azione "details" → prende le recensioni reali del posto scelto.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: "SerpApi key non configurata." });

  try {
    const { action, query, city, data_id } = req.body;

    // ── AZIONE: DETTAGLI + RECENSIONI di un posto già scelto ──
    if (action === "details") {
      if (!data_id) return res.status(400).json({ error: "Manca data_id." });
      const revUrl = new URL("https://serpapi.com/search.json");
      revUrl.searchParams.set("engine", "google_maps_reviews");
      revUrl.searchParams.set("data_id", data_id);
      revUrl.searchParams.set("hl", "it");
      revUrl.searchParams.set("api_key", key);

      const revRes = await fetch(revUrl.toString());
      const revData = await revRes.json();
      const reviews = (revData.reviews || []).slice(0, 6).map((r) => ({
        author: r.user?.name || "Anonimo",
        rating: r.rating,
        text: r.snippet || "",
        time: r.date || "",
      }));
      return res.status(200).json({ reviews });
    }

    // ── AZIONE DI DEFAULT: RICERCA (lista di risultati) ──
    if (!query) return res.status(400).json({ error: "Manca il nome dell'attività." });
    const searchText = city ? `${query} ${city}` : query;

    const mapsUrl = new URL("https://serpapi.com/search.json");
    mapsUrl.searchParams.set("engine", "google_maps");
    mapsUrl.searchParams.set("q", searchText);
    mapsUrl.searchParams.set("type", "search");
    mapsUrl.searchParams.set("hl", "it");
    mapsUrl.searchParams.set("gl", "it");
    mapsUrl.searchParams.set("api_key", key);

    const mapsRes = await fetch(mapsUrl.toString());
    const mapsData = await mapsRes.json();

    let results = [];
    if (mapsData.place_results) {
      // singolo risultato esatto
      const p = mapsData.place_results;
      results = [p];
    } else if (mapsData.local_results) {
      results = mapsData.local_results;
    }

    if (!results.length) {
      return res.status(200).json({ found: false, results: [], note: "Nessuna attività trovata. Controlla il nome o aggiungi la città." });
    }

    // Restituiamo i primi 5 risultati con i dati essenziali per la scelta
    const list = results.slice(0, 5).map((p) => ({
      data_id: p.data_id || null,
      place_id: p.place_id || null,
      name: p.title || "",
      address: p.address || "",
      phone: p.phone || null,
      website: p.website || null,
      rating: p.rating || null,
      reviewCount: p.reviews || null,
      type: p.type || (p.types && p.types[0]) || "",
    }));

    return res.status(200).json({ found: true, results: list });
  } catch (err) {
    console.error("SerpApi error:", err);
    return res.status(500).json({ error: "Errore nella ricerca." });
  }
}
