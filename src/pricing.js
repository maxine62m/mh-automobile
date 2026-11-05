const { marginTiers, roundTo } = require('./config');

// Calcule le prix client à partir du prix fournisseur. Exécuté uniquement côté serveur :
// le prix fournisseur n'est jamais envoyé au navigateur.
function clientPrice(supplierPrice) {
  const tier = marginTiers.find((t) => supplierPrice <= t.upTo);
  const margin = tier.fixed + (supplierPrice * tier.percent) / 100;
  return Math.ceil((supplierPrice + margin) / roundTo) * roundTo;
}

module.exports = { clientPrice };
