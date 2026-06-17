// api/places.js — Vetrality: ricerca reale attività via Google Places API
// Trova il posto giusto (gestendo omonimi), prende nome, indirizzo,
// telefono, rating e recensioni reali di Google.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error: "Google API key non configurata." });

  try {
    const { query, city } = req.body;
    if (!query) return res.status(400).json({ error: "Manca il nome dell'attività." });

    // Costruisce il testo di ricerca includendo la città per disambiguare gli omonimi
    const searchText = city ? `${query} ${city}` : query;

    // 1. TEXT SEARCH — trova il posto giusto
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const searchRes = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        // Chiediamo solo i campi che ci servono (così costa meno)
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: searchText,
        languageCode: "it",
        regionCode: "IT",
      }),
    });

    const searchData = await searchRes.json();

    if (!searchData.places || searchData.places.length === 0) {
      return res.status(200).json({ found: false, note: "Nessuna attività trovata con questo nome. Controlla l'ortografia o aggiungi la città." });
    }

    // Se ci sono più risultati, è un possibile caso di omonimi
    const multiple = searchData.places.length > 1;
    const place = searchData.places[0];
    const placeId = place.id;

    // 2. PLACE DETAILS — prende le recensioni reali
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const detailsRes = await fetch(detailsUrl, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount,displayName",
      },
    });
    const details = await detailsRes.json();

    const reviews = (details.reviews || []).slice(0, 5).map((r) => ({
      author: r.authorAttribution?.displayName || "Anonimo",
      rating: r.rating,
      text: r.text?.text || r.originalText?.text || "",
      time: r.relativePublishTimeDescription || "",
    }));

    return res.status(200).json({
      found: true,
      multiple,
      note: multiple
        ? `Trovate più attività simili — mostro la più rilevante "${place.displayName?.text}". Se non è quella giusta, aggiungi la città o l'indirizzo.`
        : null,
      name: place.displayName?.text || query,
      address: place.formattedAddress || null,
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      mapsUrl: place.googleMapsUri || null,
      rating: place.rating || null,
      reviewCount: place.userRatingCount || null,
      reviews,
    });
  } catch (err) {
    console.error("Places error:", err);
    return res.status(500).json({ error: "Errore nella ricerca." });
  }
}
