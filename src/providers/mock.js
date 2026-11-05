// Données de démonstration réalistes (vrais modèles, vraies photos sous licence libre).
// Les annonces et les prix sont fictifs. En production, remplacées par l'API mobile.de.

const PHOTOS = require('../data/photos.json');

// [clé photos, carrosserie, versions : [nom, ch, carburant, boîte, prix neuf indicatif]]
const CATALOG = [
  ['audi-a3', 'Compacte', [['35 TFSI S line', 150, 'Essence', 'Automatique', 38000], ['30 TDI', 116, 'Diesel', 'Manuelle', 33000], ['40 TFSI e', 204, 'Hybride', 'Automatique', 44000]]],
  ['audi-a4', 'Berline', [['40 TDI quattro', 204, 'Diesel', 'Automatique', 52000], ['35 TFSI', 150, 'Essence', 'Automatique', 45000]]],
  ['audi-a6', 'Break', [['Avant 40 TDI', 204, 'Diesel', 'Automatique', 62000], ['Avant 55 TFSI e quattro', 367, 'Hybride', 'Automatique', 75000]]],
  ['audi-q3', 'SUV', [['35 TFSI', 150, 'Essence', 'Automatique', 42000], ['35 TDI', 150, 'Diesel', 'Automatique', 44000]]],
  ['audi-q5', 'SUV', [['40 TDI quattro', 204, 'Diesel', 'Automatique', 60000], ['50 TFSI e', 299, 'Hybride', 'Automatique', 68000]]],
  ['audi-rs-3', 'Sportive', [['Sportback 2.5 TFSI', 400, 'Essence', 'Automatique', 72000]]],
  ['audi-e-tron-gt', 'Sportive', [['quattro', 530, 'Électrique', 'Automatique', 105000]]],
  ['bmw-serie-1', 'Compacte', [['118i M Sport', 136, 'Essence', 'Automatique', 36000], ['118d', 150, 'Diesel', 'Manuelle', 35000], ['M135i xDrive', 306, 'Essence', 'Automatique', 55000]]],
  ['bmw-serie-3', 'Berline', [['320d M Sport', 190, 'Diesel', 'Automatique', 52000], ['330e', 292, 'Hybride', 'Automatique', 56000], ['M340i xDrive', 374, 'Essence', 'Automatique', 70000]]],
  ['bmw-serie-5', 'Berline', [['520d', 190, 'Diesel', 'Automatique', 60000], ['530e', 292, 'Hybride', 'Automatique', 66000]]],
  ['bmw-x1', 'SUV', [['sDrive18i', 136, 'Essence', 'Automatique', 42000], ['xDrive23d', 211, 'Diesel', 'Automatique', 52000]]],
  ['bmw-x3', 'SUV', [['xDrive20d', 190, 'Diesel', 'Automatique', 60000], ['xDrive30e', 292, 'Hybride', 'Automatique', 66000]]],
  ['bmw-m4', 'Sportive', [['Competition', 510, 'Essence', 'Automatique', 100000]]],
  ['bmw-i4', 'Berline', [['eDrive40', 340, 'Électrique', 'Automatique', 62000], ['M50', 544, 'Électrique', 'Automatique', 75000]]],
  ['mercedes-benz-classe-a', 'Compacte', [['A 180', 136, 'Essence', 'Automatique', 36000], ['A 200 d', 150, 'Diesel', 'Automatique', 40000], ['A 35 AMG 4MATIC', 306, 'Essence', 'Automatique', 58000]]],
  ['mercedes-benz-classe-c', 'Berline', [['C 220 d AMG Line', 200, 'Diesel', 'Automatique', 55000], ['C 300 e', 313, 'Hybride', 'Automatique', 60000]]],
  ['mercedes-benz-classe-e', 'Berline', [['E 220 d', 197, 'Diesel', 'Automatique', 65000], ['E 300 e', 313, 'Hybride', 'Automatique', 72000]]],
  ['mercedes-benz-glc', 'SUV', [['220 d 4MATIC', 197, 'Diesel', 'Automatique', 63000], ['300 e 4MATIC', 313, 'Hybride', 'Automatique', 70000]]],
  ['mercedes-benz-amg-gt', 'Sportive', [['63 S 4MATIC+', 585, 'Essence', 'Automatique', 180000]]],
  ['volkswagen-golf', 'Compacte', [['1.5 eTSI Life', 150, 'Essence', 'Automatique', 34000], ['2.0 TDI', 115, 'Diesel', 'Manuelle', 33000], ['R 4MOTION', 320, 'Essence', 'Automatique', 55000]]],
  ['volkswagen-golf-gti', 'Sportive', [['2.0 TSI', 245, 'Essence', 'Automatique', 46000], ['Clubsport', 300, 'Essence', 'Automatique', 52000]]],
  ['volkswagen-tiguan', 'SUV', [['2.0 TDI', 150, 'Diesel', 'Automatique', 42000], ['1.4 eHybrid', 245, 'Hybride', 'Automatique', 48000]]],
  ['volkswagen-passat', 'Break', [['Variant 2.0 TDI', 150, 'Diesel', 'Automatique', 45000], ['Variant GTE', 218, 'Hybride', 'Automatique', 52000]]],
  ['volkswagen-polo', 'Citadine', [['1.0 TSI', 95, 'Essence', 'Manuelle', 22000], ['GTI', 207, 'Essence', 'Automatique', 32000]]],
  ['volkswagen-id-4', 'SUV', [['Pro', 204, 'Électrique', 'Automatique', 48000], ['GTX', 299, 'Électrique', 'Automatique', 56000]]],
  ['porsche-911', 'Sportive', [['Carrera', 385, 'Essence', 'Automatique', 130000], ['Carrera 4S', 450, 'Essence', 'Automatique', 150000], ['Turbo S', 650, 'Essence', 'Automatique', 240000]]],
  ['porsche-macan', 'SUV', [['T', 265, 'Essence', 'Automatique', 75000], ['4 Electric', 408, 'Électrique', 'Automatique', 85000]]],
  ['porsche-cayenne', 'SUV', [['E-Hybrid', 462, 'Hybride', 'Automatique', 105000], ['S', 440, 'Essence', 'Automatique', 110000]]],
  ['porsche-taycan', 'Sportive', [['4S', 530, 'Électrique', 'Automatique', 115000], ['Sport Turismo', 408, 'Électrique', 'Automatique', 105000]]],
  ['skoda-octavia', 'Break', [['Combi 2.0 TDI', 150, 'Diesel', 'Automatique', 36000], ['Combi RS', 245, 'Essence', 'Automatique', 44000]]],
  ['skoda-kodiaq', 'SUV', [['2.0 TDI 4x4', 193, 'Diesel', 'Automatique', 48000], ['1.5 TSI', 150, 'Essence', 'Automatique', 42000]]],
  ['opel-corsa', 'Citadine', [['1.2 Turbo', 100, 'Essence', 'Manuelle', 21000], ['Electric', 156, 'Électrique', 'Automatique', 33000]]],
  ['opel-astra', 'Compacte', [['1.2 Turbo GS', 130, 'Essence', 'Automatique', 30000], ['Plug-in Hybrid', 180, 'Hybride', 'Automatique', 40000]]],
];
const COLORS = ['Noir Saphir', 'Blanc Alpin', 'Gris Daytona', 'Argent Iridium', 'Bleu Navarre', 'Rouge Tango', 'Gris Nardo', 'Noir Obsidienne'];
const CITIES = ['Munich', 'Berlin', 'Hambourg', 'Stuttgart', 'Francfort', 'Cologne', 'Düsseldorf', 'Leipzig', 'Nuremberg'];
const OPTIONS = ['GPS', 'Caméra 360°', 'Sièges chauffants', 'Régulateur adaptatif', 'Toit panoramique', 'Apple CarPlay', 'Phares Matrix LED', 'Attelage',
  'Affichage tête haute', 'Hayon électrique', 'Système audio premium', 'Sièges sport', 'Aide au stationnement', 'Pack Nuit'];

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const VEHICLES = [];
let n = 0;
for (const [key, body, versions] of CATALOG) {
  const { make, model, photos } = PHOTOS[key];
  const count = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const [version, power, fuel, gearbox, newPrice] = pick(versions);
    const age = Math.floor(rand() * 5); // 0 à 4 ans
    const year = 2025 - age;
    const km = age === 0 ? Math.round(rand() * 8000 + 500) : Math.round((age * 15000 + rand() * 18000) / 100) * 100;
    const depreciation = Math.pow(0.86, age) * (age === 0 ? 0.88 : 1) * (0.94 + rand() * 0.1);
    // Les photos tournent pour que deux annonces du même modèle n'aient pas la même photo principale
    const shift = i % photos.length;
    const pics = [...photos.slice(shift), ...photos.slice(0, shift)];
    VEHICLES.push({
      id: `MH${2400 + n++}`,
      make, model, version, body, year, km, fuel, gearbox, power,
      color: pick(COLORS),
      location: pick(CITIES),
      owners: age === 0 ? 1 : 1 + Math.floor(rand() * 2),
      options: OPTIONS.filter(() => rand() > 0.55),
      supplierPrice: Math.round((newPrice * depreciation) / 100) * 100,
      images: pics.map((p) => `/photos/${p.file}`),
      thumbs: pics.map((p) => `/photos/${p.file.replace('.jpg', '-sm.jpg')}`),
      credits: pics.map((p) => ({ author: p.author, license: p.license, source: p.source })),
    });
  }
}

async function search() {
  return VEHICLES;
}

async function getById(id) {
  return VEHICLES.find((v) => v.id === id) || null;
}

module.exports = { search, getById };
