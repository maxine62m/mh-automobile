// Données fictives de démonstration. Remplacées par l'API mobile.de en production.

const CATALOG = [
  ['Audi', 'A3', 28000], ['Audi', 'A4', 34000], ['Audi', 'A6', 45000], ['Audi', 'Q3', 36000], ['Audi', 'Q5', 48000], ['Audi', 'RS3', 62000],
  ['BMW', 'Série 1', 27000], ['BMW', 'Série 3', 38000], ['BMW', 'Série 5', 50000], ['BMW', 'X1', 35000], ['BMW', 'X3', 47000], ['BMW', 'M4', 85000],
  ['Mercedes-Benz', 'Classe A', 29000], ['Mercedes-Benz', 'Classe C', 40000], ['Mercedes-Benz', 'Classe E', 52000], ['Mercedes-Benz', 'GLC', 55000], ['Mercedes-Benz', 'AMG GT', 120000],
  ['Volkswagen', 'Golf', 24000], ['Volkswagen', 'Golf GTI', 36000], ['Volkswagen', 'Tiguan', 33000], ['Volkswagen', 'Passat', 30000], ['Volkswagen', 'Polo', 18000],
  ['Porsche', '911', 130000], ['Porsche', 'Macan', 70000], ['Porsche', 'Cayenne', 90000], ['Porsche', 'Taycan', 95000],
  ['Skoda', 'Octavia', 23000], ['Skoda', 'Kodiaq', 32000],
  ['Opel', 'Corsa', 15000], ['Opel', 'Astra', 20000],
];
const FUELS = ['Essence', 'Diesel', 'Hybride', 'Électrique'];
const GEARBOXES = ['Automatique', 'Manuelle'];
const COLORS = [['Noir', '#111'], ['Blanc', '#e9e9e9'], ['Gris', '#6b6f75'], ['Argent', '#b9bec4'], ['Bleu', '#1f3d73'], ['Rouge', '#a3121a']];
const CITIES = ['Munich', 'Berlin', 'Hambourg', 'Stuttgart', 'Francfort', 'Cologne', 'Düsseldorf'];
const OPTIONS = ['GPS', 'Caméra de recul', 'Sièges chauffants', 'Régulateur adaptatif', 'Toit ouvrant', 'Apple CarPlay', 'Phares LED', 'Attelage', 'Jantes alu', 'Hayon électrique'];

// Générateur pseudo-aléatoire déterministe : mêmes véhicules à chaque démarrage
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const VEHICLES = [];
for (let i = 0; i < 90; i++) {
  const [make, model, basePrice] = pick(CATALOG);
  const year = 2016 + Math.floor(rand() * 10);
  const age = 2026 - year;
  const km = Math.round((age * 14000 + rand() * 20000) / 100) * 100 + 500;
  const fuel = model === 'Taycan' ? 'Électrique' : pick(FUELS);
  const [colorName, colorHex] = pick(COLORS);
  const price = Math.round((basePrice * Math.pow(0.88, age) * (0.9 + rand() * 0.2)) / 100) * 100;
  const id = `mh${1000 + i}`;
  VEHICLES.push({
    id, make, model, year, km, fuel,
    gearbox: basePrice > 45000 ? 'Automatique' : pick(GEARBOXES),
    power: Math.round(90 + (basePrice / 1000) * 3 + rand() * 40),
    color: colorName,
    colorHex,
    location: pick(CITIES),
    owners: 1 + Math.floor(rand() * 3),
    options: OPTIONS.filter(() => rand() > 0.5),
    supplierPrice: price,
    images: [1, 2, 3, 4].map((n) => `/placeholder/${id}/${n}.svg`),
  });
}

async function search() {
  return VEHICLES;
}

async function getById(id) {
  return VEHICLES.find((v) => v.id === id) || null;
}

module.exports = { search, getById };
