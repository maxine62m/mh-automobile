// Configuration centrale : modifie ici ta marge et tes coordonnées.

module.exports = {
  // Source des véhicules : "mock" (démo) ou "mobilede" (API officielle, une fois l'accès obtenu)
  provider: process.env.PROVIDER || 'mock',

  // Marge par tranche de prix fournisseur (en €).
  // Pour chaque tranche : marge fixe + pourcentage du prix. Le prix final est arrondi à la centaine supérieure.
  marginTiers: [
    { upTo: 10000, fixed: 1500, percent: 0 },
    { upTo: 20000, fixed: 2000, percent: 0 },
    { upTo: 35000, fixed: 2500, percent: 0 },
    { upTo: 60000, fixed: 3000, percent: 0 },
    { upTo: Infinity, fixed: 0, percent: 6 },
  ],
  roundTo: 100,

  contact: {
    company: 'MH Automobile',
    phone: '+33 6 00 00 00 00',
    whatsapp: '33600000000',
    email: 'contact@mh-automobile.fr',
    city: 'France',
  },

  // Identifiants API mobile.de (à renseigner plus tard via variables d'environnement)
  mobilede: {
    user: process.env.MOBILEDE_USER || '',
    password: process.env.MOBILEDE_PASSWORD || '',
    endpoint: 'https://services.mobile.de/search-api/search',
  },
};
