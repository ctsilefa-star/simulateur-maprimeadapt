# 🏠 Simulateur d'éligibilité MaPrimeAdapt'

Simulateur B2C interactif de **lead generation** pour Vivalea.
Permet aux particuliers (seniors et personnes en perte d'autonomie) de vérifier en quelques clics leur éligibilité à l'aide **MaPrimeAdapt'** de l'État pour les travaux d'adaptation du logement.

**Cibles** : particuliers de 60+ ans, propriétaires/locataires, à revenus modestes ou très modestes.

---

## 🌐 URLs

| Environnement | URL |
|---|---|
| **Production** ✅ | https://maprimeadapt.vivalea.fr |
| Production (Vercel direct) | https://simulateur-maprimeadapt.vercel.app |
| Repo GitHub | https://github.com/ctsilefa-star/simulateur-maprimeadapt |
| Dashboard Vercel | https://vercel.com/vivalea/simulateur-maprimeadapt |

---

## 🛠️ Stack technique

- **Frontend** : React 18 + Babel standalone (via CDN, **pas de build step**)
- **Backend** : Vercel Serverless Function (Node.js)
- **Email** : Resend (3000 emails/mois gratuit, partagé avec Diagnostic)
- **Hébergement** : Vercel (auto-deploy depuis GitHub)
- **DNS** : OVH (zone DNS de vivalea.fr)

---

## 📂 Structure du projet

```
simulateur-maprimeadapt/
├── index.html                       # App React standalone (1 seul fichier)
├── api/
│   └── send-email.js                # Vercel Function (envoi Resend)
├── simulateur-maprimeadapt.jsx      # Source JSX historique (référence)
├── vercel.json                      # Config Vercel (HTML statique)
└── README.md
```

---

## 🚀 Déploiement

**Auto-déploiement** : chaque `git push` sur `main` déclenche un rebuild Vercel (~30 sec).

```bash
git add .
git commit -m "feat: description du changement"
git push origin main
```

---

## 🔐 Variables d'environnement Vercel

Configurer sur https://vercel.com/vivalea/simulateur-maprimeadapt/settings/environment-variables

| Clé | Valeur | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | API Key Resend (à régénérer si compromise) |
| `RESEND_FROM` | `Vivalea Adapt <noreply@notif.vivalea.fr>` | Expéditeur emails |
| `INTERNAL_EMAIL` | `ctsilefa@vivalea.fr` | Destinataire des notifs lead |

⚠️ Après modification d'une variable, **forcer un redeploy** (commit "factice" + push).

---

## 📝 Logique du formulaire (6 étapes)

| Étape | Champs collectés |
|---|---|
| **1 · Âge** | Tranche d'âge (60-69, 70-79, 80+, < 60) |
| **2 · Statut** | Propriétaire / Locataire / Hébergé |
| **3 · Localisation** | Département (Île-de-France ou Province) |
| **4 · Foyer** | Nombre de personnes au foyer |
| **5 · Revenus** | Tranche de revenus annuels (selon barème ANAH) |
| **6 · Contact** | Nom, Téléphone, Email (déclenche l'envoi) |

---

## 🧮 Logique d'éligibilité

MaPrimeAdapt' est destinée aux personnes de **60 ans et plus** (ou en perte d'autonomie). L'aide couvre **jusqu'à 70% des travaux** plafonnés à 22 000 €.

### 3 niveaux d'éligibilité calculés

| Statut | Critères | Taux d'aide |
|---|---|---|
| 🎉 **Ménage très modeste** | Revenus < seuil "très modeste" ANAH | **70%** des travaux |
| ✨ **Ménage modeste** | Revenus < seuil "modeste" ANAH | **50%** des travaux |
| ℹ️ **Hors barème** | Revenus > seuil "modeste" | Non éligible MaPrimeAdapt', mais autres aides possibles |

Le code applique des **barèmes ANAH différents** selon l'Île-de-France vs Province et selon le nombre de personnes au foyer.

Sources : Service-Public.fr · MaPrimeAdapt' 2024 · ANAH

---

## 📧 Système d'emails (Resend)

À la soumission du formulaire, 2 emails sont envoyés via `/api/send-email` :

### Email 1 — Interne (vers `ctsilefa@vivalea.fr`)

- Header magenta avec nom du lead
- 3 KPIs en tête : Résultat éligibilité / Département / Taille foyer
- Bandeau coloré "Statut d'éligibilité" (vert/orange/gris)
- Sections : Coordonnées (téléphone cliquable), Profil de la simulation

### Email 2 — Prospect (vers l'email saisi)

- Header personnalisé "Bienvenue {Nom}"
- Bandeau coloré du résultat d'éligibilité
- Message adapté selon le niveau :
  - Si éligible : "Bonne nouvelle, un conseiller vous recontactera"
  - Si non éligible : "D'autres aides existent peut-être"
- Récapitulatif complet de la saisie
- Info sur MaPrimeAdapt' (taux, plafond, source)
- CTA Calendly

### Configuration DNS Resend (déjà en place)

Le domaine `notif.vivalea.fr` est partagé avec le simulateur Diagnostic. La configuration DNS est identique :

| Type | Sous-domaine | Cible |
|---|---|---|
| TXT (DKIM) | `resend._domainkey.notif` | `p=MIG...` |
| MX | `send.notif` | `feedback-smtp.eu-west-1.amazonses.com.` (priorité 10) |
| TXT (SPF) | `send.notif` | `v=spf1 include:amazonses.com ~all` |
| TXT (DMARC) | `_dmarc.notif` | `v=DMARC1; p=none; rua=mailto:ctsilefa@vivalea.fr` |

---

## 🌐 Intégration Webflow (iframe)

Code à coller dans un bloc **"Embed"** Webflow :

```html
<div class="vivalea-maprimeadapt-wrapper" style="width: 100%; max-width: 720px; margin: 0 auto;">
  <iframe 
    id="vivalea-maprimeadapt-iframe"
    src="https://maprimeadapt.vivalea.fr/" 
    title="Simulateur MaPrimeAdapt' — Vivalea"
    loading="lazy"
    scrolling="no"
    style="width: 100%; min-height: 900px; border: none; display: block; background: #F8F6F4; border-radius: 12px; transition: height 0.3s ease;"
    allow="clipboard-write"
  ></iframe>
</div>

<script>
  (function() {
    var iframe = document.getElementById('vivalea-maprimeadapt-iframe');
    if (!iframe) return;
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'vivalea-resize' && typeof e.data.height === 'number') {
        var newHeight = Math.max(e.data.height + 20, 900);
        iframe.style.height = newHeight + 'px';
      }
    });
    setTimeout(function() {
      if (iframe.offsetHeight < 1000) iframe.style.height = '1100px';
    }, 3000);
  })();
</script>
```

L'iframe communique sa hauteur réelle au parent Webflow via `postMessage` (auto-resize fluide entre les étapes).

---

## 🎨 Identité visuelle

Identique au Diagnostic Coût Aidant pour cohérence de marque :

- **Magenta** : `#8F1349` (primary)
- **Magenta hover** : `#7A1040`
- **Navy** : `#18263F` (texte)
- **Orange accent** : `#E9552E`
- **Vert succès** : `#0F766E` (très modeste / éligible 70%)
- **Orange "modeste"** : `#E9552E` (éligible 50%)
- **Background** : `#F8F6F4`
- **Bordures** : `#E8E2DD`
- **Texte muted** : `#6B7280`
- **Fonts** : DM Serif Display (titres) + DM Sans (corps)

Différence visuelle clé vs Diagnostic : header "Vivalea **Adapt**" (vs "Vivalea **Care**") pour le positionnement B2C.

---

## 🐛 Debug & Troubleshooting

### Logs runtime Vercel
👉 https://vercel.com/vivalea/simulateur-maprimeadapt/logs

### Tableau de bord emails Resend
👉 https://resend.com/emails

### Problèmes connus

| Symptôme | Cause probable | Solution |
|---|---|---|
| Email prospect non reçu | Variable `RESEND_FROM` mal configurée | Vérifier qu'elle pointe sur `noreply@notif.vivalea.fr` |
| Iframe affiche page blanche | Cache Webflow | Hard refresh (Ctrl+Shift+R) |
| Calcul éligibilité incorrect | Barèmes ANAH obsolètes | Mettre à jour les seuils dans `index.html` (constantes en haut du JSX) |
| Status "Invalid Configuration" Vercel domaine | CNAME pas propagé | Attendre 5-15 min |

---

## 🧪 Tester en local

Aucun build n'est nécessaire :

```bash
# Option 1 : Python (préinstallé sur Mac/Linux)
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000

# Option 2 : Node http-server
npx serve .
```

⚠️ Le `/api/send-email` ne fonctionnera qu'en production Vercel (pas en local).

---

## 📦 Méthodologie BMAD utilisée

Ce projet suit la méthodologie **BMAD** :
- **B**usiness : MaPrimeAdapt' comme lead magnet B2C pour le maintien à domicile
- **M**arketing : ciblage seniors + aidants familiaux, tunnel 6 étapes optimisé mobile-first
- **A**rchitecture : Vercel + React inline + Resend (même stack que Diagnostic)
- **D**éveloppement : itération rapide sans build step

---

## 📞 Contacts

- **Project Owner** : Touxah (touxah@vivalea.fr)
- **Lead notif** : ctsilefa@vivalea.fr

---

**🟢 Dernière mise à jour** : Mai 2026 · Migration EmailJS → Resend, harmonisation esthétique avec Diagnostic, domaine custom configuré
