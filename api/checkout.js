// api/checkout.js — Vetrality: crea una sessione di pagamento Stripe Checkout
// La chiave segreta Stripe sta SOLO su Vercel (STRIPE_SECRET_KEY).
// L'app non tocca mai i dati della carta: il cliente paga sulla pagina Stripe.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Stripe non configurato." });

  // I prezzi creati nel cruscotto Stripe (Price ID), messi come variabili su Vercel.
  // Il frontend invia plan = "base" per il piano Pro (29€) e plan = "pro" per Business (59€).
  const PRICES = {
    base: process.env.STRIPE_PRICE_PRO,        // piano Pro — 29€/mese
    pro: process.env.STRIPE_PRICE_BUSINESS,    // piano Business — 59€/mese
  };

  try {
    const { plan, businessName, returnUrl } = req.body;
    const priceId = PRICES[plan];
    if (!priceId) return res.status(400).json({ error: "Piano non valido o prezzo non configurato." });

    // Chiamata diretta all'API Stripe (senza libreria, così non serve installare nulla)
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", (returnUrl || "https://vetrality.app") + "?pagamento=ok");
    params.append("cancel_url", (returnUrl || "https://vetrality.app") + "?pagamento=annullato");
    if (businessName) params.append("metadata[attivita]", businessName);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (session.error) return res.status(400).json({ error: session.error.message });

    // Restituiamo l'URL della pagina di pagamento Stripe
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Errore nella creazione del pagamento." });
  }
}
