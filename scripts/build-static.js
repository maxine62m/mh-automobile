// Génère une version statique du site dans dist/ (aucun serveur nécessaire) :
// les véhicules sont exportés en JSON avec le prix client (marge incluse), sans le prix fournisseur.
//   node scripts/build-static.js
const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const { clientPrice } = require('../src/pricing');
const provider = require('../src/providers/mock');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const rel = (s) => s.replace(/(["'(])\/(img|photos|brands|js|style\.css)/g, '$1$2');

(async () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });

  // Fichiers du site, chemins rendus relatifs
  for (const f of ['index.html', 'style.css', 'js/app.js', 'js/heroPhoto.js']) {
    let s = fs.readFileSync(path.join(PUB, f), 'utf8');
    s = rel(s);
    if (f === 'index.html') {
      s = s.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
        .replace('<script type="module"', '<script>window.MH_STATIC = true;</script>\n  <script type="module"');
    }
    fs.mkdirSync(path.dirname(path.join(DIST, f)), { recursive: true });
    fs.writeFileSync(path.join(DIST, f), s);
  }
  for (const d of ['img', 'brands']) fs.cpSync(path.join(PUB, d), path.join(DIST, d), { recursive: true });

  // Véhicules + photos utilisées (une seule taille : moins de fichiers, site plus léger)
  fs.mkdirSync(path.join(DIST, 'photos'));
  const vehicles = (await provider.search({})).map(({ supplierPrice, ...v }) => ({
    ...v,
    price: clientPrice(supplierPrice),
    // version 720 px des photos : site léger, idéal sur mobile
    images: v.thumbs.map((p) => p.slice(1)),
    thumbs: v.thumbs.map((p) => p.slice(1)),
  }));
  const used = new Set(vehicles.flatMap((v) => v.images).concat(['photos/porsche-911-1.jpg', 'photos/porsche-911-2.jpg']));
  for (const p of used) fs.copyFileSync(path.join(PUB, p), path.join(DIST, p));
  fs.writeFileSync(path.join(DIST, 'data', 'vehicles.json'), JSON.stringify({ contact: config.contact, vehicles }));
  console.log(`dist/ : ${vehicles.length} véhicules, ${used.size} photos`);
})();
