# Solar System — Observatoire Orbital

Une visualisation interactive 3D du système solaire, construite avec Three.js et Vite.

[https://loickamg.github.io/Solar-System/](https://loickamg.github.io/Solar-System/)

## Fonctionnalités

### Rendu 3D
- **Soleil animé** — shader GLSL avec bruit simplex 3D (granulation, flares), lueur additive, bloom post-processing
- **Textures procédurales HD** — génération par-pixel sans couture (échantillonnage cos/sin), en 1024×512 à 2048×1024 selon la planète : Terre (continents, océans spéculaires, calottes, nuages), Jupiter (bandes turbulentes + Grande Tache Rouge), Saturne (anneaux avec divisions de Cassini/Encke)
- **Lumières de villes sur la Terre** — un calque de villes généré par code, qui n'apparaît que côté nuit (injecté dans le shader Phong via `onBeforeCompile`, sans dépendance ni image téléchargée)
- **Ombre portée des anneaux** — Saturne et Uranus projettent l'ombre réelle de leur anneau sur leur propre globe, calculée par un test d'intersection rayon/disque dans le shader (position du Soleil, du point de la surface et du plan de l'anneau)
- **Atmosphères Fresnel** — halo rim-light sur Terre, Vénus, Mars, Uranus, Neptune
- **Anneaux texturés** — UV radiaux sur RingGeometry, Saturne (2 anneaux) et Uranus (anneau epsilon)
- **Ceinture d'astéroïdes** — ~550 roches instanciées (InstancedMesh) entre Mars et Jupiter
- **Étoiles scintillantes** — légère variation d'opacité du champ d'étoiles lointain, en continu

### Données réelles
- **8 planètes** avec masse, gravité, période orbitale, durée du jour, température, type
- **20 lunes** détaillées (Taille, distance orbitale, teinte, vitesse) — Lune, Phobos, Déimos, Io, Europe, Ganymède, Callisto, Encelade, Dioné, Rhéa, Titan, Japet, Miranda, Ariel, Umbriel, Titania, Obéron, Protée, Triton (rétrograde), Néréide
- Inclinaisons orbitales et axiales réelles (Uranus à 97.8°)

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
| GLSL | Shader soleil (bruit simplex 3D), atmosphères Fresnel |
| Canvas 2D | Textures procédurales par-pixel |

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
├── src/
│   ├── main.js                     # Point d'entrée : scène, données, textures, UI
│   └── style.css                   # Styles complets + design tokens
├── index.html                      # Shell HTML
├── package.json
└── vite.config.js                  # base: '/Solar-System/'
```
