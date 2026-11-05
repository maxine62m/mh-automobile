const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const { clientPrice } = require('./src/pricing');
const provider = require(`./src/providers/${config.provider}`);

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const PAGE_SIZE = 12;

// Ce qui est envoyé au client : prix fournisseur retiré, prix avec marge ajouté
function toPublic(v) {
  const { supplierPrice, ...rest } = v;
  return { ...rest, price: clientPrice(supplierPrice) };
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function handleSearch(q, res) {
  const f = Object.fromEntries(q);
  const num = (k) => (f[k] ? Number(f[k]) : null);
  let list = (await provider.search(f)).map(toPublic).filter((v) =>
    (!f.make || v.make === f.make) &&
    (!f.model || v.model === f.model) &&
    (!f.fuel || v.fuel === f.fuel) &&
    (!f.gearbox || v.gearbox === f.gearbox) &&
    (!num('yearMin') || v.year >= num('yearMin')) &&
    (!num('yearMax') || v.year <= num('yearMax')) &&
    (!num('priceMax') || v.price <= num('priceMax')) &&
    (!num('kmMax') || v.km <= num('kmMax'))
  );
  const sorters = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    year_desc: (a, b) => b.year - a.year,
    km_asc: (a, b) => a.km - b.km,
  };
  list.sort(sorters[f.sort] || sorters.price_asc);
  const page = Math.max(1, num('page') || 1);
  json(res, 200, {
    total: list.length,
    page,
    pages: Math.max(1, Math.ceil(list.length / PAGE_SIZE)),
    results: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  });
}

async function handleMakes(res) {
  const makes = {};
  for (const v of await provider.search({})) (makes[v.make] ||= new Set()).add(v.model);
  json(res, 200, Object.fromEntries(Object.keys(makes).sort().map((m) => [m, [...makes[m]].sort()])));
}

// Image de démonstration (silhouette de voiture) en attendant les vraies photos via l'API
async function placeholder(id, n, res) {
  const v = await provider.getById(id);
  const color = v?.colorHex || '#888';
  const angles = ['Vue avant', 'Profil', 'Vue arrière', 'Intérieur'];
  const label = v ? `${v.make} ${v.model}` : 'Véhicule';
  res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
  res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
<defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2a2d33"/><stop offset="1" stop-color="#0b0b0d"/></radialGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="1"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient></defs>
<rect width="800" height="520" fill="url(#g)"/>
<ellipse cx="400" cy="380" rx="300" ry="22" fill="#000" opacity=".6"/>
<path d="M110 340 C120 300 160 290 220 280 L300 220 C340 195 470 190 540 215 L620 270 C680 280 700 300 700 340 Z" fill="url(#c)" stroke="#d9dde2" stroke-opacity=".35" stroke-width="2"/>
<path d="M315 228 L360 205 C410 195 470 197 520 218 L560 265 L300 268 Z" fill="#0d1117" opacity=".75"/>
<circle cx="240" cy="345" r="42" fill="#0b0b0b" stroke="#aaa" stroke-width="5"/><circle cx="580" cy="345" r="42" fill="#0b0b0b" stroke="#aaa" stroke-width="5"/>
<path d="M660 300 L700 305" stroke="#e1252f" stroke-width="6" stroke-linecap="round"/>
<text x="40" y="60" fill="#e9eaec" font-family="Arial" font-size="30" font-weight="bold">${label}</text>
<text x="40" y="95" fill="#c8102e" font-family="Arial" font-size="20">${angles[(n - 1) % 4]} · photo de démonstration</text>
</svg>`);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    if (p === '/api/search') return await handleSearch(url.searchParams, res);
    if (p === '/api/makes') return await handleMakes(res);
    if (p === '/api/config') return json(res, 200, { contact: config.contact });
    if (p.startsWith('/api/vehicle/')) {
      const v = await provider.getById(decodeURIComponent(p.slice(13)));
      return v ? json(res, 200, toPublic(v)) : json(res, 404, { error: 'Véhicule introuvable' });
    }
    const ph = p.match(/^\/placeholder\/([\w-]+)\/(\d)\.svg$/);
    if (ph) return await placeholder(ph[1], Number(ph[2]), res);

    // Fichiers statiques
    const file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : p));
    if (!file.startsWith(PUBLIC)) return json(res, 403, { error: 'Interdit' });
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Page introuvable');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (e) {
    console.error(e);
    json(res, 500, { error: 'Erreur serveur' });
  }
});

server.listen(PORT, () => console.log(`MH Automobile : http://localhost:${PORT} (source : ${config.provider})`));
