# MH Automobile

Site d'import de véhicules d'Allemagne : recherche multicritère, fiche véhicule, prix client avec marge automatique.

## Lancer le site

```bash
npm start        # http://localhost:3000
```

Node 18 ou plus.

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

En attendant, `src/providers/mock.js` fournit environ 95 annonces de démonstration : vrais modèles et vraies photos, prix et annonces fictifs.

## Page d'accueil

Animation d'ouverture (ligne rouge, logo qui s'ouvre, reflet argenté) puis recherche rapide.
Visuel : section « Ouverture » à la fin de `public/style.css`. Rythme : `playIntro()` dans `public/js/app.js`.

## Version en ligne sans serveur

`node scripts/build-static.js` génère `dist/` (site statique, véhicules en JSON avec prix marge incluse).

## Crédits (obligatoires, ne pas retirer)

- Photos : Wikimedia Commons, licences CC BY / CC BY-SA. Auteur et licence affichés sous chaque photo, détail dans `src/data/photos.json`.
- Logos de marques : Simple Icons (CC0). Les marques appartiennent à leurs propriétaires.
