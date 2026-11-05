const $ = (s, el = document) => el.querySelector(s);
const eur = (n) => n.toLocaleString('fr-FR') + ' €';
const kms = (n) => n.toLocaleString('fr-FR') + ' km';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const form = $('#search');
let makes = {};
let contact = {};
let page = 1;

async function init() {
  $('#year').textContent = new Date().getFullYear();
  [makes, { contact }] = await Promise.all([fetch('/api/makes').then((r) => r.json()), fetch('/api/config').then((r) => r.json())]);

  form.make.innerHTML += Object.keys(makes).map((m) => `<option>${esc(m)}</option>`).join('');
  const now = new Date().getFullYear();
  for (const sel of document.querySelectorAll('.js-years'))
    for (let y = now; y >= 2005; y--) sel.add(new Option(y, y));
  for (const sel of [form.priceMax, form.kmMax])
    for (const o of sel.options) if (o.value) o.text = sel === form.priceMax ? eur(+o.value) : kms(+o.value);

  document.querySelectorAll('.js-whatsapp').forEach((a) => (a.href = `https://wa.me/${contact.whatsapp}`));
  $('.js-phone').textContent = contact.phone; $('.js-phone').href = `tel:${contact.phone.replace(/\s/g, '')}`;
  $('.js-email').textContent = contact.email; $('.js-email').href = `mailto:${contact.email}`;

  readUrl();
  search();
}

function fillModels() {
  const models = makes[form.make.value] || [];
  form.model.innerHTML = '<option value="">Tous</option>' + models.map((m) => `<option>${esc(m)}</option>`).join('');
  form.model.disabled = !models.length;
}

// Les critères sont gardés dans l'URL : une recherche peut être partagée
function readUrl() {
  const q = new URLSearchParams(location.search);
  if (q.get('make')) { form.make.value = q.get('make'); fillModels(); }
  for (const [k, v] of q) if (form[k] && k !== 'make') form[k].value = v;
  if (q.get('sort')) $('#sort').value = q.get('sort');
  page = Number(q.get('page')) || 1;
}

async function search() {
  const params = new URLSearchParams();
  for (const [k, v] of new FormData(form)) if (v) params.set(k, v);
  params.set('sort', $('#sort').value);
  if (page > 1) params.set('page', page);
  history.replaceState(null, '', '?' + params);

  $('#results').style.opacity = .5;
  const data = await fetch('/api/search?' + params).then((r) => r.json());
  $('#results').style.opacity = 1;
  $('#count').textContent = data.total;
  $('#results').innerHTML = data.results.length ? data.results.map(card).join('')
    : `<div class="empty">Aucun véhicule ne correspond à vos critères.<br><br><a class="btn btn-red" href="#contact">Demander une recherche personnalisée</a></div>`;
  $('#pager').innerHTML = data.pages > 1 ? Array.from({ length: data.pages }, (_, i) =>
    `<button class="${i + 1 === data.page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('') : '';
}

function card(v) {
  return `<article class="card" data-id="${esc(v.id)}">
    <div class="card-img" style="background-image:url('${esc(v.images[0])}')"><span class="badge">🇩🇪 ${esc(v.location)}</span></div>
    <div class="card-body">
      <div class="card-title">${esc(v.make)} ${esc(v.model)}</div>
      <div class="card-specs"><span>${v.year}</span><span>${kms(v.km)}</span><span>${esc(v.fuel)}</span><span>${esc(v.gearbox)}</span></div>
      <div class="card-foot"><div class="price">${eur(v.price)}<small>Prix import tout compris</small></div><span class="loc">${v.power} ch</span></div>
    </div></article>`;
}

async function openVehicle(id) {
  const v = await fetch('/api/vehicle/' + encodeURIComponent(id)).then((r) => r.json());
  const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par le véhicule ${v.make} ${v.model} ${v.year} (réf. ${v.id}) à ${eur(v.price)}.`);
  $('#modal-content').innerHTML = `<div class="detail">
    <div><div class="gallery-main" style="background-image:url('${esc(v.images[0])}')"></div>
      <div class="thumbs">${v.images.map((src, i) => `<div class="${i ? '' : 'active'}" data-src="${esc(src)}" style="background-image:url('${esc(src)}')"></div>`).join('')}</div></div>
    <div class="detail-info">
      <h3>${esc(v.make)} ${esc(v.model)}</h3>
      <div class="price">${eur(v.price)}<small>Prix import tout compris · réf. ${esc(v.id)}</small></div>
      <dl class="spec-table">
        <dt>Année</dt><dd>${v.year}</dd><dt>Kilométrage</dt><dd>${kms(v.km)}</dd>
        <dt>Carburant</dt><dd>${esc(v.fuel)}</dd><dt>Boîte</dt><dd>${esc(v.gearbox)}</dd>
        <dt>Puissance</dt><dd>${v.power} ch</dd><dt>Couleur</dt><dd>${esc(v.color)}</dd>
        <dt>Propriétaires</dt><dd>${v.owners}</dd><dt>Localisation</dt><dd>${esc(v.location)}, Allemagne</dd>
      </dl>
      ${v.options.length ? `<div class="opts">${v.options.map((o) => `<span>${esc(o)}</span>`).join('')}</div>` : ''}
      <a class="btn btn-red" target="_blank" rel="noopener" href="https://wa.me/${contact.whatsapp}?text=${msg}">Je suis intéressé(e)</a>
      <a class="btn btn-ghost" href="mailto:${contact.email}?subject=${encodeURIComponent('Véhicule réf. ' + v.id)}&body=${msg}">Demander par email</a>
      <p class="note">Prix incluant l'achat, le transport jusqu'en France et nos frais de service.</p>
    </div></div>`;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }

form.make.addEventListener('change', fillModels);
form.addEventListener('submit', (e) => { e.preventDefault(); page = 1; search(); $('#recherche').scrollIntoView(); });
form.addEventListener('reset', () => setTimeout(() => { fillModels(); page = 1; search(); }));
$('#sort').addEventListener('change', () => { page = 1; search(); });
$('#pager').addEventListener('click', (e) => { if (e.target.dataset.page) { page = +e.target.dataset.page; search(); $('#recherche').scrollIntoView(); } });
$('#results').addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) openVehicle(c.dataset.id); });
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal' || e.target.closest('.modal-close')) closeModal();
  const t = e.target.closest('.thumbs div');
  if (t) { $('.gallery-main').style.backgroundImage = `url('${t.dataset.src}')`; $('.thumbs .active')?.classList.remove('active'); t.classList.add('active'); }
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const text = `Demande de recherche personnalisée\nNom : ${d.name}\nTél : ${d.phone}\nVéhicule : ${d.vehicle}\nBudget : ${d.budget}\n${d.message}`;
  window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
});

init();
