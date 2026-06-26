// /api/send-email.js — Vivalea Adapt · Simulateur d'aides
// Templates v3 — données JSON structurées, visuels enrichis

const esc = (s) => String(s || "").replace(/[<>&"']/g, c =>
  ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));

// ── Palette Vivalea ──────────────────────────────────────────
const C = {
  magenta: "#8F1349", magentaDark: "#6B0D37",
  navy: "#18263F", navyLight: "#2C3E5A",
  green: "#059669", greenBg: "#ECFDF5",
  orange: "#E9552E", orangeBg: "#FFF1E4",
  blue: "#3B82F6", blueBg: "#EFF6FF",
  bg: "#F8F6F4", border: "#E8E2DD",
  muted: "#6B7280", white: "#FFFFFF",
};

// ── Badges niveau ────────────────────────────────────────────
const NIVEAU = {
  fort:  { c: C.green,   bg: C.greenBg,  label: "ÉLIGIBLE",    dot: "🟢" },
  moyen: { c: C.orange,  bg: C.orangeBg, label: "PROBABLE",    dot: "🟠" },
  info:  { c: C.blue,    bg: C.blueBg,   label: "APPLICABLE",  dot: "🔵" },
  non:   { c: C.muted,   bg: C.bg,       label: "NON ÉLIGIBLE",dot: "⚫" },
};

const badge = (niveau) => {
  const n = NIVEAU[niveau] || NIVEAU.info;
  return `<span style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:0.1em;
    background:${n.bg};color:${n.c};padding:3px 7px;border-radius:4px;
    text-transform:uppercase;border:1px solid ${n.c}30;">${n.label}</span>`;
};

// ── Liens sources ────────────────────────────────────────────
const SOURCES = {
  maprimeadapt:    "https://www.anah.fr/maprimeadapt",
  apa:             "https://www.service-public.fr/particuliers/vosdroits/F10009",
  pch:             "https://www.service-public.fr/particuliers/vosdroits/F14202",
  credit_impot:    "https://www.impots.gouv.fr/particulier/questions/puis-je-beneficier-dun-credit-dimpot-pour-lachat-dequipements-speciaux",
  carsat:          "https://www.carsat.fr",
  ardh:            "https://www.cnav.fr/content/aide-retour-a-domicile-apres-hospitalisation",
  aah:             "https://www.service-public.fr/particuliers/vosdroits/F12242",
  ajpa:            "https://www.service-public.fr/particuliers/vosdroits/F35494",
  action_logement: "https://www.actionlogement.fr/l-aide-travaux-d-adaptation-du-logement-au-handicap",
  aides_locales:   "https://www.anah.fr/proprietaires/vos-aides/les-aides-de-votre-collectivite/",
};

function getSource(nom) {
  const n = nom.toLowerCase();
  if (n.includes("maprime"))        return SOURCES.maprimeadapt;
  if (n.includes("apa"))            return SOURCES.apa;
  if (n.includes("pch"))            return SOURCES.pch;
  if (n.includes("crédit d'impôt") || n.includes("credit")) return SOURCES.credit_impot;
  if (n.includes("carsat") || n.includes("cnav")) return SOURCES.carsat;
  if (n.includes("ardh"))           return SOURCES.ardh;
  if (n.includes("aah"))            return SOURCES.aah;
  if (n.includes("ajpa"))           return SOURCES.ajpa;
  if (n.includes("action logement")) return SOURCES.action_logement;
  if (n.includes("locale") || n.includes("territorial")) return SOURCES.aides_locales;
  return null;
}

// ── Composants HTML réutilisables ────────────────────────────
const divider = () => `<div style="height:1px;background:${C.border};margin:0;"></div>`;

const sectionTitle = (text, color = C.magenta) =>
  `<div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;
    letter-spacing:0.14em;margin-bottom:14px;padding-bottom:8px;
    border-bottom:2px solid ${color}20;">${esc(text)}</div>`;

