// api/places.js — Vetrality: ricerca reale attività via SerpApi (Google Maps)
// Trova il posto giusto, prende nome, indirizzo, telefono, rating
// e recensioni reali di Google Maps.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: "SerpApi key non configurata." });

  try {
    const { query, city } = req.body;
    if (!query) return res.status(400).json({ error: "Manca il nome dell'attività." });

    const searchText = city ? `${query} ${city}` : query;

    // 1. GOOGLE MAPS SEARCH — trova l'attività
    const mapsUrl = new URL("https://serpapi.com/search.json");
    mapsUrl.searchParams.set("engine", "google_maps");
    mapsUrl.searchParams.set("q", searchText);
    mapsUrl.searchParams.set("type", "search");
    mapsUrl.searchParams.set("hl", "it");
    mapsUrl.searchParams.set("gl", "it");
    mapsUrl.searchParams.set("api_key", key);

    const mapsRes = await fetch(mapsUrl.toString());
    const mapsData = await mapsRes.json();

    // I risultati possono stare in local_results (lista) o place_results (singolo)
    let place = null;
    let multiple = false;

    if (mapsData.place_results) {
      place = mapsData.place_results;
    } else if (mapsData.local_results && mapsData.local_results.length > 0) {
      place = mapsData.local_results[0];
      multiple = mapsData.local_results.length > 1;
    }

    if (!place) {
      return res.status(200).json({
        found: false,
        note: "Nessuna attività trovata con questo nome. Controlla l'ortografia o aggiungi la città.",
      });
    }

    // 2. RECENSIONI — se abbiamo un data_id, prendiamo le recensioni reali
    let reviews = [];
    const dataId = place.data_id;
    if (dataId) {
      try {
        const revUrl = new URL("https://serpapi.com/search.json");
        revUrl.searchParams.set("engine", "google_maps_reviews");
        revUrl.searchParams.set("data_id", dataId);
        revUrl.searchParams.set("hl", "it");
        revUrl.searchParams.set("api_key", key);

        const revRes = await fetch(revUrl.toString());
        const revData = await revRes.json();
        reviews = (revData.reviews || []).slice(0, 5).map((r) => ({
          author: r.user?.name || "Anonimo",
          rating: r.rating,
          text: r.snippet || "",
          time: r.date || "",
        }));
      } catch (e) {
        // Se le recensioni falliscono, proseguiamo comunque con i dati base
        console.error("Reviews error:", e);
      }
    }

    return res.status(200).json({
      found: true,
      multiple,
      note: multiple
        ? `Trovate più attività simili — mostro "${place.title}". Se non è quella giusta, aggiungi la città o l'indirizzo.`
        : null,
      name: place.title || query,
      address: place.address || null,
      phone: place.phone || null,
      website: place.website || null,
      mapsUrl: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
      rating: place.rating || null,
      reviewCount: place.reviews || null,
      reviews,
    });
  } catch (err) {
    console.error("SerpApi error:", err);
    return res.status(500).json({ error: "Errore nella ricerca." });
  }
}
