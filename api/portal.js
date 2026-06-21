// api/portal.js — Vetrality: apre il "Customer Portal" di Stripe per chi ha
// già un abbonamento attivo, così può cambiare piano, aggiornare il metodo
// di pagamento o disdire SENZA creare un secondo abbonamento parallelo.
// (Creare una nuova Checkout Session per chi è già abbonato creerebbe un
// abbonamento aggiuntivo invece di sostituire quello esistente — è per
// questo che il cambio piano per chi è già cliente passa da qui.)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Stripe non configurato." });

  try {
    const { customerId, returnUrl } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: "Nessun abbonamento Stripe trovato per questo account." });
    }

    const params = new URLSearchParams();
    params.append("customer", customerId);
    params.append("return_url", returnUrl || "https://vetrality.app");

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (session.error) return res.status(400).json({ error: session.error.message });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return res.status(500).json({ error: "Errore nell'apertura della gestione abbonamento." });
  }
}