const infoRow = (label, value, opts = {}) => `
  <div style="display:flex;align-items:baseline;gap:8px;padding:5px 0;border-bottom:1px solid ${C.border}10;">
    <span style="font-size:12px;color:${C.muted};min-width:190px;flex-shrink:0;">${esc(label)}</span>
    <span style="font-size:13px;color:${C.navy};font-weight:${opts.bold ? "700" : "500"};
      ${opts.color ? `color:${opts.color};` : ""}">${opts.raw ? value : esc(value || "—")}</span>
  </div>`;

// ── Carte aide (email interne avec lien source) ──────────────
const aideCard = (aide, withLink = false) => {
  const src = withLink ? getSource(aide.nom) : null;
  const nomHtml = src
    ? `<a href="${src}" target="_blank" style="color:${C.navy};font-weight:700;font-size:13px;text-decoration:none;">${esc(aide.nom)} <span style="font-size:10px;color:${C.magenta};">↗</span></a>`
    : `<span style="color:${C.navy};font-weight:700;font-size:13px;">${esc(aide.nom)}</span>`;
  const orga = aide.organisme
    ? `<span style="font-size:11px;color:${C.muted};"> · ${esc(aide.organisme)}</span>` : "";
  const montant = aide.montantLabel
    ? `<div style="font-size:12px;font-weight:700;color:${NIVEAU[aide.niveau]?.c || C.muted};
        white-space:nowrap;margin-top:2px;">${esc(aide.montantLabel)}</div>` : "";

  return `
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
    padding:11px 0;border-bottom:1px solid ${C.border};">
    <div style="flex:1;min-width:0;">
      <div style="margin-bottom:4px;">${badge(aide.niveau)} ${nomHtml}${orga}</div>
    </div>
    <div style="text-align:right;flex-shrink:0;">${montant}</div>
  </div>`;
};

// ── Groupe de cartes par catégorie ───────────────────────────
const aideSection = (label, icon, color, aides, withLink = false) => {
  if (!aides || aides.length === 0) return "";
  return `
  <div style="margin-bottom:20px;">
    <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;
      letter-spacing:0.12em;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
      <span>${icon}</span> ${esc(label)}
    </div>
    <div>${aides.map(a => aideCard(a, withLink)).join("")}</div>
  </div>`;
};

