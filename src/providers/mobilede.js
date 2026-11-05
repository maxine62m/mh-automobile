// Connecteur API officielle mobile.de (Search-API). À activer une fois l'accès obtenu :
//   PROVIDER=mobilede MOBILEDE_USER=xxx MOBILEDE_PASSWORD=yyy npm start
// Documentation : https://services.mobile.de/manual/search-api.html
// Les champs ci-dessous sont à ajuster selon la réponse réelle de l'API.

const { mobilede } = require('../config');

function authHeader() {
  return 'Basic ' + Buffer.from(`${mobilede.user}:${mobilede.password}`).toString('base64');
}

function normalize(ad) {
  return {
    id: String(ad.mobileAdId),
    make: ad.make,
    model: ad.model,
    year: Number(String(ad.firstRegistration || '').slice(0, 4)) || null,
    km: ad.mileage,
    fuel: ad.fuel,
    gearbox: ad.gearbox,
    power: ad.power ? Math.round(ad.power * 1.36) : null, // kW -> ch
    color: ad.exteriorColor,
    location: ad.seller?.address?.city || 'Allemagne',
    owners: ad.numberOfPreviousOwners,
    options: ad.features || [],
    supplierPrice: Number(ad.price?.consumerPriceGross),
    images: (ad.images || []).map((img) => img.xxxl || img.xl || img.l),
  };
}

async function search(filters) {
  const params = new URLSearchParams({ classification: 'refdata/classes/Car', 'page.size': '100' });
  if (filters.yearMin) params.set('firstRegistrationDate.min', `${filters.yearMin}-01`);
  if (filters.kmMax) params.set('mileage.max', filters.kmMax);
  const res = await fetch(`${mobilede.endpoint}?${params}`, {
    headers: { Authorization: authHeader(), Accept: 'application/vnd.de.mobile.api+json' },
  });
  if (!res.ok) throw new Error(`mobile.de API ${res.status}`);
  const data = await res.json();
  return (data.ads || []).map(normalize);
}

async function getById(id) {
  const res = await fetch(`https://services.mobile.de/search-api/ad/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader(), Accept: 'application/vnd.de.mobile.api+json' },
  });
  if (!res.ok) return null;
  return normalize(await res.json());
}

module.exports = { search, getById };
