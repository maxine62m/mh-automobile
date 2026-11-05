const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const eur = (n) => n.toLocaleString('fr-FR') + ' €';
const kms = (n) => n.toLocaleString('fr-FR') + ' km';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BRAND_LOGOS = { Audi: 'audi', BMW: 'bmw', 'Mercedes-Benz': 'mercedes-benz', Volkswagen: 'volkswagen', Porsche: 'porsche', Skoda: 'skoda', Opel: 'opel' };
const ARROW = '<svg viewBox="0 0 16 16"><path d="M2 8h12M9 3l5 5-5 5"/></svg>';

const form = $('#search');

/* ---------- Données : API du serveur, ou fichier JSON en version statique (sans serveur) ---------- */
const STATIC = !!window.MH_STATIC;
let staticData = null;
async function api(path) {
  if (!STATIC) return fetch('/api/' + path).then((r) => r.json());
  staticData ||= await fetch('data/vehicles.json').then((r) => r.json());
  const [route, query = ''] = path.split('?');
  const list = staticData.vehicles;
  if (route === 'config') return { contact: staticData.contact };
  if (route === 'makes') {
    const out = {};
    for (const v of list) (out[v.make] ||= new Set()).add(v.model);
    return Object.fromEntries(Object.keys(out).sort().map((m) => [m, [...out[m]].sort()]));
  }
  if (route.startsWith('vehicle/')) return list.find((v) => v.id === decodeURIComponent(route.slice(8)));
  // Recherche : mêmes règles que le serveur (server.js)
  const f = Object.fromEntries(new URLSearchParams(query));
  const num = (k) => (f[k] ? Number(f[k]) : null);
  const res = list.filter((v) => (!f.make || v.make === f.make) && (!f.model || v.model === f.model) && (!f.fuel || v.fuel === f.fuel)
    && (!f.gearbox || v.gearbox === f.gearbox) && (!f.body || v.body === f.body) && (!num('yearMin') || v.year >= num('yearMin'))
    && (!num('yearMax') || v.year <= num('yearMax')) && (!num('priceMax') || v.price <= num('priceMax')) && (!num('kmMax') || v.km <= num('kmMax')));
  const sorters = { price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price, year_desc: (a, b) => b.year - a.year, km_asc: (a, b) => a.km - b.km };
  res.sort(sorters[f.sort] || sorters.price_asc);
  const pg = Math.max(1, num('page') || 1);
  return { total: res.length, page: pg, pages: Math.max(1, Math.ceil(res.length / 12)), results: res.slice((pg - 1) * 12, pg * 12) };
}
let makes = {};
let contact = {};
let page = 1;

/* ---------- Chargement + scène 3D ---------- */
const loader = $('#loader');
let loaded = false;
function finishLoading() {
  if (loaded) return;
  loaded = true;
  loader.classList.add('done');
  document.body.classList.remove('is-loading');
  document.body.classList.add('ready');
  // Le texte apparaît pendant que la voiture approche (ou tout de suite sans 3D)
  const reveal = () => {
    if (document.body.classList.contains('intro-done')) return;
    document.body.classList.add('intro-done');
    $$('.hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 300 + i * 120));
  };
  if (hero) { hero.start().then(reveal); setTimeout(reveal, 6500); } else reveal();
}
function noWebGL() {
  $('#hero').classList.add('no-webgl');
  finishLoading();
}
setTimeout(finishLoading, 9000); // sécurité si le chargement tarde

// Mode du hero : "photo" (BMW M3 détourée, animation cinéma) ou "3d" (modèle 3D three.js)
const HERO_MODE = $('#hero').dataset.mode || 'photo';
let hero = null;
if (HERO_MODE === 'photo') {
  $('#hero-canvas').remove();
  $('.paint-picker').remove();
  import('./heroPhoto.js').then(({ initHeroPhoto }) => {
    hero = initHeroPhoto($('#stage'));
    const img = $('#stage .car-img');
    const go = () => { $('#loader-progress').style.width = '100%'; setTimeout(finishLoading, 350); };
    img.complete ? go() : img.addEventListener('load', go, { once: true });
  }).catch(noWebGL);
} else {
  $('#stage').remove();
  import('./hero3d.js').then(({ initHero }) => {
    hero = initHero({
      canvas: $('#hero-canvas'),
      onProgress: (p) => ($('#loader-progress').style.width = `${Math.round(p * 100)}%`),
      onReady: () => setTimeout(finishLoading, 350),
      onError: noWebGL,
    });
    if (!hero) noWebGL();
  }).catch(noWebGL);
}

$('.paint-picker')?.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !hero) return;
  $('.paint-picker .active')?.classList.remove('active');
  b.classList.add('active');
  hero.setPaint(b.dataset.paint);
});