// ── EMAIL INTERNE VIVALEA ────────────────────────────────────
function buildInternalEmail(d) {
  let aides = [];
  try { aides = JSON.parse(d.sim_aides_json || "[]"); } catch(e) {}

  const aidesFort  = aides.filter(a => a.niveau === "fort");
  const aidesProb  = aides.filter(a => a.niveau === "moyen");
  const aidesInfo  = aides.filter(a => a.niveau === "info");
  const nbElig     = aidesFort.length + aidesProb.length;
  const isPartner  = d.partenaire === "oui";

  const logement  = aides.filter(a => a.categorie === "logement");
  const services  = aides.filter(a => a.categorie === "services");
  const complem   = aides.filter(a => a.categorie === "complementaire");

  const hasPrecisions = [d.prec_ergo_rapport, d.prec_chute_hospi, d.prec_aidant]
    .some(v => v && v !== "—");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lead Vivalea — ${esc(d.lead_nom)}</title></head>
<body style="margin:0;padding:24px 16px;font-family:'Helvetica Neue',Arial,sans-serif;
  background:${C.bg};color:${C.navy};">

<div style="max-width:640px;margin:0 auto;background:${C.white};border-radius:14px;
  overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,${C.magenta} 0%,${C.magentaDark} 100%);
    padding:28px 32px;">
    <div style="font-size:10px;letter-spacing:0.18em;opacity:0.75;text-transform:uppercase;
      margin-bottom:8px;">
      ${isPartner
        ? `🤝 Recommandation partenaire · ${esc(d.partenaire_entreprise)}`
        : "🔔 Nouveau lead · Simulateur Vivalea Adapt"}
    </div>
    <div style="font-size:26px;font-weight:800;color:${C.white};line-height:1.15;margin-bottom:4px;">
      ${esc(d.lead_nom)}
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.85);">
      Dépt. ${esc(d.sim_departement)} · ${esc(d.sim_age)} · ${esc(d.sim_situation)}
    </div>
  </div>

  <!-- KPIs -->
  <div style="background:${C.bg};padding:18px 32px;border-bottom:1px solid ${C.border};">
    <table style="width:100%;border-spacing:8px 0;"><tr>
      <td style="background:${C.white};border-radius:10px;padding:14px 16px;
        border:1px solid ${C.border};text-align:center;width:33%;">
        <div style="font-size:9px;color:${C.muted};text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:6px;">🏠 Aides logement</div>
        <div style="font-size:17px;font-weight:800;color:${C.magenta};line-height:1.1;">
          ${d.sim_total_logement || "—"}</div>
      </td>
      <td style="background:${C.white};border-radius:10px;padding:14px 16px;
        border:1px solid ${C.border};text-align:center;width:33%;">
        <div style="font-size:9px;color:${C.muted};text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:6px;">✅ Éligibles / probables</div>
        <div style="font-size:17px;font-weight:800;color:${C.green};line-height:1.1;">
          ${nbElig} aide${nbElig > 1 ? "s" : ""}</div>
      </td>
      <td style="background:${C.white};border-radius:10px;padding:14px 16px;
        border:1px solid ${C.border};text-align:center;width:33%;">
        <div style="font-size:9px;color:${C.muted};text-transform:uppercase;
          letter-spacing:0.1em;margin-bottom:6px;">📋 Objectif</div>
        <div style="font-size:13px;font-weight:700;color:${C.navy};line-height:1.2;">
          ${esc(d.sim_objectif)}</div>
      </td>
    </tr></table>
  </div>

  <!-- COORDONNÉES -->
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};">
    ${sectionTitle("📞 Coordonnées")}
    ${infoRow("Nom", d.lead_nom, { bold: true })}
    ${infoRow("Téléphone",
      `<a href="tel:${esc(d.lead_telephone)}" style="color:${C.magenta};font-weight:700;
        text-decoration:none;font-size:15px;">${esc(d.lead_telephone)}</a>`, { raw: true })}
    ${infoRow("Email",
      `<a href="mailto:${esc(d.lead_email)}" style="color:${C.magenta};text-decoration:none;">
        ${esc(d.lead_email)}</a>`, { raw: true })}
    ${infoRow("Source", d.lead_source)}
    ${isPartner ? infoRow("Partenaire", `${esc(d.partenaire_entreprise)} · Contact : ${esc(d.partenaire_nom)}`, { bold: true, color: C.magenta }) : ""}
  </div>

  <!-- PROFIL -->
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};background:${C.bg};">
    ${sectionTitle("👤 Profil de simulation", C.navyLight)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
      ${infoRow("Âge", d.sim_age, { bold: true })}
      ${infoRow("Situation autonomie", d.sim_situation)}
      ${infoRow("Statut logement", d.sim_statut)}
      ${infoRow("Département", d.sim_departement)}
      ${infoRow("Personnes au foyer", d.sim_occupants + " personne(s)")}
      ${infoRow("Revenus fiscaux de réf.", d.sim_revenus)}
      ${infoRow("Statut professionnel", d.sim_profil)}
      ${infoRow("Éligibilité MaPrimeAdapt'", d.sim_eligibilite, { bold: true })}
    </div>
  </div>

  ${hasPrecisions ? `
  <!-- PRÉCISIONS -->
  <div style="padding:20px 32px;border-bottom:1px solid ${C.border};">
    ${sectionTitle("🔍 Précisions situation", C.orange)}
    ${infoRow("Rapport ergo < 6 mois", d.prec_ergo_rapport)}
    ${infoRow("Chute avec hospitalisation", d.prec_chute_hospi)}
    ${infoRow("Aidé au quotidien (proche/pro)", d.prec_aidant)}
  </div>` : ""}

  <!-- AIDES IDENTIFIÉES -->
  <div style="padding:22px 32px;">
    ${sectionTitle("💡 Aides identifiées (${aides.length} au total)")}
    ${aideSection("Adaptation du logement", "🏠", C.magenta, logement, true)}
    ${aideSection("Services & aide à domicile", "🤝", C.green, services, true)}
    ${aideSection("Aides complémentaires", "💼", C.muted, complem, true)}
    ${aides.length === 0 ? `<p style="font-size:13px;color:${C.muted};">Aucune aide identifiée.</p>` : ""}
  </div>

  <!-- FOOTER -->
  <div style="padding:18px 32px;background:${C.navy};text-align:center;">
    <div style="color:${C.white};font-size:12px;font-weight:600;letter-spacing:0.06em;">
      Vivalea · Entreprise à impact et ESS
    </div>
    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:4px;">
      Lead capturé le ${esc(d.timestamp)}
    </div>
  </div>

</div>
</body></html>`;
}

// ── EMAIL PROSPECT (CLIENT) ──────────────────────────────────
function buildProspectEmail(d) {
  let aides = [];
  try { aides = JSON.parse(d.sim_aides_json || "[]"); } catch(e) {}

  const aidesFort = aides.filter(a => a.niveau === "fort");
  const aidesProb = aides.filter(a => a.niveau === "moyen");
  const nbElig    = aidesFort.length + aidesProb.length;
  const hasTotal  = !!d.sim_total_logement;

  const logement  = aides.filter(a => a.categorie === "logement");
  const services  = aides.filter(a => a.categorie === "services");
  const complem   = aides.filter(a => a.categorie === "complementaire");

  const mpaElig = d.sim_eligibilite && !d.sim_eligibilite.startsWith("Non");

  const introText = nbElig > 0
    ? `Votre simulation fait apparaître <strong style="color:${C.magenta};">${nbElig} aide${nbElig > 1 ? "s" : ""} éligible${nbElig > 1 ? "s" : ""} ou probables</strong>.
       ${hasTotal ? `Le potentiel de subventions pour l'adaptation de votre logement est estimé à <strong style="color:${C.magenta};">${esc(d.sim_total_logement)}</strong>.` : ""}
       Ces montants sont cumulables selon votre situation personnelle.`
    : `Votre simulation ne fait pas ressortir d'aides directes dans votre situation actuelle.
       D'autres dispositifs locaux peuvent toutefois exister — un conseiller Vivalea peut vous aider à les identifier.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Votre bilan d'aides — Vivalea Adapt</title></head>
<body style="margin:0;padding:24px 16px;font-family:'Helvetica Neue',Arial,sans-serif;
  background:${C.bg};color:${C.navy};">

<div style="max-width:600px;margin:0 auto;background:${C.white};border-radius:14px;
  overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,${C.magenta} 0%,${C.magentaDark} 100%);
    padding:32px 32px 28px;">
    <div style="font-size:10px;letter-spacing:0.18em;opacity:0.75;text-transform:uppercase;
      margin-bottom:10px;">Vivalea Adapt · Votre bilan personnalisé</div>
    <div style="font-size:24px;font-weight:800;color:${C.white};line-height:1.2;margin-bottom:6px;">
      Bonjour ${esc((d.lead_nom || "").split(" ")[0])} 👋
    </div>
    <div style="font-size:14px;color:rgba(255,255,255,0.88);">
      Voici le récapitulatif de vos aides potentielles pour le maintien à domicile.
    </div>
  </div>

  ${hasTotal ? `
  <!-- MONTANT HERO -->
  <div style="background:${C.bg};padding:24px 32px;text-align:center;border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;color:${C.muted};text-transform:uppercase;letter-spacing:0.12em;
      margin-bottom:8px;">Potentiel d'aides logement estimé</div>
    <div style="font-size:36px;font-weight:800;color:${C.magenta};line-height:1;margin-bottom:6px;">
      ${esc(d.sim_total_logement)}</div>
    <div style="font-size:11px;color:${C.muted};">
      Estimation indicative · Non contractuel · ${nbElig} aide${nbElig > 1 ? "s" : ""} éligible${nbElig > 1 ? "s" : ""} ou probable${nbElig > 1 ? "s" : ""}
    </div>
  </div>` : ""}

  <!-- INTRO -->
  <div style="padding:24px 32px;border-bottom:1px solid ${C.border};
    font-size:14px;line-height:1.75;color:${C.navy};">
    <p style="margin:0 0 10px;">Bonjour ${esc(d.lead_nom)},</p>
    <p style="margin:0;">${introText}</p>
  </div>

  ${logement.length > 0 ? `
  <!-- AIDES LOGEMENT -->
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;font-weight:800;color:${C.magenta};text-transform:uppercase;
      letter-spacing:0.14em;margin-bottom:14px;padding-bottom:8px;
      border-bottom:2px solid ${C.magenta}25;">🏠 Adaptation du logement</div>
    ${logement.map(a => aideCard(a, false)).join("")}
  </div>` : ""}

  ${services.length > 0 ? `
  <!-- AIDES SERVICES -->
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;font-weight:800;color:${C.green};text-transform:uppercase;
      letter-spacing:0.14em;margin-bottom:14px;padding-bottom:8px;
      border-bottom:2px solid ${C.green}30;">🤝 Services & aide à domicile</div>
    ${services.map(a => aideCard(a, false)).join("")}
  </div>` : ""}

  ${complem.length > 0 ? `
  <!-- AIDES COMPLÉMENTAIRES -->
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;font-weight:800;color:${C.muted};text-transform:uppercase;
      letter-spacing:0.14em;margin-bottom:14px;padding-bottom:8px;
      border-bottom:2px solid ${C.muted}30;">💼 Aides complémentaires</div>
    ${complem.map(a => aideCard(a, false)).join("")}
  </div>` : ""}

  <!-- RÉCAPITULATIF PROFIL -->
  <div style="padding:22px 32px;background:${C.bg};border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;font-weight:800;color:${C.navyLight};text-transform:uppercase;
      letter-spacing:0.14em;margin-bottom:12px;">📋 Votre profil renseigné</div>
    <table style="width:100%;border-spacing:0;">
      <tr><td style="font-size:12px;color:${C.muted};padding:4px 0;width:50%;">Âge</td>
        <td style="font-size:12px;font-weight:600;color:${C.navy};padding:4px 0;">${esc(d.sim_age)}</td></tr>
      <tr><td style="font-size:12px;color:${C.muted};padding:4px 0;">Situation</td>
        <td style="font-size:12px;font-weight:600;color:${C.navy};padding:4px 0;">${esc(d.sim_situation)}</td></tr>
      <tr><td style="font-size:12px;color:${C.muted};padding:4px 0;">Logement</td>
        <td style="font-size:12px;font-weight:600;color:${C.navy};padding:4px 0;">${esc(d.sim_statut)}</td></tr>
      <tr><td style="font-size:12px;color:${C.muted};padding:4px 0;">Département</td>
        <td style="font-size:12px;font-weight:600;color:${C.navy};padding:4px 0;">${esc(d.sim_departement)}</td></tr>
      <tr><td style="font-size:12px;color:${C.muted};padding:4px 0;">Revenus de référence</td>
        <td style="font-size:12px;font-weight:600;color:${C.navy};padding:4px 0;">${esc(d.sim_revenus)}</td></tr>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:28px 32px;border-bottom:1px solid ${C.border};">
    <div style="font-size:10px;font-weight:800;color:${C.magenta};text-transform:uppercase;
      letter-spacing:0.14em;margin-bottom:12px;">📅 Prochaine étape</div>
    <p style="font-size:14px;line-height:1.75;color:${C.navy};margin:0 0 20px;">
      Un conseiller Vivalea vous accompagne <strong>gratuitement</strong> pour monter votre dossier,
      maximiser vos financements et trouver des artisans qualifiés près de chez vous —
      sans démarche administrative à faire seul.
    </p>
    <div style="text-align:center;">
      <a href="tel:${esc(d.to_email ? "" : "")}"
        style="display:inline-block;background:${C.magenta};color:${C.white};
          padding:15px 32px;border-radius:10px;text-decoration:none;
          font-weight:700;font-size:15px;letter-spacing:0.02em;">
        Être rappelé par un conseiller →
      </a>
      <div style="font-size:11px;color:${C.muted};margin-top:10px;">
        Gratuit · Sans engagement · Réponse sous 48 h
      </div>
    </div>
  </div>

  <!-- SIGNATURE -->
  <div style="padding:20px 32px 24px;">
    <p style="font-size:13px;color:${C.muted};line-height:1.7;margin:0;">
      À très bientôt,<br/>
      <strong style="color:${C.navy};font-size:14px;">L'équipe Vivalea Adapt</strong>
    </p>
  </div>

  <!-- FOOTER -->
  <div style="padding:16px 32px;background:${C.navy};text-align:center;">
    <div style="color:${C.white};font-size:12px;font-weight:600;letter-spacing:0.06em;">
      Vivalea · Entreprise à impact et ESS
    </div>
    <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:4px;line-height:1.6;">
      Simulation indicative, non contractuelle · Données traitées conformément au RGPD<br/>
      Aucune transmission à des tiers
    </div>
  </div>

