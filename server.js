const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const { clientPrice } = require('./src/pricing');
const provider = require(`./src/providers/${config.provider}`);

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const THREE = path.join(__dirname, 'node_modules', 'three');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.json': 'application/json' };
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
    (!f.body || v.body === f.body) &&
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

    // Fichiers statiques (+ three.js servi depuis node_modules)
    const [root, rel] = p.startsWith('/vendor/three/') ? [THREE, p.slice(13)] : [PUBLIC, p === '/' ? 'index.html' : p];
    const file = path.normalize(path.join(root, decodeURIComponent(rel)));
    if (!file.startsWith(root)) return json(res, 403, { error: 'Interdit' });
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Page introuvable');
      }
      const ext = path.extname(file);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ['.jpg', '.glb', '.wasm', '.svg', '.png'].includes(ext) ? 'public, max-age=604800' : 'no-cache' });
      res.end(data);
    });
  } catch (e) {
    console.error(e);
    json(res, 500, { error: 'Erreur serveur' });
  }
});

server.listen(PORT, () => console.log(`MH Automobile : http://localhost:${PORT} (source : ${config.provider})`));
