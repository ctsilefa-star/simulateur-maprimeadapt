// /api/send-email.js — Vivalea Adapt · Simulateur d'aides Seniors & Handicap
// Templates harmonisés avec l'identité Vivalea (magenta #8F1349, DM Sans/Serif)

const esc = (s) => String(s || "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));

const C = {
  magenta: "#8F1349", navy: "#18263F", orange: "#E9552E",
  green: "#059669", red: "#DC2626", blue: "#3B82F6",
  bg: "#F8F6F4", border: "#E8E2DD", muted: "#6B7280",
  white: "#FFFFFF",
};

// Badge coloré selon le niveau d'une aide
const niveauBadge = (niveau) => {
  const map = {
    fort:  { c: C.green,   bg: "#ECFDF5", label: "ÉLIGIBLE" },
    moyen: { c: C.orange,  bg: "#FFF1E4", label: "PROBABLE" },
    info:  { c: C.blue,    bg: "#EFF6FF", label: "APPLICABLE" },
    non:   { c: C.muted,   bg: C.bg,      label: "NON ÉLIGIBLE" },
  };
  return map[niveau] || map.info;
};

// En-tête commun
const header = (badge, title, subtitle) => `
  <div style="background:${C.magenta};color:${C.white};padding:28px 32px;">
    <div style="font-size:11px;letter-spacing:0.18em;opacity:0.75;text-transform:uppercase;margin-bottom:10px;">${esc(badge)}</div>
    <div style="font-size:24px;font-weight:700;line-height:1.2;">${esc(title)}</div>
    ${subtitle ? `<div style="font-size:13px;opacity:0.9;margin-top:6px;">${esc(subtitle)}</div>` : ""}
  </div>`;

// Section générique
const section = (title, content, bgColor = "transparent") => `
  <div style="padding:22px 32px;border-bottom:1px solid ${C.border};${bgColor !== "transparent" ? `background:${bgColor};` : ""}">
    <div style="font-size:10px;color:${C.magenta};font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;">${esc(title)}</div>
    ${content}
  </div>`;

// Ligne de tableau
const row = (label, value, opts = {}) => `
  <tr>
    <td style="color:${C.muted};width:200px;padding:3px 0;vertical-align:top;font-size:13px;">${esc(label)}</td>
    <td style="padding:3px 0;font-size:13px;${opts.bold ? "font-weight:700;" : ""}${opts.color ? `color:${opts.color};` : ""}">${opts.raw ? value : esc(value || "—")}</td>
  </tr>`;

const table = (rows) => `<table style="width:100%;line-height:1.6;">${rows}</table>`;

// KPI card
const kpiCard = (label, value, color) => `
  <div style="flex:1;background:${C.white};padding:14px 12px;border-radius:10px;border:1px solid ${C.border};text-align:center;">
    <div style="font-size:10px;color:${C.muted};margin-bottom:5px;">${esc(label)}</div>
    <div style="font-size:16px;font-weight:700;color:${color};line-height:1.3;">${esc(value)}</div>
  </div>`;

// Sources officielles des aides (liens cliquables pour le vendeur)
const AIDE_SOURCES = {
  "MaPrimeAdapt'":       "https://www.anah.fr/maprimeadapt",
  "APA":                 "https://www.service-public.fr/particuliers/vosdroits/F10009",
  "PCH":                 "https://www.service-public.fr/particuliers/vosdroits/F14202",
  "Crédit d'impôt":      "https://www.impots.gouv.fr/particulier/questions/puis-je-beneficier-dun-credit-dimpot-pour-lachat-dequipements-speciaux",
  "TVA":                 "https://www.service-public.fr/particuliers/vosdroits/F12219",
  "CARSAT":              "https://www.carsat.fr/les-services-en-ligne/particuliers/ma-demande-d-aide-pour-adaptation-du-logement",
  "Action Logement":     "https://www.actionlogement.fr/l-aide-travaux-d-adaptation-du-logement-au-handicap",
  "Aides locales":       "https://www.anah.fr/proprietaires/vos-aides/les-aides-de-votre-collectivite/",
};

function getAideSource(nom) {
  if (nom.includes("MaPrime"))         return AIDE_SOURCES["MaPrimeAdapt'"];
  if (nom.includes("APA"))             return AIDE_SOURCES["APA"];
  if (nom.includes("PCH"))             return AIDE_SOURCES["PCH"];
  if (nom.includes("Crédit"))          return AIDE_SOURCES["Crédit d'impôt"];
  if (nom.includes("TVA"))             return AIDE_SOURCES["TVA"];
  if (nom.includes("CARSAT"))          return AIDE_SOURCES["CARSAT"];
  if (nom.includes("Action Logement")) return AIDE_SOURCES["Action Logement"];
  if (nom.includes("locale") || nom.includes("territorial")) return AIDE_SOURCES["Aides locales"];
  return null;
}

// Carte d'aide pour l'email (interne : avec lien source cliquable)
const aideRow = (nom, organisme, montantLabel, niveau, forInternal = false) => {
  const cfg = niveauBadge(niveau);
  const source = forInternal ? getAideSource(nom) : null;
  const nomHtml = source
    ? `<a href="${source}" target="_blank" style="color:${C.navy};text-decoration:underline;font-weight:700;">${esc(nom)} ↗</a>`
    : `<strong style="font-size:13px;color:${C.navy};">${esc(nom)}</strong>`;
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid ${C.border};vertical-align:top;">
      <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.08em;background:${cfg.bg};color:${cfg.c};padding:2px 6px;border-radius:3px;margin-right:6px;">${cfg.label}</span>
      ${nomHtml}
      ${organisme ? `<span style="font-size:11px;color:${C.muted};margin-left:4px;">· ${esc(organisme)}</span>` : ""}
    </td>
    <td style="padding:8px 0 8px 12px;border-bottom:1px solid ${C.border};text-align:right;white-space:nowrap;font-size:12px;font-weight:700;color:${cfg.c};vertical-align:top;">${esc(montantLabel)}</td>
  </tr>`;
};

// Footer
const footer = (subline) => `
  <div style="padding:18px 32px;background:${C.navy};color:${C.white};text-align:center;font-size:11px;line-height:1.6;">
    <div style="opacity:0.95;font-weight:600;letter-spacing:0.05em;">Vivalea · Entreprise à impact et ESS</div>
    <div style="opacity:0.7;margin-top:4px;">${esc(subline)}</div>
  </div>`;

// ── Parsing de la liste d'aides (pipe-séparée) ──────────────
// Format : "Nom (montant) | Nom (montant) | ..."
function parseAidesList(str) {
  if (!str) return [];
  return str.split("|").map(s => s.trim()).filter(Boolean).map(item => {
    const match = item.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) return { nom: match[1].trim(), montant: match[2].trim() };
    return { nom: item, montant: "" };
  });
}

// Niveaux correspondants aux aides connues (pour coloration)
const AIDE_NIVEAUX = {
  "MaPrimeAdapt'": "fort",
  "APA — Volet adaptation du logement": "fort",
  "PCH — Aménagement du logement": "fort",
  "PCH — Maintien des droits après 60 ans": "moyen",
  "Crédit d'impôt adaptation": "moyen",
  "CARSAT / Caisse de retraite": "moyen",
  "Aide CARSAT / Caisse de retraite": "moyen",
  "TVA à taux réduit — 5,5 %": "info",
  "Prêt Action Logement — 0 %": "info",
  "Aides locales & territoriales": "info",
};

function getNiveau(nom) {
  for (const [key, val] of Object.entries(AIDE_NIVEAUX)) {
    if (nom.includes(key) || key.includes(nom.substring(0, 15))) return val;
  }
  if (nom.includes("MaPrime")) return nom.includes("Non") ? "non" : "fort";
  return "info";
}

// ── EMAIL INTERNE ────────────────────────────────────────────
function buildInternalEmail(d) {
  const aides = parseAidesList(d.sim_aides);
  const nbAides = d.sim_nb_aides || String(aides.length);
  const montantTotal = d.sim_montant_total || "À estimer";

  const aidesTableRows = aides.length > 0
    ? `<table style="width:100%;">${aides.map(a => aideRow(a.nom, "", a.montant, getNiveau(a.nom), true)).join("")}</table>`
    : `<p style="font-size:13px;color:${C.muted};">Aucune aide identifiée.</p>`;

  const partenaireSection = d.partenaire === "oui"
    ? section("Recommandation partenaire", table(
        row("Entreprise partenaire", d.partenaire_entreprise, { bold: true }) +
        row("Contact partenaire", d.partenaire_nom)
      ), "#FFF1F4")
    : "";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Nouveau lead Vivalea Adapt</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:${C.bg};color:${C.navy};">
<div style="max-width:640px;margin:0 auto;background:${C.white};">
  ${header(
    d.partenaire === "oui"
      ? `Recommandation partenaire · ${esc(d.partenaire_entreprise)}`
      : "Nouveau lead · Simulateur Aides Seniors & Handicap",
    d.lead_nom,
    `Dépt. ${d.sim_departement} · ${d.sim_age}`
  )}

  <div style="padding:20px 32px;border-bottom:1px solid ${C.border};background:${C.bg};">
    <div style="display:flex;gap:10px;">
      ${kpiCard("Potentiel aides", montantTotal, C.magenta)}
      ${kpiCard("Nb subventions", `${nbAides} aide${Number(nbAides) > 1 ? "s" : ""}`, C.green)}
      ${kpiCard("Département", d.sim_departement, C.navy)}
    </div>
  </div>

  ${partenaireSection}

  ${section("Coordonnées", table(
    row("Nom", d.lead_nom, { bold: true }) +
    row("Téléphone", `<a href="tel:${esc(d.lead_telephone)}" style="color:${C.magenta};text-decoration:none;font-weight:700;">${esc(d.lead_telephone)}</a>`, { raw: true }) +
    row("Email", `<a href="mailto:${esc(d.lead_email)}" style="color:${C.magenta};text-decoration:none;">${esc(d.lead_email)}</a>`, { raw: true }) +
    row("Source", d.lead_source)
  ))}

  ${section("Profil de la simulation", table(
    row("Âge", d.sim_age, { bold: true }) +
    row("Situation autonomie/handicap", d.sim_situation) +
    row("Statut logement", d.sim_statut) +
    row("Département", d.sim_departement) +
    row("Personnes au foyer", d.sim_occupants) +
    row("Revenus fiscaux de référence", d.sim_revenus) +
    row("Statut professionnel", d.sim_profil)
  ))}

  ${(d.prec_ergo_rapport && d.prec_ergo_rapport !== "—") || (d.prec_chute_hospi && d.prec_chute_hospi !== "—") || (d.prec_aidant && d.prec_aidant !== "—") ? section("Précisions situation (facultatif)", table(
    row("Rapport ergothérapeute < 6 mois", d.prec_ergo_rapport || "—") +
    row("Chute avec hospitalisation (6 mois)", d.prec_chute_hospi || "—") +
    row("Aidé au quotidien", d.prec_aidant || "—")
  )) : ""}

  ${section("Aides identifiées", aidesTableRows)}

  ${footer(`Lead capturé le ${esc(d.timestamp)}`)}
</div>
</body></html>`;
}

// ── EMAIL PROSPECT ───────────────────────────────────────────
function buildProspectEmail(d) {
  const aides = parseAidesList(d.sim_aides);
  const montantTotal = d.sim_montant_total || "Aides disponibles";
  const nbAides = d.sim_nb_aides || String(aides.length);
  const hasAides = Number(nbAides) > 0;

  const messageIntro = hasAides
    ? `Selon les informations renseignées, nous avons identifié <strong>${nbAides} aide${Number(nbAides) > 1 ? "s" : ""} potentielle${Number(nbAides) > 1 ? "s" : ""}</strong> pour financer l'adaptation de votre logement, pour un montant estimatif de <strong>${esc(montantTotal)}</strong>. Ces montants sont cumulables selon votre situation.`
    : `Selon les informations renseignées, la situation actuelle ne permet pas d'identifier d'aides directes. Mais d'autres dispositifs peuvent exister selon votre territoire.`;

  const aidesTableRows = aides.length > 0
    ? `<table style="width:100%;">${aides.map(a => aideRow(a.nom, "", a.montant, getNiveau(a.nom))).join("")}</table>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Votre bilan d'aides — Vivalea Adapt</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:${C.bg};color:${C.navy};">
<div style="max-width:640px;margin:0 auto;background:${C.white};">
  ${header("Votre bilan d'aides personnalisé", "Vivalea Adapt", `Merci ${d.lead_nom}, voici vos résultats`)}

  <div style="padding:24px 32px;border-bottom:1px solid ${C.border};background:linear-gradient(135deg,#8F1349,#6B0D37);text-align:center;">
    <div style="font-size:10px;color:rgba(255,255,255,0.75);font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:8px;">Potentiel d'aides estimatif</div>
    <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">${esc(montantTotal)}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:6px;">${nbAides} aide${Number(nbAides) > 1 ? "s" : ""} identifiée${Number(nbAides) > 1 ? "s" : ""} · estimation indicative, non contractuelle</div>
  </div>

  <div style="padding:24px 32px;font-size:14px;line-height:1.7;color:${C.navy};border-bottom:1px solid ${C.border};">
    <p style="margin:0 0 12px;">Bonjour ${esc(d.lead_nom)},</p>
    <p style="margin:0;">${messageIntro}</p>
  </div>

  ${aidesTableRows ? section("Détail des aides identifiées", aidesTableRows, C.bg) : ""}

  ${section("Récapitulatif de votre saisie", table(
    row("Âge", d.sim_age, { bold: true }) +
    row("Situation", d.sim_situation) +
    row("Statut logement", d.sim_statut) +
    row("Département", d.sim_departement) +
    row("Personnes au foyer", `${esc(d.sim_occupants)} personne(s)`) +
    row("Revenus de référence", d.sim_revenus) +
    row("Situation professionnelle", d.sim_profil)
  ))}

  <div style="padding:24px 32px;border-bottom:1px solid ${C.border};background:${C.bg};">
    <div style="font-size:10px;color:${C.magenta};font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">Prochaine étape</div>
    <p style="font-size:14px;line-height:1.7;margin:0 0 16px;">Un conseiller Vivalea vous accompagne gratuitement pour monter votre dossier d'aides et maximiser votre financement, sans démarche administrative à faire seul.</p>
    <div style="text-align:center;">
      <a href="https://calendly.com/vivalea" style="display:inline-block;background:${C.magenta};color:${C.white};padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Échanger avec un conseiller →</a>
      <div style="font-size:11px;color:${C.muted};margin-top:8px;">30 min · Gratuit · Sans engagement</div>
    </div>
  </div>

  <div style="padding:16px 32px 24px;font-size:13px;line-height:1.7;color:${C.muted};">
    À très bientôt,<br/>
    <strong style="color:${C.navy};">L'équipe Vivalea Adapt</strong>
  </div>

  ${footer("Simulation indicative, non contractuelle · Données traitées de manière confidentielle")}
</div>
</body></html>`;
}

// ── HANDLER ──────────────────────────────────────────────────
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

  const FROM       = process.env.RESEND_FROM || "Vivalea Adapt <noreply@notif.vivalea.fr>";
  const INTERNAL_TO = process.env.INTERNAL_EMAIL || "lea@vivalea.fr";

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
    // 1. Email interne
    const internal = await sendEmail({
      from: FROM, to: [INTERNAL_TO], reply_to: data.lead_email,
      subject: `Nouveau lead Aides Seniors — ${data.lead_nom} · ${data.sim_montant_total || "aides identifiées"}`,
      html: buildInternalEmail(data),
    }, "INTERNAL");

    if (!internal.ok) {
      return res.status(500).json({ error: "Internal email failed", details: internal.result });
    }

    // Délai rate-limit Resend (2 req/sec en gratuit)
    await sleep(700);

    // 2. Email prospect
    const prospect = await sendEmail({
      from: FROM, to: [data.lead_email], reply_to: INTERNAL_TO,
      subject: `Votre bilan d'aides personnalisé — Vivalea Adapt`,
      html: buildProspectEmail(data),
    }, "PROSPECT");

    if (!prospect.ok) {
      return res.status(207).json({
        ok: true, internalSent: true, prospectFailed: true,
        prospectError: prospect.result, internalId: internal.result.id,
      });
    }

    return res.status(200).json({ ok: true, internalId: internal.result.id, prospectId: prospect.result.id });
  } catch (err) {
    console.error("Send error:", err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