</div>
</body></html>`;
}

// ── HANDLER ──────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const data = req.body;
  if (!data || !data.lead_email || !data.lead_nom)
    return res.status(400).json({ error: "Missing required fields" });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY not configured" });

  const FROM        = process.env.RESEND_FROM    || "Vivalea Adapt <noreply@notif.vivalea.fr>";
  const INTERNAL_TO = process.env.INTERNAL_EMAIL || "lea@vivalea.fr";

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function sendEmail(payload, label) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await resp.json();
    console.log(`[${label}] status=${resp.status}`, JSON.stringify(result));
    return { ok: resp.ok, status: resp.status, result };
  }

  try {
    // 1. Email interne Vivalea
    const nbEligStr = data.sim_nb_aides || "?";
    const internal = await sendEmail({
      from: FROM, to: [INTERNAL_TO], reply_to: data.lead_email,
      subject: data.partenaire === "oui"
        ? `[Partenaire] ${data.lead_nom} · ${data.partenaire_entreprise} · ${nbEligStr} aides`
        : `[Lead] ${data.lead_nom} · Dépt. ${data.sim_departement} · ${nbEligStr} aides · ${data.sim_total_logement || ""}`,
      html: buildInternalEmail(data),
    }, "INTERNAL");

    if (!internal.ok)
      return res.status(500).json({ error: "Internal email failed", details: internal.result });

    await sleep(700);

    // 2. Email prospect (client)
    const prospect = await sendEmail({
      from: FROM, to: [data.lead_email], reply_to: INTERNAL_TO,
      subject: `Votre bilan d'aides personnalisé — Vivalea Adapt`,
      html: buildProspectEmail(data),
    }, "PROSPECT");

    if (!prospect.ok)
      return res.status(207).json({
        ok: true, internalSent: true, prospectFailed: true,
        prospectError: prospect.result,
      });

    return res.status(200).json({ ok: true, internalId: internal.result.id, prospectId: prospect.result.id });

  } catch (err) {
    console.error("Send error:", err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
