// /api/send-email.js — Vercel Function pour envoyer les emails du Simulateur MaPrimeAdapt' via Resend

const escape = (s) => String(s || "").replace(/[<>&"']/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]));

// Couleurs selon niveau d'éligibilité
const eligColor = (label) => {
  if (label.includes("très modeste")) return { bg: "#E8F5E9", c: "#0F766E", emoji: "🎉" };
  if (label.includes("modeste")) return { bg: "#FFF6E0", c: "#E9552E", emoji: "✨" };
  return { bg: "#F8F6F4", c: "#6B7280", emoji: "ℹ️" };
};

// ── Template HTML email INTERNE (notification Vivalea) ───────────────
function buildInternalEmail(d) {
  const elig = eligColor(d.sim_eligibilite);
  return `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Nouveau lead MaPrimeAdapt'</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#F8F6F4;color:#18263F;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;">
  <div style="background:#8F1349;color:#FFF;padding:24px 28px;">
    <div style="font-size:11px;letter-spacing:0.15em;opacity:0.8;text-transform:uppercase;margin-bottom:6px;">Nouveau lead · MaPrimeAdapt'</div>
    <div style="font-size:22px;font-weight:700;">${escape(d.lead_nom)}</div>
    <div style="font-size:13px;opacity:0.9;margin-top:4px;">${escape(d.sim_departement)} · ${escape(d.sim_age)}</div>
  </div>
  
  <div style="padding:24px 28px;border-bottom:1px solid #E8E2DD;background:${elig.bg};">
    <div style="font-size:11px;color:${elig.c};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">${elig.emoji} Résultat éligibilité</div>
    <div style="font-size:24px;font-weight:700;color:${elig.c};">${escape(d.sim_eligibilite)}</div>
  </div>
  
  <div style="padding:24px 28px;border-bottom:1px solid #E8E2DD;">
    <div style="font-size:11px;color:#8F1349;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">📇 Coordonnées du lead</div>
    <table style="width:100%;font-size:13px;line-height:1.7;">
      <tr><td style="color:#6B7280;width:140px;">Nom</td><td><strong>${escape(d.lead_nom)}</strong></td></tr>
      <tr><td style="color:#6B7280;">Téléphone</td><td><a href="tel:${escape(d.lead_telephone)}" style="color:#8F1349;text-decoration:none;"><strong>${escape(d.lead_telephone)}</strong></a></td></tr>
      <tr><td style="color:#6B7280;">Email</td><td><a href="mailto:${escape(d.lead_email)}" style="color:#8F1349;">${escape(d.lead_email)}</a></td></tr>
      <tr><td style="color:#6B7280;">Source</td><td>${escape(d.lead_source)}</td></tr>
    </table>
  </div>
  
  <div style="padding:24px 28px;border-bottom:1px solid #E8E2DD;">
    <div style="font-size:11px;color:#8F1349;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">🏠 Profil de la simulation</div>
    <table style="width:100%;font-size:13px;line-height:1.7;">
      <tr><td style="color:#6B7280;width:200px;">Âge</td><td>${escape(d.sim_age)}</td></tr>
      <tr><td style="color:#6B7280;">Statut occupation logement</td><td>${escape(d.sim_statut)}</td></tr>
      <tr><td style="color:#6B7280;">Département</td><td>${escape(d.sim_departement)}</td></tr>
      <tr><td style="color:#6B7280;">Personnes occupant le foyer</td><td>${escape(d.sim_occupants)}</td></tr>
      <tr><td style="color:#6B7280;">Tranche de revenus</td><td>${escape(d.sim_revenus)}</td></tr>
    </table>
  </div>
  
  <div style="padding:18px 28px;background:#18263F;color:#FFFFFF;text-align:center;font-size:11px;opacity:0.85;">
    Vivalea · Lead capturé depuis le simulateur MaPrimeAdapt'<br/>
    Reçu le ${escape(d.timestamp)}
  </div>
</div>
</body></html>`;
}

// ── Template HTML email PROSPECT (récap simple) ──────────────────────
function buildProspectEmail(d) {
  const elig = eligColor(d.sim_eligibilite);
  
  let message;
  if (d.sim_eligibilite.includes("très modeste") || d.sim_eligibilite.includes("modeste")) {
    message = `<strong>Bonne nouvelle :</strong> selon les éléments que vous nous avez transmis, vous semblez éligible à l'aide MaPrimeAdapt' pour vos travaux d'adaptation du logement.<br/><br/>Un conseiller Vivalea vous recontactera dans les meilleurs délais pour faire le point ensemble, gratuitement et sans engagement.`;
  } else {
    message = `Selon les éléments transmis, vous ne semblez pas éligible à MaPrimeAdapt' aujourd'hui. Mais d'autres aides existent peut-être pour votre situation.<br/><br/>Un conseiller Vivalea fera le point avec vous gratuitement sur toutes les options possibles.`;
  }
  
  return `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Votre simulation MaPrimeAdapt'</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#F8F6F4;color:#18263F;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;">
  <div style="background:#FFFFFF;color:#18263F;padding:32px 28px;text-align:center;border-bottom:1px solid #E8E2DD;">
    <div style="font-size:28px;font-family:'DM Serif Display',Georgia,serif;color:#8F1349;letter-spacing:-0.01em;">Vivalea <span style="font-size:11px;color:#6B7280;letter-spacing:0.15em;text-transform:uppercase;">Adapt</span></div>
    <div style="font-size:14px;color:#6B7280;margin-top:6px;">Votre simulation MaPrimeAdapt'</div>
  </div>
  
  <div style="padding:32px 28px;">
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${escape(d.lead_nom)},</p>
    
    <p style="font-size:15px;line-height:1.6;color:#18263F;margin:0 0 24px;">Merci d'avoir réalisé votre simulation d'éligibilité à <strong>MaPrimeAdapt'</strong>.</p>
    
    <div style="background:${elig.bg};border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <div style="font-size:12px;color:${elig.c};font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">${elig.emoji} Résultat de votre simulation</div>
      <div style="font-size:24px;font-weight:700;color:${elig.c};">${escape(d.sim_eligibilite)}</div>
    </div>
    
    <p style="font-size:15px;line-height:1.6;color:#18263F;margin:0 0 24px;">${message}</p>
    
    <div style="background:#F8F6F4;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:11px;color:#8F1349;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Récapitulatif de votre simulation</div>
      <table style="width:100%;font-size:13px;line-height:1.7;">
        <tr><td style="color:#6B7280;width:200px;">Âge</td><td>${escape(d.sim_age)}</td></tr>
        <tr><td style="color:#6B7280;">Statut logement</td><td>${escape(d.sim_statut)}</td></tr>
        <tr><td style="color:#6B7280;">Département</td><td>${escape(d.sim_departement)}</td></tr>
        <tr><td style="color:#6B7280;">Foyer</td><td>${escape(d.sim_occupants)} personne(s)</td></tr>
      </table>
    </div>
    
    <p style="font-size:13px;line-height:1.6;color:#6B7280;margin:0;">À très bientôt,<br/><strong style="color:#18263F;">L'équipe Vivalea</strong></p>
  </div>
  
  <div style="padding:18px 28px;background:#18263F;color:#FFFFFF;text-align:center;font-size:11px;opacity:0.85;">
    Vivalea · Entreprise à impact et ESS · Simulation indicative, non contractuelle.<br/>
    Vos données sont traitées de manière confidentielle.
  </div>
</div>
</body></html>`;
}

// ── Handler principal ───────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS pour iframe embed Webflow
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const data = req.body;
  if (!data || !data.lead_email || !data.lead_nom) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  
  const FROM = process.env.RESEND_FROM || "Vivalea Adapt <onboarding@resend.dev>";
  const INTERNAL_TO = process.env.INTERNAL_EMAIL || "ctsilefa@vivalea.fr";
  
  try {
    // 1️⃣ Email interne (notification Vivalea)
    const internalRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [INTERNAL_TO],
        reply_to: data.lead_email,
        subject: `🏠 Nouveau lead MaPrimeAdapt' — ${data.lead_nom} (${data.sim_eligibilite})`,
        html: buildInternalEmail(data),
      }),
    });
    
    const internalResult = await internalRes.json();
    if (!internalRes.ok) {
      console.error("Internal email failed:", internalResult);
      return res.status(500).json({ error: "Internal email failed", details: internalResult });
    }
    
    // 2️⃣ Email prospect (récap)
    const prospectRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [data.lead_email],
        reply_to: INTERNAL_TO,
        subject: `Votre simulation MaPrimeAdapt' — Vivalea`,
        html: buildProspectEmail(data),
      }),
    });
    
    const prospectResult = await prospectRes.json();
    if (!prospectRes.ok) {
      console.warn("Prospect email failed:", prospectResult);
      return res.status(200).json({ ok: true, prospectFailed: true, details: prospectResult });
    }
    
    return res.status(200).json({ ok: true, internalId: internalResult.id, prospectId: prospectResult.id });
  } catch (err) {
    console.error("Send error:", err);
    return res.status(500).json({ error: err.message });
  }
}
