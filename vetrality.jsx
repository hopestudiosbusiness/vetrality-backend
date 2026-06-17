import { useState, useEffect } from "react";

const C = {
  orange: "#FF6B35", orangeL: "#FFF0EB", orangeM: "#FFD4C2",
  green: "#2ECC8A", greenL: "#E8FAF3",
  blue: "#4A90D9", blueL: "#EBF4FF",
  purple: "#8B5CF6", purpleL: "#F3EEFF",
  yellow: "#F5A623", yellowL: "#FEF9EC",
  dark: "#1A1A2E", gray: "#6B7280",
  grayL: "#F9FAFB", grayB: "#E5E7EB", white: "#FFFFFF",
};

const STORAGE_KEY = "vetrality_profile";
const loadProfile = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
};
const saveProfile = (p) => localStorage.setItem(STORAGE_KEY, JSON.stringify(p));

async function askClaude(systemPrompt, userMessage, maxTokens = 600) {
  const res = await fetch("https://vetrality-backend-xnn6.vercel.app/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

function buildSystem(profile) {
  if (!profile) return "Sei un assistente AI per attività locali italiane.";
  return `Sei l'assistente AI di "${profile.name}", ${profile.typeLabel} a ${profile.city}.
Tono di comunicazione: ${profile.tone}.
Valori dell'attività: ${profile.values}.
Staff: ${profile.staff?.map(s => s.name + " (" + s.role + ")").join(", ") || "non specificato"}.
Prodotti/servizi principali: ${profile.mainItems}.
Rispondi sempre in italiano rispettando il tono e i valori dell'attività.`;
}

// ── ONBOARDING ─────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: "ristorante", emoji: "🍕", label: "Ristorante / Pizzeria" },
  { id: "bar", emoji: "☕", label: "Bar / Caffetteria" },
  { id: "parrucchiere", emoji: "✂️", label: "Parrucchiere / Estetista" },
  { id: "hotel", emoji: "🏨", label: "Hotel / B&B" },
  { id: "negozio", emoji: "🛍️", label: "Negozio / Retail" },
  { id: "studio", emoji: "🏥", label: "Studio Professionale" },
];

const TONES = [
  { id: "caloroso e familiare", label: "😊 Caloroso e familiare" },
  { id: "professionale ed elegante", label: "👔 Professionale ed elegante" },
  { id: "giovane e dinamico", label: "⚡ Giovane e dinamico" },
  { id: "scherzoso e leggero", label: "😄 Scherzoso e leggero" },
];

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", city: "", type: "", typeLabel: "", tone: "", values: "", mainItems: "", staff: [] });
  const [newStaff, setNewStaff] = useState({ name: "", role: "" });
  const [loading, setLoading] = useState(false);

  const steps = ["La tua attività", "Il tuo stile", "Il tuo team", "Tutto pronto!"];

  const canNext = () => {
    if (step === 0) return form.name && form.city && form.type;
    if (step === 1) return form.tone && form.values && form.mainItems;
    return true;
  };

  const handleNext = async () => {
    if (step === 2) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      setLoading(false);
      setStep(3);
    } else if (step === 3) {
      saveProfile(form);
      onComplete(form);
    } else {
      setStep(s => s + 1);
    }
  };

  const addStaff = () => {
    if (!newStaff.name || !newStaff.role) return;
    setForm(f => ({ ...f, staff: [...f.staff, { ...newStaff }] }));
    setNewStaff({ name: "", role: "" });
  };

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: `1.5px solid ${C.grayB}`, fontSize: 15,
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", color: C.dark,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.orangeL} 0%, ${C.blueL} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 24, padding: "40px 36px",
        maxWidth: 520, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🪟</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, color: C.dark }}>Vetrality</div>
            <div style={{ fontSize: 11, color: C.gray, letterSpacing: "0.04em" }}>Porta in vita la tua vetrina</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? C.orange : C.grayB, transition: "background 0.3s" }} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Partiamo dalla tua attività 🏪</h2>
            <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>Claude userà queste info per personalizzare tutto.</p>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Nome dell'attività</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="Es. Pizzeria da Marco" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Città</label>
            <input style={{ ...inp, marginBottom: 20 }} placeholder="Es. Napoli" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>Tipo di attività</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BUSINESS_TYPES.map(bt => (
                <div key={bt.id} onClick={() => setForm(f => ({ ...f, type: bt.id, typeLabel: bt.label }))} style={{
                  border: `2px solid ${form.type === bt.id ? C.orange : C.grayB}`,
                  background: form.type === bt.id ? C.orangeL : C.white,
                  borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 20 }}>{bt.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{bt.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Come parli ai tuoi clienti? 💬</h2>
            <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>Claude imparerà il tuo stile e lo userà in ogni risposta.</p>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>Tono di comunicazione</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {TONES.map(t => (
                <div key={t.id} onClick={() => setForm(f => ({ ...f, tone: t.id }))} style={{
                  border: `2px solid ${form.tone === t.id ? C.orange : C.grayB}`,
                  background: form.tone === t.id ? C.orangeL : C.white,
                  borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                }}>{t.label}</div>
              ))}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Valori dell'attività</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="Es. qualità, tradizione, famiglia, freschezza" value={form.values} onChange={e => setForm(f => ({ ...f, values: e.target.value }))} />
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Prodotti / servizi principali</label>
            <input style={inp} placeholder="Es. pizza napoletana, fritti, dolci fatti in casa" value={form.mainItems} onChange={e => setForm(f => ({ ...f, mainItems: e.target.value }))} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Il tuo team 👥</h2>
            <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>Opzionale — Claude gestirà turni e messaggi sapendo chi c'è nel team.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Nome" value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} />
              <input style={{ ...inp, flex: 1 }} placeholder="Ruolo" value={newStaff.role} onChange={e => setNewStaff(s => ({ ...s, role: e.target.value }))} />
              <button onClick={addStaff} style={{ background: C.orange, color: C.white, border: "none", borderRadius: 12, padding: "0 18px", fontSize: 20, cursor: "pointer", fontWeight: 700 }}>+</button>
            </div>
            {form.staff.length === 0 && (
              <div style={{ background: C.grayL, borderRadius: 12, padding: 20, textAlign: "center", color: C.gray, fontSize: 14 }}>
                Nessun membro aggiunto — puoi farlo anche dopo.
              </div>
            )}
            {form.staff.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.grayL, borderRadius: 10, padding: "10px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.purpleL, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.purple, fontSize: 15 }}>{s.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: C.gray }}>{s.role}</div>
                  </div>
                </div>
                <button onClick={() => setForm(f => ({ ...f, staff: f.staff.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{form.name} è pronta!</h2>
            <p style={{ color: C.gray, fontSize: 15, marginBottom: 24 }}>Claude conosce la tua attività, il tuo stile e il tuo team. Da adesso lavora per te automaticamente.</p>
            <div style={{ background: C.grayL, borderRadius: 16, padding: 20, textAlign: "left", marginBottom: 24 }}>
              {[["🏪", "Attività", form.typeLabel], ["📍", "Città", form.city], ["💬", "Tono", form.tone], ["⭐", "Valori", form.values], ["👥", "Team", form.staff.length > 0 ? `${form.staff.length} persone` : "Da aggiungere"]].map(([icon, label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14 }}>
                  <span>{icon}</span><span style={{ color: C.gray, minWidth: 60 }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
          {step > 0 && step < 3 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1.5px solid ${C.grayB}`, background: C.white, fontSize: 15, fontWeight: 600, cursor: "pointer", color: C.gray }}>← Indietro</button>
          )}
          <button onClick={handleNext} disabled={!canNext() || loading} style={{
            flex: 2, padding: 14, borderRadius: 12, border: "none",
            background: !canNext() || loading ? C.grayB : C.orange,
            color: !canNext() || loading ? C.gray : C.white,
            fontSize: 15, fontWeight: 700, cursor: !canNext() || loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "✨ Claude sta analizzando..." : step === 3 ? "Entra in Vetrality →" : step === 2 ? "Crea il mio profilo AI" : "Continua →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DEMO LIVE ──────────────────────────────────────────────────
function DemoLive({ profile, onBack }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [sectionResults, setSectionResults] = useState({});
  const [loadingSection, setLoadingSection] = useState(null);

  const searchBusiness = async () => {
    if (!query.trim()) return;
    setSearching(true); setFound(null); setAnalysis(""); setSectionResults({});

    // Use Claude with web_search tool to find the real business
    try {
      const res = await fetch("https://vetrality-backend-xnn6.vercel.app/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `Sei un assistente che cerca informazioni su attività locali italiane online. Quando cerchi un'attività, trova: indirizzo reale, numero di telefono, rating Google, numero di recensioni Google, e se è presente su Instagram, Facebook, Tripadvisor, TheFork, Booking. Rispondi SOLO con un JSON valido con questa struttura:
{
  "name": "nome esatto trovato",
  "address": "indirizzo completo",
  "phone": "numero o null",
  "website": "sito o null",
  "google_rating": numero o null,
  "google_reviews": numero o null,
  "has_tripadvisor": true/false,
  "tripadvisor_rating": numero o null,
  "has_instagram": true/false,
  "instagram_followers": numero o null,
  "has_facebook": true/false,
  "facebook_followers": numero o null,
  "has_thefork": true/false,
  "thefork_rating": numero o null,
  "has_booking": true/false,
  "found": true/false,
  "note": "breve nota se ci sono omonimi o ambiguità"
}`,
          messages: [{ role: "user", content: `Cerca questa attività su Google e raccoglimi i dati: "${query}"${profile?.city ? ` a ${profile.city}` : ""}. Se ci sono omonimi segnalalo nel campo note. Rispondi solo con il JSON.` }],
        }),
      });
      const data = await res.json();
      const fullText = data.content?.map(b => b.text || "").join("") || "";
      const clean = fullText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      const mock = {
        name: parsed.name || query,
        address: parsed.address || `${profile?.city || ""}`,
        phone: parsed.phone || null,
        website: parsed.website || null,
        note: parsed.note || null,
        platforms: {
          google: { found: true, rating: parsed.google_rating, reviews: parsed.google_reviews },
          tripadvisor: { found: parsed.has_tripadvisor, rating: parsed.tripadvisor_rating },
          instagram: { found: parsed.has_instagram, followers: parsed.instagram_followers },
          facebook: { found: parsed.has_facebook, followers: parsed.facebook_followers },
          thefork: { found: parsed.has_thefork, rating: parsed.thefork_rating },
          booking: { found: parsed.has_booking },
        },
      };
      setFound(mock);
    } catch (e) {
      // Fallback se la ricerca reale fallisce
      const mock = {
        name: query,
        address: profile?.city ? `— ${profile.city}` : "Indirizzo non trovato",
        phone: null, website: null,
        note: "Non è stato possibile recuperare i dati reali. Controlla il nome e riprova.",
        platforms: {
          google: { found: false }, tripadvisor: { found: false },
          instagram: { found: false }, facebook: { found: false },
          thefork: { found: false }, booking: { found: false },
        },
      };
      setFound(mock);
    }

    setSearching(false);
    setAnalyzing(true);
    const r = await askClaude(
      "Sei un esperto di marketing digitale per attività locali italiane.",
      `Analizza la presenza online di "${query}" e dai 4 punti chiave su cosa manca e come Vetrality potrebbe aiutare. Usa emoji, sii diretto. Ogni punto su una riga separata.`,
      400
    );
    setAnalysis(r);
    setAnalyzing(false);
  };

  const runSection = async (id, label) => {
    setLoadingSection(id);
    const sys = buildSystem(profile);
    let prompt = "";
    if (id === "recensione") prompt = `Scrivi una risposta professionale per "${found?.name}" a questa recensione negativa: "Il servizio era lento e il cibo freddo. Deluso." Usa il tono dell'attività.`;
    if (id === "post") prompt = `Crea un post Instagram per "${found?.name}". Italiano, max 3 righe, emoji, 3-4 hashtag. Solo il testo.`;
    if (id === "menu") prompt = `Riscrivi questa voce di menu per "${found?.name}" in modo accattivante: "Pizza margherita con pomodoro e mozzarella". Max 3 righe.`;
    if (id === "staff") prompt = `Scrivi un messaggio allo staff di "${found?.name}": domani si apre un'ora prima perché arriva una comitiva di 30 persone. Professionale ma con il tono dell'attività.`;
    if (id === "whatsapp") prompt = `Scrivi una risposta WhatsApp automatica per "${found?.name}" a questa richiesta: "Ciao, avete tavoli disponibili sabato sera per 4 persone?" Cordiale e completa.`;
    const r = await askClaude(sys, prompt, 300);
    setSectionResults(prev => ({ ...prev, [id]: r }));
    setLoadingSection(null);
  };

  const PBadge = ({ name, icon, data }) => (
    <div style={{
      background: data?.found ? C.greenL : C.grayL,
      border: `1px solid ${data?.found ? C.green : C.grayB}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 11, color: data?.found ? C.green : C.gray }}>
          {data?.found ? (data.rating ? `⭐ ${data.rating}` : data.followers ? `${data.followers} follower` : "Trovato ✓") : "Non trovato"}
        </div>
      </div>
    </div>
  );

  const demoButtons = [
    { id: "recensione", icon: "⭐", label: "Rispondi a recensione negativa" },
    { id: "post", icon: "📱", label: "Crea post Instagram" },
    { id: "menu", icon: "🍽️", label: "Riscrivi voce del menu" },
    { id: "staff", icon: "👥", label: "Messaggio per lo staff" },
    { id: "whatsapp", icon: "💬", label: "Risposta WhatsApp automatica" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.grayL, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: C.dark, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Torna</button>
        <span style={{ fontWeight: 800, fontSize: 18, color: C.white }}>🔍 Vetrality — Demo Live</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Cerca un'attività reale e vedi Vetrality all'opera</span>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: 24 }}>
        <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}`, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>🏪 Cerca l'attività del tuo cliente</h2>
          <p style={{ color: C.gray, fontSize: 14, marginBottom: 20 }}>Digita il nome — Vetrality analizza automaticamente Google, Instagram, Tripadvisor, TheFork e altri.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${C.grayB}`, fontSize: 15, fontFamily: "inherit", outline: "none", color: C.dark }}
              placeholder="Es. Ristorante La Pergola Roma"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchBusiness()}
            />
            <button onClick={searchBusiness} disabled={searching || !query.trim()} style={{
              background: searching || !query.trim() ? C.grayB : C.orange,
              color: searching || !query.trim() ? C.gray : C.white,
              border: "none", borderRadius: 12, padding: "0 24px",
              fontSize: 15, fontWeight: 700, cursor: searching || !query.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            }}>
              {searching ? "Cercando..." : "Analizza 🔍"}
            </button>
          </div>
        </div>

        {found && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Business card */}
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{found.name}</h3>
                  <div style={{ color: C.gray, fontSize: 14 }}>📍 {found.address}</div>
                  {found.phone && <div style={{ color: C.gray, fontSize: 14 }}>📞 {found.phone}</div>}
                  {found.website && <div style={{ color: C.blue, fontSize: 14 }}>🌐 {found.website}</div>}
                  {found.note && (
                    <div style={{ marginTop: 8, background: C.yellowL, border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.dark }}>
                      ⚠️ {found.note}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: found.platforms.google?.rating >= 4 ? C.green : C.yellow }}>
                    {found.platforms.google?.rating ? `${found.platforms.google.rating}★` : "N/D"}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray }}>{found.platforms.google?.reviews ? `${found.platforms.google.reviews} rec.` : "Google"}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 12 }}>PIATTAFORME ANALIZZATE</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                <PBadge name="Google" icon="🔵" data={found.platforms.google} />
                <PBadge name="Tripadvisor" icon="🦉" data={found.platforms.tripadvisor} />
                <PBadge name="Instagram" icon="📸" data={found.platforms.instagram} />
                <PBadge name="Facebook" icon="👤" data={found.platforms.facebook} />
                <PBadge name="TheFork" icon="🍴" data={found.platforms.thefork} />
                <PBadge name="Booking" icon="🛏️" data={found.platforms.booking} />
              </div>
            </div>

            {/* AI Analysis */}
            <div style={{ background: C.dark, borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>✨ ANALISI AUTOMATICA DI CLAUDE</div>
              {analyzing
                ? <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Claude sta analizzando la presenza online...</div>
                : <div style={{ color: C.white, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line" }}>{analysis}</div>
              }
            </div>

            {/* Live demos */}
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>🎯 Prova le funzioni in diretta</h3>
              <p style={{ color: C.gray, fontSize: 13, marginBottom: 20 }}>Clicca e vedi cosa farebbe Vetrality per questa attività — generato da Claude in tempo reale.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
                {demoButtons.map(btn => (
                  <button key={btn.id} onClick={() => runSection(btn.id)} disabled={loadingSection === btn.id} style={{
                    background: sectionResults[btn.id] ? C.orangeL : C.grayL,
                    border: `2px solid ${sectionResults[btn.id] ? C.orange : C.grayB}`,
                    borderRadius: 12, padding: "14px 16px", cursor: loadingSection === btn.id ? "not-allowed" : "pointer",
                    textAlign: "left", fontSize: 13, fontWeight: 600, color: C.dark, transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{btn.icon}</div>
                    {loadingSection === btn.id ? "✨ Claude scrive..." : btn.label}
                    {sectionResults[btn.id] && <div style={{ fontSize: 10, color: C.orange, marginTop: 4 }}>✓ Generato</div>}
                  </button>
                ))}
              </div>
              {Object.entries(sectionResults).map(([key, val]) => val && (
                <div key={key} style={{ background: C.orangeL, border: `1.5px solid ${C.orangeM}`, borderRadius: 14, padding: 18, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 8 }}>✨ {demoButtons.find(b => b.id === key)?.icon} {demoButtons.find(b => b.id === key)?.label}</div>
                  <p style={{ fontSize: 14, color: C.dark, margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────
function Dashboard({ profile, onDemo, onReset }) {
  const [tab, setTab] = useState("home");
  const [reviewText, setReviewText] = useState(""); const [reviewResult, setReviewResult] = useState(""); const [loadingReview, setLoadingReview] = useState(false);
  const [reviewEval, setReviewEval] = useState(null); const [loadingEval, setLoadingEval] = useState(false);
  const [postResult, setPostResult] = useState(""); const [loadingPost, setLoadingPost] = useState(false);
  const [staffMsg, setStaffMsg] = useState(""); const [staffResult, setStaffResult] = useState(""); const [loadingStaff, setLoadingStaff] = useState(false);

  const sys = buildSystem(profile);

  const genReview = async () => {
    setLoadingReview(true);
    setReviewEval(null);
    const r = await askClaude(sys, `Rispondi a questa recensione con il tono dell'attività: "${reviewText}"`);
    setReviewResult(r);
    setLoadingReview(false);
    // Auto-evaluate the generated response
    setLoadingEval(true);
    const evalPrompt = `Valuta questa risposta a una recensione per un'attività locale italiana.
Recensione originale: "${reviewText}"
Risposta generata: "${r}"
Dammi una valutazione strutturata in JSON con questo formato esatto:
{
  "voto": <numero da 1 a 10>,
  "punti_forza": ["punto1", "punto2"],
  "criticita": ["critica1", "critica2"],
  "suggerimento": "come migliorarla in una frase"
}
Rispondi SOLO con il JSON, nient'altro.`;
    const evalRaw = await askClaude("Sei un esperto di customer care e reputazione online per attività locali italiane.", evalPrompt, 400);
    try {
      const clean = evalRaw.replace(/```json|```/g, "").trim();
      setReviewEval(JSON.parse(clean));
    } catch { setReviewEval(null); }
    setLoadingEval(false);
  };
  const genPost = async () => { setLoadingPost(true); const r = await askClaude(sys, `Crea un post Instagram per questa settimana. Italiano, max 3 righe, emoji, hashtag. Solo il testo.`); setPostResult(r); setLoadingPost(false); };
  const genStaff = async () => { setLoadingStaff(true); const r = await askClaude(sys, `Riscrivi questo messaggio per lo staff in modo professionale e con il tono dell'attività: "${staffMsg}"`); setStaffResult(r); setLoadingStaff(false); };

  const tabs = [{ id: "home", label: "🏠 Home" }, { id: "recensioni", label: "⭐ Recensioni" }, { id: "social", label: "📱 Social" }, { id: "staff", label: "👥 Staff" }];

  const Btn = ({ onClick, disabled, loading, children, color = C.orange }) => (
    <button onClick={onClick} disabled={disabled || loading} style={{
      background: disabled || loading ? C.grayB : color,
      color: disabled || loading ? C.gray : C.white,
      border: "none", borderRadius: 10, padding: "11px 20px",
      fontSize: 14, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer",
    }}>{loading ? "✨ Claude sta scrivendo..." : children}</button>
  );

  const ResultBox = ({ text, color = C.green, colorL = C.greenL }) => !text ? null : (
    <div style={{ background: colorL, border: `1.5px solid ${color}`, borderRadius: 14, padding: 18, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8 }}>✨ GENERATO DA CLAUDE — con la voce di {profile?.name}</div>
      <p style={{ fontSize: 14, color: C.dark, margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{text}</p>
    </div>
  );

  const TA = ({ value, onChange, placeholder }) => (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
      width: "100%", minHeight: 90, borderRadius: 12,
      border: `1.5px solid ${C.grayB}`, padding: 14, fontSize: 14,
      fontFamily: "inherit", resize: "vertical", outline: "none",
      boxSizing: "border-box", color: C.dark,
    }} />
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: C.grayL, minHeight: "100vh" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.grayB}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🪟</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: C.dark, lineHeight: 1.1 }}>Vetrality</div>
            <div style={{ fontSize: 9, color: C.gray, letterSpacing: "0.04em" }}>Porta in vita la tua vetrina</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onDemo} style={{ background: C.dark, color: C.white, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🔍 Demo Live</button>
          <div style={{ background: C.orangeL, border: `1px solid ${C.orangeM}`, borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: C.orange }}>{profile?.name}</div>
        </div>
      </div>

      <div style={{ background: C.white, borderBottom: `1px solid ${C.grayB}`, padding: "0 20px", display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.orange : C.gray,
            borderBottom: tab === t.id ? `2px solid ${C.orange}` : "2px solid transparent",
            whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: 20 }}>

        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #2D2D5E 100%)`, borderRadius: 20, padding: 28, color: C.white }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>PROFILO SALVATO IN MEMORIA</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{profile?.name} {profile?.type === "ristorante" ? "🍕" : profile?.type === "bar" ? "☕" : profile?.type === "parrucchiere" ? "✂️" : "✨"}</h2>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>📍 {profile?.city} · Tono: {profile?.tone} · 👥 {profile?.staff?.length || 0} nel team</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                <strong style={{ color: C.orange }}>Claude conosce la tua voce.</strong> Ogni risposta rifletterà i tuoi valori: <em>{profile?.values}</em> e il tuo tono <em>{profile?.tone}</em>.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { icon: "⭐", val: "4.2", label: "Rating medio", color: C.yellow, colorL: C.yellowL },
                { icon: "📱", val: "8", label: "Post questo mese", color: C.blue, colorL: C.blueL },
                { icon: "👥", val: profile?.staff?.length || 0, label: "Staff registrato", color: C.purple, colorL: C.purpleL },
              ].map(s => (
                <div key={s.label} style={{ background: s.colorL, borderRadius: 16, padding: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.dark }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>💡 Cosa puoi fare adesso</h3>
              <p style={{ color: C.gray, fontSize: 13, marginBottom: 0 }}>
                Usa le tab in alto per <strong>rispondere a recensioni</strong>, <strong>generare post social</strong> e <strong>comunicare con lo staff</strong> — tutto con la voce di {profile?.name}. Oppure premi <strong>Demo Live</strong> per mostrare Vetrality a un nuovo cliente.
              </p>
            </div>

            <button onClick={onReset} style={{ background: "none", border: `1px solid ${C.grayB}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, color: C.gray, cursor: "pointer" }}>
              ↩ Riconfigura profilo
            </button>
          </div>
        )}

        {tab === "recensioni" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Rispondi alle recensioni ⭐</h2>
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <p style={{ color: C.gray, fontSize: 14, marginBottom: 16 }}>Incolla una recensione — Claude risponde con il tono di <strong>{profile?.name}</strong> e valuta automaticamente la qualità della risposta.</p>
              <TA value={reviewText} onChange={setReviewText} placeholder={`Es. "Pizza fredda e attesa lunghissima. Non ci tornerò."`} />
              <div style={{ marginTop: 12 }}><Btn onClick={genReview} disabled={!reviewText.trim()} loading={loadingReview}>✨ Genera risposta con Claude</Btn></div>
              <ResultBox text={reviewResult} color={C.green} colorL={C.greenL} />
            </div>

            {/* AI Evaluation */}
            {(loadingEval || reviewEval) && (
              <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔍</span> Valutazione AI della risposta
                </div>
                {loadingEval && <div style={{ color: C.gray, fontSize: 14 }}>✨ Claude sta valutando la risposta...</div>}
                {reviewEval && (
                  <div>
                    {/* Score */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: reviewEval.voto >= 8 ? C.greenL : reviewEval.voto >= 6 ? C.yellowL : C.redL,
                        border: `3px solid ${reviewEval.voto >= 8 ? C.green : reviewEval.voto >= 6 ? C.yellow : C.red}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 900,
                        color: reviewEval.voto >= 8 ? C.green : reviewEval.voto >= 6 ? C.yellow : C.red,
                      }}>{reviewEval.voto}/10</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {reviewEval.voto >= 8 ? "Ottima risposta! 🎉" : reviewEval.voto >= 6 ? "Buona, ma si può migliorare" : "Necessita miglioramenti"}
                        </div>
                        <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>Valutazione automatica di Claude</div>
                      </div>
                    </div>

                    {/* Punti forza */}
                    {reviewEval.punti_forza?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 8 }}>✅ PUNTI DI FORZA</div>
                        {reviewEval.punti_forza.map((p, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6, color: C.dark }}>
                            <span style={{ color: C.green, flexShrink: 0 }}>●</span> {p}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Criticità */}
                    {reviewEval.criticita?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ CRITICITÀ</div>
                        {reviewEval.criticita.map((c, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6, color: C.dark }}>
                            <span style={{ color: C.red, flexShrink: 0 }}>●</span> {c}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggerimento */}
                    {reviewEval.suggerimento && (
                      <div style={{ background: C.blueL, border: `1px solid ${C.blue}`, borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 6 }}>💡 COME MIGLIORARLA</div>
                        <div style={{ fontSize: 13, color: C.dark }}>{reviewEval.suggerimento}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "social" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Social Media 📱</h2>
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <p style={{ color: C.gray, fontSize: 14, marginBottom: 20 }}>Claude genera post con la voce di <strong>{profile?.name}</strong> — valori: <em>{profile?.values}</em>, tono: <em>{profile?.tone}</em>.</p>
              <Btn onClick={genPost} loading={loadingPost} color={C.blue}>✨ Genera post Instagram</Btn>
              <ResultBox text={postResult} color={C.blue} colorL={C.blueL} />
            </div>
          </div>
        )}

        {tab === "staff" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Gestione Staff 👥</h2>
            {profile?.staff?.length > 0 && (
              <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Team di {profile.name}</h3>
                {profile.staff.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < profile.staff.length - 1 ? `1px solid ${C.grayB}` : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.purpleL, color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{s.name[0]}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div><div style={{ fontSize: 12, color: C.gray }}>{s.role}</div></div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1px solid ${C.grayB}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📢 Messaggio allo staff</h3>
              <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>Scrivi come ti viene — Claude lo riscrive con il tono di <strong>{profile?.name}</strong> e lo invia al team.</p>
              <TA value={staffMsg} onChange={setStaffMsg} placeholder={`Es. "domani apriamo un'ora prima per una comitiva"`} />
              <div style={{ marginTop: 12 }}><Btn onClick={genStaff} disabled={!staffMsg.trim()} loading={loadingStaff} color={C.purple}>✨ Riscrivi e invia con Claude</Btn></div>
              <ResultBox text={staffResult} color={C.purple} colorL={C.purpleL} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = loadProfile();
    if (saved) { setProfile(saved); setScreen("dashboard"); }
    else setScreen("onboarding");
  }, []);

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.grayL, gap: 8 }}>
      <div style={{ fontSize: 40 }}>🪟</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: C.dark }}>Vetrality</div>
      <div style={{ fontSize: 12, color: C.gray }}>Porta in vita la tua vetrina</div>
    </div>
  );
  if (screen === "onboarding") return <Onboarding onComplete={p => { setProfile(p); setScreen("dashboard"); }} />;
  if (screen === "demo") return <DemoLive profile={profile} onBack={() => setScreen("dashboard")} />;
  return <Dashboard profile={profile} onDemo={() => setScreen("demo")} onReset={() => { localStorage.removeItem(STORAGE_KEY); setProfile(null); setScreen("onboarding"); }} />;
}