/* ---------- Barre du haut + apparitions au scroll ---------- */
const topbar = $('#topbar');
addEventListener('scroll', () => topbar.classList.toggle('scrolled', scrollY > 40), { passive: true });
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
$$('.reveal').filter((el) => !el.closest('.hero')).forEach((el) => io.observe(el));

/* ---------- Initialisation des données ---------- */
async function init() {
  $('#year').textContent = new Date().getFullYear();
  [makes, { contact }] = await Promise.all([api('makes'), api('config')]);

  form.make.innerHTML += Object.keys(makes).map((m) => `<option>${esc(m)}</option>`).join('');
  const now = new Date().getFullYear();
  for (let y = now; y >= 2015; y--) form.yearMin.add(new Option(y, y));
  for (const sel of $$('.js-price')) for (const o of sel.options) if (o.value) o.text = eur(+o.value);
  heroForm.make.innerHTML += Object.keys(makes).map((m) => `<option>${esc(m)}</option>`).join('');
  for (const o of form.kmMax.options) if (o.value) o.text = kms(+o.value);

  // Bandeau des marques (dupliqué pour une boucle continue)
  const logos = Object.keys(makes).map((m) => `<button class="brand-logo" data-make="${esc(m)}">
    <i class="mask" style="--src:url('${STATIC ? '' : '/'}brands/${BRAND_LOGOS[m] || 'audi'}.svg')"></i><b>${esc(m)}</b></button>`).join('');
  $('#brands').innerHTML = logos + logos;

  $$('.js-whatsapp').forEach((a) => (a.href = `https://wa.me/${contact.whatsapp}`));
  $('.js-phone').textContent = contact.phone; $('.js-phone').href = `tel:${contact.phone.replace(/\s/g, '')}`;
  $('.js-email').textContent = contact.email; $('.js-email').href = `mailto:${contact.email}`;

  readUrl();
  search(false);
}

function fillModels() {
  const models = makes[form.make.value] || [];
  form.model.innerHTML = '<option value="">Tous</option>' + models.map((m) => `<option>${esc(m)}</option>`).join('');
  form.model.disabled = !models.length;
}

function setBody(value) {
  form.body.value = value;
  $$('#body-chips .chip').forEach((c) => c.classList.toggle('active', c.dataset.body === value));
}

// Les critères restent dans l'URL : une recherche peut être partagée
function readUrl() {
  const q = new URLSearchParams(STATIC ? '' : location.search);
  if (q.get('make')) { form.make.value = q.get('make'); fillModels(); }
  for (const [k, v] of q) if (form[k] && k !== 'make' && form[k].tagName) form[k].value = v;
  setBody(q.get('body') || '');
  page = Number(q.get('page')) || 1;
}

