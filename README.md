# Solar System — Observatoire Orbital

Une visualisation interactive 3D du système solaire, construite avec Three.js et Vite.

[https://loickamg.github.io/Solar-System/](https://loickamg.github.io/Solar-System/)

## Deux façons de visiter

- **Classique** (`index.html`) — la carte 3D interactive : orbite libre, fiches d'observation, comparateur.
- **Récit** (`recit.html`) — le système solaire raconté comme une histoire, piloté par le défilement.
  On part d'un nuage de gaz qui s'effondre en disque, le Soleil s'allume dans un éclair, puis la
  caméra vole de monde en monde — Mercure, Vénus (dont les nuages se dissipent pour révéler le sol
  pendant le récit de Venera 13), la Terre et ses lumières nocturnes, Mars, la traversée de la
  ceinture d'astéroïdes, les géantes — jusqu'à l'épilogue du « point bleu pâle » de Voyager 1, avec
  un « Vous êtes ici » sur la Terre. Chaque chapitre dévoile son texte en plusieurs temps (arrivée,
  origine du nom, récit, le saviez-vous et chiffres clés animés).
  Habillage : titres lettre par lettre, nom géant en filigrane qui glisse au défilement, traînées de
  vitesse pendant les voyages, compteur de distance au Soleil et de temps-lumière, navigation par
  chapitres, grain de pellicule, parallaxe à la souris, ambiance sonore synthétisée (coupée par
  défaut). Respecte `prefers-reduced-motion`.

Une bascule **Classique / Récit** est présente dans l'en-tête des deux pages.

## Fonctionnalités

### Rendu 3D
- **Textures photographiques 2K** — cartes [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0, d'après les données NASA) pour le Soleil, les huit planètes, la Lune, les nuages et les lumières nocturnes de la Terre, les anneaux de Saturne et la Voie lactée (fond de ciel équirectangulaire) — dans `public/textures/`
- **Soleil animé** — la texture solaire « bout » sous un bruit simplex 3D, avec assombrissement centre-bord et couronne ; bloom post-processing
- **Terre** — reflets du soleil sur les océans (masque spéculaire dérivé de la carte), nuages, et lumières des villes qui n'apparaissent que côté nuit (injectées dans le shader Phong via `onBeforeCompile`)
- **Ombres anneaux ↔ globe** — Saturne et Uranus projettent l'ombre de leur anneau sur leur globe (intersection rayon/disque), et leur globe projette son ombre sur l'anneau (intersection rayon/sphère)
- **Atmosphères** — halo doux sur Terre, Vénus, Mars, Uranus, Neptune (fondu vers l'extérieur, sans liseré)
- **Ceinture d'astéroïdes** — rochers bosselés et lisses (trois formes, teintes variées) en `InstancedMesh`
- Le code 3D commun aux deux modes vit dans `src/kit.js`, les données dans `src/data.js`

### Données réelles
- **8 planètes** avec masse, gravité, période orbitale, durée du jour, température, type
- **20 lunes** détaillées (Taille, distance orbitale, teinte, vitesse) — Lune, Phobos, Déimos, Io, Europe, Ganymède, Callisto, Encelade, Dioné, Rhéa, Titan, Japet, Miranda, Ariel, Umbriel, Titania, Obéron, Protée, Triton (rétrograde), Néréide
- Inclinaisons orbitales et axiales réelles (Uranus à 97.8°)

### Récits (storytelling)
Chaque planète — et le Soleil lui-même, cliquable depuis son étiquette — a sa fiche
d'observation enrichie de trois entrées courtes : **origine du nom** (mythologie et
étymologie), **récit** (un épisode marquant de son exploration ou de sa découverte) et
**le saviez-vous ?** (un fait qui donne le vertige). De quoi comprendre non seulement les
chiffres, mais aussi l'histoire humaine et scientifique de chaque monde.

### Navigation
- Orbite caméra libre (glisser / molette / clic)
- **Suivi fluide** — tween easeInOut vers la planète sélectionnée
- **Étiquettes 3D** cliquables (CSS2DRenderer) avec survol
- Vitesse de rotation réglable + pause
- Afficher/masquer les lunes et les étiquettes

### Comparateur pédagogique
- **Taille** — échelle logarithmique entre planètes
- **Distance** — échelle logarithmique UA
- **Taille vs Soleil** — pourcentage du diamètre solaire + cercle visuel
- **Distance Soleil** — distances en kilomètres réels
- Sélection synchronisée (clic sur une barre → la planète suit en 3D)

### Système typographique & identité

L'identité « Observatoire / Field Notes » repose sur un registre **mono + sans** cohérent, **auto-hébergé** (aucune dépendance à Google Fonts) :

| Rôle | Police | Justification |
|---|---|---|
| Corps & textes | **IBM Plex Sans** | Associe au Plex Mono pour former un système familial cohérent ; contraste affirmé vs. le réflexe Inter/Space Grotesk |
| Données, labels, coordonnées | **IBM Plex Mono** | L'identité « carnet de notes / données » justifie un registre tabulaire et technique |

Palette nommée (`:root` dans `src/style.css`) : `--ink`, `--panel`, `--line`, `--muted`, `--paper`, `--cream`, `--amber`, `--cyan` — aucune couleur hexadécimale jetée hors tokens.

### Pages légales & conformité

- `mentions-legales.html`, `confidentialite.html`, `contact.html` (dans `public/`)
- `404.html` personnalisée
- Le site **ne collecte aucune donnée personnelle** ni traceur ; pas de bannière cookies nécessaire.
- Mentions légales : Éditeur (Mahouna, non professionnel), contact (mahounaamg@gmail.com) et mention d'hébergement sont renseignés dans les pages légales (`public/`). L'hébergeur (GitHub Pages) est indiqué.

## Stack technique

| Technologie | Rôle |
|---|---|
| [Three.js](https://threejs.org/) | Rendu 3D, WebGL |
| [Vite](https://vitejs.dev/) | Bundler, dev server |
| Three.js Addons | EffectComposer, UnrealBloomPass, OutputPass, CSS2DRenderer, OrbitControls |
| GLSL | Shader soleil (bruit simplex 3D), atmosphères, ombres d'anneaux, nuage primordial en particules |
| Web Audio | Ambiance sonore du récit, synthétisée (aucun fichier audio) |

## Installation

```bash
git clone https://github.com/LoickAmg/Solar-System.git
cd Solar-System
npm install
npm run dev
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production → `dist/` |
| `npm run preview` | Prévisualisation du build |

## Déploiement

Le site est déployé automatiquement via **GitHub Pages + Actions**.

À chaque push sur `main`, le workflow `.github/workflows/deploy.yml` :
1. Installe les dépendances (`npm ci`)
2. Build le projet (`npm run build`)
3. Déploie le dossier `dist/` sur GitHub Pages

Le site est accessible à : `https://loickamg.github.io/Solar-System/`

## Structure

```
solar-system/
├── .github/workflows/deploy.yml   # CI/CD GitHub Pages
├── public/                         # Favicon, legal.css, pages légales, 404
│   └── textures/                   # Textures Solar System Scope (CC BY 4.0)
├── src/
│   ├── data.js                     # Données des planètes et du Soleil (partagées)
│   ├── kit.js                      # Kit 3D partagé : textures, Soleil, planètes, anneaux, ceinture
│   ├── main.js                     # Mode classique : scène interactive, fiches, comparateur
│   ├── style.css                   # Styles du mode classique + design tokens
│   ├── story.js                    # Mode récit : caméra pilotée par le défilement, effets, son
│   ├── story-content.js            # Texte du récit, chapitre par chapitre
│   └── story.css                   # Styles du récit
├── index.html                      # Mode classique
├── recit.html                      # Mode récit
├── package.json
└── vite.config.js                  # base: '/Solar-System/', deux pages en entrée
```
