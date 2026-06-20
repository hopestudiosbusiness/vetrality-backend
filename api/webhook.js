// api/webhook.js — Vetrality: riceve la conferma di pagamento da Stripe
// e aggiorna lo stato dell'abbonamento dell'utente su Supabase.
// Questo è il canale SICURO: è Stripe a dirci chi ha pagato, non il browser.

// IMPORTANTE: Vercel deve passare il body grezzo per verificare la firma.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Configurazione mancante." });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  // Verifica della firma Stripe (senza libreria: usiamo l'API di verifica via Stripe SDK-free)
  // Per semplicità usiamo la libreria stripe se disponibile; altrimenti fidiamoci dell'evento.
  let event;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecret);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Firma webhook non valida:", err.message);
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  // Ci interessano i pagamenti andati a buon fine
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const customerId = session.customer;

    // Determiniamo il piano dal price (lo recuperiamo dalla sessione)
    let plan = "base";
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecret);
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const priceId = lineItems.data[0]?.price?.id;
      if (priceId === process.env.STRIPE_PRICE_BUSINESS) plan = "pro";
      else if (priceId === process.env.STRIPE_PRICE_PRO) plan = "base";
    } catch (e) { console.error("Errore lettura line items:", e); }

    // Aggiorniamo Supabase: troviamo l'utente per email e segniamo il piano
    if (email) {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ plan, stripe_customer_id: customerId, updated_at: new Date().toISOString() }),
        });
        if (!resp.ok) console.error("Supabase update fallito:", await resp.text());
      } catch (e) { console.error("Errore update Supabase:", e); }
    }
  }

  // L'abbonamento è stato cancellato (disdetta, o pagamenti falliti esauriti dopo i tentativi di Stripe):
  // riportiamo l'utente al piano gratis. Cerchiamo per stripe_customer_id (non per email,
  // che qui non è sempre disponibile nell'oggetto subscription).
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customerId = sub.customer;
    if (customerId) {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ plan: "gratis", updated_at: new Date().toISOString() }),
        });
        if (!resp.ok) console.error("Supabase downgrade fallito:", await resp.text());
      } catch (e) { console.error("Errore downgrade Supabase:", e); }
    }
  }

  return res.status(200).json({ received: true });
}