/* ---------- Recherche ---------- */
let reqId = 0;
async function search(scroll = true) {
  const params = new URLSearchParams();
  for (const [k, v] of new FormData(form)) if (v && !(k === 'sort' && v === 'price_asc')) params.set(k, v);
  if (page > 1) params.set('page', page);
  if (!STATIC) history.replaceState(null, '', params.size ? '?' + params : location.pathname);

  const id = ++reqId;
  const results = $('#results');
  if (!results.children.length) results.innerHTML = '<div class="skeleton"></div>'.repeat(6);
  results.style.opacity = '.4';
  const data = await api('search?' + params);
  if (id !== reqId) return;
  results.style.opacity = '';
  $('#count').textContent = data.total;
  if (!params.size) $('#hero-count').textContent = `(${data.total})`;
  results.innerHTML = data.results.length ? data.results.map(card).join('')
    : `<div class="empty"><p>Aucun véhicule ne correspond à ces critères pour le moment.</p><a class="btn btn-red" href="#sur-mesure">Nous le trouvons pour vous</a></div>`;
  $$('.card img', results).forEach((img) => (img.complete ? img.classList.add('loaded') : img.addEventListener('load', () => img.classList.add('loaded'))));
  $('#pager').innerHTML = data.pages > 1 ? Array.from({ length: data.pages }, (_, i) =>
    `<button class="${i + 1 === data.page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('') : '';
  if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function card(v, i) {
  const isNew = v.year >= new Date().getFullYear() - 1 && v.km < 10000;
  return `<article class="card" data-id="${esc(v.id)}" style="animation-delay:${i * 60}ms">
    <div class="card-glare"></div>
    <div class="card-img">
      <img src="${esc(v.thumbs[0])}" alt="${esc(`${v.make} ${v.model}`)}" loading="lazy">
      <div class="tag">${isNew ? '<span class="new">Quasi neuf</span>' : ''}<span>${esc(v.fuel)}</span></div>
      <div class="card-loc">📍 ${esc(v.location)}, Allemagne</div>
    </div>
    <div class="card-body">
      <div class="card-make">${esc(v.make)}</div>
      <div class="card-title">${esc(v.model)}</div>
      <div class="card-version">${esc(v.version)}</div>
      <div class="card-specs">
        <div><small>Année</small>${v.year}</div><div><small>Km</small>${v.km.toLocaleString('fr-FR')}</div>
        <div><small>Puiss.</small>${v.power} ch</div><div><small>Boîte</small>${v.gearbox === 'Automatique' ? 'Auto' : 'Manuelle'}</div>
      </div>
      <div class="card-foot"><div class="price">${eur(v.price)}<small>Prix import tout compris</small></div><span class="arrow">${ARROW}</span></div>
    </div></article>`;
}

// Inclinaison 3D des cartes + reflet qui suit la souris
const results = $('#results');
results.addEventListener('pointermove', (e) => {
  const c = e.target.closest('.card');
  if (!c || e.pointerType !== 'mouse') return;
  const r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.transform = `rotateY(${(x - 0.5) * 9}deg) rotateX(${(0.5 - y) * 9}deg) translateY(-6px)`;
  c.style.setProperty('--gx', `${x * 100}%`);
  c.style.setProperty('--gy', `${y * 100}%`);
});
results.addEventListener('pointerout', (e) => {
  const c = e.target.closest('.card');
  if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
});
results.addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) openVehicle(c.dataset.id); });

let debounce;
form.addEventListener('change', (e) => {
  if (e.target === form.make) fillModels();
  page = 1;
  clearTimeout(debounce);
  debounce = setTimeout(() => search(false), 120);
});
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('reset', () => setTimeout(() => { fillModels(); setBody(''); page = 1; search(false); }));
$('#body-chips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip');
  if (!c) return;
  setBody(c.dataset.body);
  page = 1;
  search(false);
});
$('#pager').addEventListener('click', (e) => { if (e.target.dataset.page) { page = +e.target.dataset.page; search(); } });
$('#brands').addEventListener('click', (e) => {
  const b = e.target.closest('.brand-logo');
  if (!b) return;
  form.make.value = b.dataset.make;
  fillModels();
  page = 1;
  search();
});

/* ---------- Fiche véhicule ---------- */
let gallery = { i: 0, n: 0 };
async function openVehicle(id) {
  const v = await api('vehicle/' + encodeURIComponent(id));
  const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par : ${v.make} ${v.model} ${v.version}, ${v.year}, ${kms(v.km)} (réf. ${v.id}) à ${eur(v.price)}.`);
  gallery = { i: 0, n: v.images.length, credits: v.credits };
  $('#modal-content').innerHTML = `<div class="detail">
    <div class="gallery">
      <div class="gallery-main">${v.images.map((src, i) => `<img src="${esc(src)}" alt="${esc(`${v.make} ${v.model} photo ${i + 1}`)}" class="${i ? '' : 'on'}" ${i ? 'loading="lazy"' : ''}>`).join('')}
        ${v.images.length > 1 ? '<button class="g-nav g-prev" aria-label="Précédente">‹</button><button class="g-nav g-next" aria-label="Suivante">›</button>' : ''}
        <span class="g-count">1 / ${v.images.length}</span></div>
      <div class="thumbs">${v.thumbs.map((src, i) => `<img src="${esc(src)}" data-i="${i}" class="${i ? '' : 'on'}" alt="">`).join('')}</div>
      <p class="photo-credit"></p>
    </div>
    <div class="detail-info">
      <div><div class="card-make">${esc(v.make)} · réf. ${esc(v.id)}</div><div class="card-title">${esc(v.model)}</div><div class="card-version">${esc(v.version)}</div></div>
      <div class="detail-price"><div class="price">${eur(v.price)}<small>Prix import tout compris : achat, transport, démarches</small></div></div>
      <div class="spec-grid">
        <div><small>Année</small><b>${v.year}</b></div><div><small>Kilométrage</small><b>${kms(v.km)}</b></div>
        <div><small>Énergie</small><b>${esc(v.fuel)}</b></div><div><small>Boîte</small><b>${esc(v.gearbox)}</b></div>
        <div><small>Puissance</small><b>${v.power} ch</b></div><div><small>Carrosserie</small><b>${esc(v.body)}</b></div>
        <div><small>Couleur</small><b>${esc(v.color)}</b></div><div><small>Propriétaires</small><b>${v.owners}</b></div>
      </div>
      ${v.options.length ? `<div class="opts">${v.options.map((o) => `<span>${esc(o)}</span>`).join('')}</div>` : ''}
      <div class="detail-cta">
        <a class="btn btn-red" target="_blank" rel="noopener" href="https://wa.me/${contact.whatsapp}?text=${msg}">Réserver ce véhicule</a>
        <a class="btn btn-glass" href="mailto:${contact.email}?subject=${encodeURIComponent('Véhicule réf. ' + v.id)}&body=${msg}">Poser une question</a>
      </div>
      <p class="note">📍 Actuellement à ${esc(v.location)}, Allemagne. Livraison en France sous 2 à 4 semaines selon disponibilité.</p>
    </div></div>`;
  showPhoto(0);
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function showPhoto(i) {
  gallery.i = (i + gallery.n) % gallery.n;
  $$('.gallery-main img').forEach((img, k) => img.classList.toggle('on', k === gallery.i));
  $$('.thumbs img').forEach((img, k) => img.classList.toggle('on', k === gallery.i));
  $('.g-count').textContent = `${gallery.i + 1} / ${gallery.n}`;
  const c = gallery.credits?.[gallery.i];
  $('.photo-credit').innerHTML = c ? `Photo : ${esc(c.author || 'Wikimedia Commons')}, ${esc(c.license)}, <a href="${esc(c.source)}" target="_blank" rel="noopener">source</a>` : '';
}

function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }

