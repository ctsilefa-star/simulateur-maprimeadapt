// /api/send-email.js — Vercel Function pour MaPrimeAdapt (Resend + notif.vivalea.fr)
// Templates harmonisés avec le Diagnostic Coût Aidant (même structure, mêmes couleurs)

const esc = (s) => String(s || "").replace(/[<>&"']/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]));

const C = {
  magenta: "#8F1349", navy: "#18263F", orange: "#E9552E",
  green: "#0F766E", red: "#DC2626",
  bg: "#F8F6F4", border: "#E8E2DD", muted: "#6B7280",
  white: "#FFFFFF", cream: "#FFF1E4",
};

// Couleurs selon niveau d'éligibilité
const eligColors = (label) => {
  if (label.includes("très modeste")) return { c: C.green, bg: "#E6F5F0", emoji: "🎉", short: "Éligible" };
  if (label.includes("modeste") && !label.includes("Non")) return { c: C.orange, bg: "#FFF1E4", emoji: "✨", short: "Éligible" };
  return { c: C.muted, bg: C.bg, emoji: "ℹ️", short: "À étudier" };
};

const header = (badge, title, subtitle) => `
  <div style="background:${C.magenta};color:${C.white};padding:28px 32px;">
    <div style="font-size:11px;letter-spacing:0.18em;opacity:0.75;text-transform:uppercase;margin-bottom:10px;">${esc(badge)}</div>
    <div style="font-size:24px;font-weight:700;line-height:1.2;">${esc(title)}</div>
    ${subtitle ? `<div style="font-size:13px;opacity:0.9;margin-top:6px;">${esc(subtitle)}</div>` : ""}
  </div>`;

const section = (icon, title, content, bgColor = "transparent") => `
  <div style="padding:24px 32px;border-bottom:1px solid ${C.border};${bgColor !== "transparent" ? `background:${bgColor};` : ""}">
    <div style="font-size:11px;color:${C.magenta};font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">${icon} ${esc(title)}</div>
    ${content}
  </div>`;

const row = (label, value, options = {}) => `
  <tr>
    <td style="color:${C.muted};width:200px;padding:3px 0;vertical-align:top;">${esc(label)}</td>
    <td style="padding:3px 0;${options.bold ? "font-weight:700;" : ""}${options.color ? `color:${options.color};` : ""}">${options.raw ? value : esc(value || "—")}</td>
  </tr>`;

const table = (rows) => `<table style="width:100%;font-size:13px;line-height:1.6;">${rows}</table>`;

const footer = (subline) => `
  <div style="padding:20px 32px;background:${C.navy};color:${C.white};text-align:center;font-size:11px;line-height:1.6;">
    <div style="opacity:0.95;font-weight:600;letter-spacing:0.05em;">Vivalea · Entreprise à impact et ESS</div>
    <div style="opacity:0.7;margin-top:4px;">${esc(subline)}</div>
  </div>`;

const kpiCard = (label, value, color) => `
  <div style="flex:1;background:${C.white};padding:16px 14px;border-radius:10px;border:1px solid ${C.border};text-align:center;">
    <div style="font-size:11px;color:${C.muted};margin-bottom:6px;">${esc(label)}</div>
    <div style="font-size:18px;font-weight:700;color:${color};line-height:1.3;">${esc(value)}</div>
  </div>`;

// ── EMAIL INTERNE ────────────────────────────────────────────────────
function buildInternalEmail(d) {
  const elig = eligColors(d.sim_eligibilite);
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Nouveau lead MaPrimeAdapt'</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:${C.bg};color:${C.navy};">
<div style="max-width:640px;margin:0 auto;background:${C.white};">
  ${header("Nouveau lead · MaPrimeAdapt'", d.lead_nom, `${d.sim_departement} · ${d.sim_age}`)}
  <div style="padding:24px 32px;border-bottom:1px solid ${C.border};background:${C.bg};">
    <div style="display:flex;gap:10px;">
      ${kpiCard("Résultat", elig.short, elig.c)}
      ${kpiCard("Département", d.sim_departement, C.magenta)}
      ${kpiCard("Foyer", `${esc(d.sim_occupants)} pers.`, C.navy)}
    </div>
  </div>
  <div style="padding:20px 32px;background:${elig.bg};border-bottom:1px solid ${C.border};text-align:center;">
    <div style="font-size:11px;color:${elig.c};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">${elig.emoji} Statut d'éligibilité</div>
    <div style="font-size:22px;font-weight:700;color:${elig.c};">${esc(d.sim_eligibilite)}</div>
  </div>
  ${section("📇", "Coordonnées du lead", table(
    row("Nom", d.lead_nom, {bold: true}) +
    row("Téléphone", `<a href="tel:${esc(d.lead_telephone)}" style="color:${C.magenta};text-decoration:none;font-weight:700;">${esc(d.lead_telephone)}</a>`, {raw: true}) +
    row("Email", `<a href="mailto:${esc(d.lead_email)}" style="color:${C.magenta};text-decoration:none;">${esc(d.lead_email)}</a>`, {raw: true}) +
    row("Source", d.lead_source)
  ))}
  ${section("🏠", "Profil de la simulation", table(
    row("Âge", d.sim_age, {bold: true}) +
    row("Statut occupation logement", d.sim_statut) +
    row("Département", d.sim_departement) +
    row("Personnes occupant le foyer", d.sim_occupants) +
    row("Tranche de revenus", d.sim_revenus)
  ))}
  ${footer(`Lead capturé le ${esc(d.timestamp)}`)}
</div>
</body></html>`;
}

// ── EMAIL PROSPECT (récap complet) ───────────────────────────────────
function buildProspectEmail(d) {
  const elig = eligColors(d.sim_eligibilite);
  
  let message;
  if (d.sim_eligibilite.includes("très modeste") || (d.sim_eligibilite.includes("modeste") && !d.sim_eligibilite.includes("Non"))) {
    message = `<strong>Bonne nouvelle :</strong> selon les éléments que vous nous avez transmis, vous semblez éligible à l'aide <strong>MaPrimeAdapt'</strong> pour vos travaux d'adaptation du logement.<br/><br/>Un conseiller Vivalea vous recontactera dans les meilleurs délais pour faire le point ensemble, gratuitement et sans engagement.`;
  } else {
    message = `Selon les éléments que vous nous avez transmis, vous ne semblez pas éligible à MaPrimeAdapt' aujourd'hui. Mais d'autres aides existent peut-être pour votre situation.<br/><br/>Un conseiller Vivalea fera le point avec vous gratuitement sur toutes les options possibles.`;
  }
  
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Votre simulation MaPrimeAdapt'</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:${C.bg};color:${C.navy};">
<div style="max-width:640px;margin:0 auto;background:${C.white};">
  ${header("Votre simulation personnalisée", "Vivalea Adapt", `Merci ${d.lead_nom}, voici votre résultat`)}
  <div style="padding:28px 32px;border-bottom:1px solid ${C.border};background:${elig.bg};text-align:center;">
    <div style="font-size:12px;color:${elig.c};font-weight:700;margin-bottom:8px;letter-spacing:0.1em;text-transform:uppercase;">${elig.emoji} Résultat de votre simulation</div>
    <div style="font-size:26px;font-weight:700;color:${elig.c};line-height:1.2;">${esc(d.sim_eligibilite)}</div>
  </div>
  <div style="padding:24px 32px;font-size:15px;line-height:1.6;color:${C.navy};border-bottom:1px solid ${C.border};">
    <p style="margin:0 0 12px;">Bonjour ${esc(d.lead_nom)},</p>
    <p style="margin:0;">${message}</p>
  </div>
  ${section("📋", "Récapitulatif de votre saisie", table(
    row("Âge", d.sim_age, {bold: true}) +
    row("Statut logement", d.sim_statut) +
    row("Département", d.sim_departement) +
    row("Personnes au foyer", `${esc(d.sim_occupants)} personne(s)`) +
    row("Tranche de revenus", d.sim_revenus)
  ))}
  ${section("ℹ️", "À propos de MaPrimeAdapt'", `
    <div style="font-size:13px;line-height:1.6;color:${C.navy};">
      MaPrimeAdapt' est une aide de l'État destinée à financer les travaux d'adaptation du logement pour les personnes âgées ou en situation de handicap. Elle peut couvrir jusqu'à <strong>70% du montant des travaux</strong> (plafonnés à 22 000 €), avec une bonification possible pour les ménages très modestes.
      <div style="font-size:12px;color:${C.muted};margin-top:10px;">📎 Source : Service-Public.fr · MaPrimeAdapt' 2024</div>
    </div>
  `, C.bg)}
  <div style="padding:28px 32px;text-align:center;">
    <a href="https://calendly.com/vivalea" style="display:inline-block;background:${C.magenta};color:${C.white};padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Échanger avec un conseiller Vivalea →</a>
    <div style="font-size:11px;color:${C.muted};margin-top:10px;">30 min · Gratuit · Sans engagement</div>
  </div>
  <div style="padding:0 32px 28px;font-size:13px;line-height:1.6;color:${C.muted};">
    À très bientôt,<br/>
    <strong style="color:${C.navy};">L'équipe Vivalea</strong>
  </div>
  ${footer("Simulation indicative, non contractuelle · Vos données sont traitées de manière confidentielle.")}
</div>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const data = req.body;
  if (!data || !data.lead_email || !data.lead_nom) return res.status(400).json({ error: "Missing required fields" });
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  const FROM = process.env.RESEND_FROM || "Vivalea Adapt <onboarding@resend.dev>";
  const INTERNAL_TO = process.env.INTERNAL_EMAIL || "ctsilefa@vivalea.fr";
  
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  
  async function sendEmail(payload, label) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await resp.json();
    console.log(`[${label}] status=${resp.status} result=${JSON.stringify(result)}`);
    return { ok: resp.ok, status: resp.status, result };
  }
  
  try {
    // 1️⃣ Email INTERNE
    const internal = await sendEmail({
      from: FROM, to: [INTERNAL_TO], reply_to: data.lead_email,
      subject: `🏠 Nouveau lead MaPrimeAdapt' — ${data.lead_nom} (${data.sim_eligibilite})`,
      html: buildInternalEmail(data),
    }, "INTERNAL");
    
    if (!internal.ok) {
      return res.status(500).json({ error: "Internal email failed", details: internal.result });
    }
    
    // ⏱️ Délai pour respecter le rate-limit Resend (2 req/sec en gratuit)
    await sleep(700);
    
    // 2️⃣ Email PROSPECT
    const prospect = await sendEmail({
      from: FROM, to: [data.lead_email], reply_to: INTERNAL_TO,
      subject: `Votre simulation MaPrimeAdapt' — Vivalea`,
      html: buildProspectEmail(data),
    }, "PROSPECT");
    
    if (!prospect.ok) {
      return res.status(207).json({
        ok: true, internalSent: true, prospectFailed: true,
        prospectError: prospect.result, internalId: internal.result.id,
      });
    }
    
    return res.status(200).json({
      ok: true, internalId: internal.result.id, prospectId: prospect.result.id,
    });
  } catch (err) {
    console.error("Send error:", err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
