# MH Automobile

Site d'import de véhicules d'Allemagne : recherche multicritère, fiche véhicule, prix client avec marge automatique.

## Lancer le site

```bash
npm start        # http://localhost:3000
```

Aucune dépendance, Node 18 ou plus suffit.

## Où modifier quoi

| Besoin | Fichier |
|---|---|
| Marge par tranche de prix | `src/config.js` → `marginTiers` |
| Téléphone, WhatsApp, email | `src/config.js` → `contact` |
| Textes et sections | `public/index.html` |
| Couleurs et design | `public/style.css` (variables en haut) |

Le prix fournisseur reste côté serveur : le navigateur ne reçoit que le prix avec marge.

## Brancher l'API mobile.de

1. Demander l'accès à la Search-API depuis le compte revendeur mobile.de.
2. Lancer avec :
   ```bash
   PROVIDER=mobilede MOBILEDE_USER=xxx MOBILEDE_PASSWORD=yyy npm start
   ```
3. Ajuster si besoin `src/providers/mobilede.js` selon la réponse réelle de l'API.

En attendant, `src/providers/mock.js` fournit 90 véhicules fictifs avec photos de démonstration.