$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal' || e.target.closest('.modal-close')) return closeModal();
  if (e.target.closest('.g-prev')) return showPhoto(gallery.i - 1);
  if (e.target.closest('.g-next')) return showPhoto(gallery.i + 1);
  const t = e.target.closest('.thumbs img');
  if (t) showPhoto(+t.dataset.i);
});
let touchX = null;
$('#modal').addEventListener('touchstart', (e) => { if (e.target.closest('.gallery-main')) touchX = e.touches[0].clientX; }, { passive: true });
$('#modal').addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showPhoto(gallery.i + (dx < 0 ? 1 : -1));
  touchX = null;
});
document.addEventListener('keydown', (e) => {
  if ($('#modal').hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') showPhoto(gallery.i + 1);
  if (e.key === 'ArrowLeft') showPhoto(gallery.i - 1);
});

/* ---------- Recherche sur mesure ---------- */
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const text = `Demande de recherche personnalisée\nNom : ${d.name}\nTél : ${d.phone}\nVéhicule : ${d.vehicle}\nBudget : ${d.budget}\nAnnée min. : ${d.year}\n${d.message}`;
  window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
});

/* ---------- Recherche rapide de l'accueil ---------- */
const heroForm = $('#hero-search');
heroForm.make.addEventListener('change', () => {
  const models = makes[heroForm.make.value] || [];
  heroForm.model.innerHTML = '<option value="">Tous</option>' + models.map((m) => `<option>${esc(m)}</option>`).join('');
  heroForm.model.disabled = !models.length;
});
heroForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Reporte les critères dans la recherche complète, puis descend sur les résultats
  form.make.value = heroForm.make.value;
  fillModels();
  form.model.value = heroForm.model.value;
  form.priceMax.value = heroForm.priceMax.value;
  page = 1;
  search(true);
});

init();
