import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/* ==========================================================
   DONNÉES ENRICHIES — Système solaire
   ========================================================== */
const SUN_DIAMETER = 1392700

const planets = [
  {
    id: 'mercury', name: 'Mercure', type: 'Tellurique',
    diameter: 4879, distance: 0.39, color: 0x9b9da4, accent: '#bfc4cb',
    mass: '3,30 × 10²³ kg', gravity: '3,7 m/s²', orbitalPeriod: '88 jours',
    dayLength: '58,6 jours', temperature: '-180 °C à 430 °C',
    moons: [],
    description: 'Le plus petit monde et le plus proche du Soleil. Sa surface cratérisée connaît des écarts thermiques extrêmes entre le jour et la nuit.'
  },
  {
    id: 'venus', name: 'Vénus', type: 'Tellurique',
    diameter: 12104, distance: 0.72, color: 0xd5a35f, accent: '#f4d6a0',
    mass: '4,87 × 10²⁴ kg', gravity: '8,87 m/s²', orbitalPeriod: '225 jours',
    dayLength: '243 jours', temperature: '462 °C (surface)',
    moons: [],
    description: 'Une planète jumelle de la Terre par sa taille, mais enveloppée d’une atmosphère dense et brûlante à base de CO₂ qui piège la chaleur.'
  },
  {
    id: 'earth', name: 'Terre', type: 'Tellurique',
    diameter: 12756, distance: 1, color: 0x277bb7, accent: '#8fc8d3',
    mass: '5,97 × 10²⁴ kg', gravity: '9,8 m/s²', orbitalPeriod: '365,25 jours',
    dayLength: '23 h 56 min', temperature: '15 °C (moyenne)',
    moons: ['Lune'],
    description: 'Notre planète océan, seule planète connue à abriter une biosphère riche et diversifiée. Une lune unique et massive stabilise son axe.'
  },
  {
    id: 'mars', name: 'Mars', type: 'Tellurique',
    diameter: 6792, distance: 1.52, color: 0xb55e45, accent: '#e9a57f',
    mass: '6,42 × 10²³ kg', gravity: '3,71 m/s²', orbitalPeriod: '687 jours',
    dayLength: '24 h 37 min', temperature: '-63 °C (moyenne)',
    moons: ['Phobos', 'Déimos'],
    description: 'Le désert rouge conserve les traces d’une histoire géologique et hydrologique fascinante. Ses deux lunes sont de petits astéroïdes capturés.'
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'Géante gazeuse',
    diameter: 142984, distance: 5.2, color: 0xbc906a, accent: '#f3d7b0',
    mass: '1,90 × 10²⁷ kg', gravity: '24,79 m/s²', orbitalPeriod: '11,86 ans',
    dayLength: '9 h 55 min', temperature: '-108 °C (nuages)',
    moons: ['Io', 'Europe', 'Ganymède', 'Callisto'],
    description: 'Le géant du système solaire. Ses quatre lunes galiléennes forment un mini-système fascinant. La Grande Tache Rouge est une tempête géante.'
  },
  {
    id: 'saturn', name: 'Saturne', type: 'Géante gazeuse',
    diameter: 120536, distance: 9.54, color: 0xd0b47b, accent: '#f1dbad',
    mass: '5,68 × 10²⁶ kg', gravity: '10,44 m/s²', orbitalPeriod: '29,46 ans',
    dayLength: '10 h 33 min', temperature: '-139 °C (nuages)',
    moons: ['Titan', 'Rhéa', 'Japet', 'Dioné', 'Encelade'],
    description: 'Un monde pâle entouré d’anneaux glacés spectaculaires et d’une famille de lunes remarquables. Titan possède une atmosphère dense.'
  },
  {
    id: 'uranus', name: 'Uranus', type: 'Géante de glace',
    diameter: 51118, distance: 19.19, color: 0x77b8c0, accent: '#c3f0ec',
    mass: '8,68 × 10²⁵ kg', gravity: '8,69 m/s²', orbitalPeriod: '84 ans',
    dayLength: '17 h 14 min', temperature: '-197 °C (nuages)',
    moons: ['Titania', 'Obéron', 'Ariel', 'Umbriel', 'Miranda'],
    description: 'Une géante bleu-vert qui tourne presque sur le côté (inclinaison de 98°), avec un système d’anneaux discrets et une famille de lunes glacées.'
  },
  {
    id: 'neptune', name: 'Neptune', type: 'Géante de glace',
    diameter: 49528, distance: 30.07, color: 0x3d63b5, accent: '#9eb8ff',
    mass: '1,02 × 10²⁶ kg', gravity: '11,15 m/s²', orbitalPeriod: '164,8 ans',
    dayLength: '16 h 6 min', temperature: '-201 °C (nuages)',
    moons: ['Triton', 'Néréide', 'Protée'],
    description: 'La frontière bleue du système solaire, balayée par des vents supersoniques les plus rapides du système. Triton orbite à rebours.'
  },
]

/* ==========================================================
   TEXTURES PROCÉDURALES — Canvas offscreen
   ========================================================== */
function createTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  drawFn(ctx, width, height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function noiseCanvas(ctx, w, h, color, density = 0.3) {
  for (let i = 0; i < w * h * density; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    ctx.fillStyle = color
    ctx.globalAlpha = Math.random() * 0.15
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  ctx.globalAlpha = 1
}

function craters(ctx, w, h, count, baseColor) {
  for (let i = 0; i < count; i++) {
    const cx = Math.random() * w
    const cy = Math.random() * h
    const r = 2 + Math.random() * 12
    const grd = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
    grd.addColorStop(0, 'rgba(0,0,0,0.25)')
    grd.addColorStop(0.6, 'rgba(0,0,0,0.08)')
    grd.addColorStop(1, 'rgba(255,255,255,0.06)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

const textures = {
  mercury: createTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#a0a2a8'
    ctx.fillRect(0, 0, w, h)
    noiseCanvas(ctx, w, h, '#4a4c52', 0.5)
    craters(ctx, w, h, 90, '#6a6c72')
  }),
  venus: createTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4a35f'
    ctx.fillRect(0, 0, w, h)
    noiseCanvas(ctx, w, h, '#b08030', 0.4)
    noiseCanvas(ctx, w, h, '#f0d080', 0.2)
  }),
  earth: createTexture(1024, 512, (ctx, w, h) => {
    // Océan
    ctx.fillStyle = '#1a5fb4'
    ctx.fillRect(0, 0, w, h)
    // Continents simplifiés
    const continents = [
      { x: w * 0.15, y: h * 0.25, r: w * 0.12 },
      { x: w * 0.35, y: h * 0.45, r: w * 0.18 },
      { x: w * 0.55, y: h * 0.30, r: w * 0.14 },
      { x: w * 0.75, y: h * 0.55, r: w * 0.10 },
      { x: w * 0.85, y: h * 0.20, r: w * 0.08 },
    ]
    continents.forEach(c => {
      const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
      grd.addColorStop(0, '#2d8a4e')
      grd.addColorStop(0.5, '#3a9e5f')
      grd.addColorStop(1, 'rgba(45,138,78,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()
    })
    // Glaces
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillRect(0, 0, w, h * 0.08)
    ctx.fillRect(0, h * 0.92, w, h * 0.08)
    // Nuages
    ctx.globalAlpha = 0.35
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const rw = 30 + Math.random() * 100
      const rh = 5 + Math.random() * 15
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }),
  mars: createTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c1440e'
    ctx.fillRect(0, 0, w, h)
    noiseCanvas(ctx, w, h, '#8a2b00', 0.4)
    noiseCanvas(ctx, w, h, '#e8703a', 0.3)
    // Taches sombres
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 10 + Math.random() * 40
      ctx.fillStyle = 'rgba(80,20,0,0.35)'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Pôles
    ctx.fillStyle = 'rgba(255,240,220,0.4)'
    ctx.fillRect(0, 0, w, h * 0.06)
    ctx.fillRect(0, h * 0.94, w, h * 0.06)
  }),
  jupiter: createTexture(1024, 512, (ctx, w, h) => {
    const bands = [
      ['#d4b896', 0.08], ['#c49e6e', 0.12], ['#e8d4b0', 0.18],
      ['#b08a5e', 0.28], ['#f0dcc0', 0.40], ['#a0784a', 0.52],
      ['#dcc0a0', 0.62], ['#c4a67e', 0.72], ['#e8d2b0', 0.82], ['#b08c60', 0.92]
    ]
    bands.forEach(([color, yNorm]) => {
      ctx.fillStyle = color
      ctx.fillRect(0, yNorm * h, w, h * 0.1)
    })
    noiseCanvas(ctx, w, h, '#8a6030', 0.15)
    // Grande Tache Rouge
    ctx.fillStyle = 'rgba(160,60,30,0.7)'
    ctx.beginPath()
    ctx.ellipse(w * 0.65, h * 0.55, w * 0.06, h * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
  }),
  saturn: createTexture(512, 256, (ctx, w, h) => {
    const bands = [
      ['#e0cc9e', 0.1], ['#d4bc88', 0.25], ['#ebd8b4', 0.4],
      ['#cbb078', 0.55], ['#dcc8a0', 0.7], ['#c4aa70', 0.85]
    ]
    bands.forEach(([color, yNorm]) => {
      ctx.fillStyle = color
      ctx.fillRect(0, yNorm * h, w, h * 0.12)
    })
    noiseCanvas(ctx, w, h, '#a08050', 0.15)
  }),
  uranus: createTexture(512, 256, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#7ec0c8')
    grd.addColorStop(0.5, '#a0dce0')
    grd.addColorStop(1, '#6eb0b8')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
    noiseCanvas(ctx, w, h, '#4a9098', 0.2)
  }),
  neptune: createTexture(512, 256, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#3b5eb5')
    grd.addColorStop(0.5, '#4a72d0')
    grd.addColorStop(1, '#2e4a90')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
    noiseCanvas(ctx, w, h, '#1e3060', 0.25)
    // Taches de tempête
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.ellipse(w * 0.4, h * 0.45, w * 0.12, h * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
  }),
  moon: createTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c0c0c0'
    ctx.fillRect(0, 0, w, h)
    craters(ctx, w, h, 40, '#808080')
    noiseCanvas(ctx, w, h, '#505050', 0.3)
  }),
}

/* ==========================================================
   UI — Génération du HTML
   ========================================================== */
const app = document.querySelector('#app')
app.innerHTML = `
  <div class="shell">
    <header class="topbar"><a class="wordmark" href="#top"><span class="mark"><i></i></span><span><strong>SOLAR</strong><small>SYSTEM / FIELD NOTES</small></span></a><div class="status"><span></span> VISUALISATION 3D <b>·</b> OBS-09</div></header>
    <main id="top">
      <section class="hero"><div><p class="kicker">Observatoire orbital <span></span></p><h1>Voir les mondes<br><em>prendre forme.</em></h1></div><div class="hero-copy"><p>Une maquette interactive pour comprendre les proportions, les distances et les familles de notre voisinage cosmique.</p><small>Modèle pédagogique · dimensions et distances compressées pour rester lisibles</small></div></section>
      <section class="workspace">
        <div class="scene-card"><div class="scene-head"><div><label>01 / Navigation spatiale</label><h2>Carte 3D du système solaire</h2></div><div class="scene-tools"><button id="view-system" class="tool-button active" type="button">Système</button><button id="view-selected" class="tool-button" type="button">Focus sélection</button></div></div><div id="scene" class="scene"><div class="scene-overlay"><span class="axis">Y ↑</span><span class="hint">Glisser pour orbiter · molette pour zoomer · clic sur une planète pour détails</span></div></div><div class="scene-foot"><button id="pause" class="primary-button" type="button">Ⅱ <span>Pause</span></button><label class="range-label">Vitesse <input id="speed" type="range" min="0" max="2" step="0.1" value="0.6"><b id="speed-value">0,6×</b></label><button id="toggle-moons" class="link-button" type="button">Masquer lunes</button><button id="reset-camera" class="link-button" type="button">Réinitialiser la vue</button></div></div>
        <aside class="inspector"><label>02 / Fiche d’observation</label><div id="swatch" class="swatch"></div><p id="type" class="planet-type">Tellurique</p><h2 id="name">Terre</h2><p id="description" class="description"></p><div class="facts facts-grid"><div><small>Diamètre équatorial</small><strong id="diameter"></strong></div><div><small>Distance moyenne</small><strong id="distance"></strong></div><div><small>Masse</small><strong id="mass"></strong></div><div><small>Gravité de surface</small><strong id="gravity"></strong></div><div><small>Période orbitale</small><strong id="orbitalPeriod"></strong></div><div><small>Durée du jour</small><strong id="dayLength"></strong></div><div><small>Température moy.</small><strong id="temperature"></strong></div><div><small>Comparée à la Terre</small><strong id="earth-ratio"></strong></div></div><div class="moons"><small>Lunes principales</small><div id="moon-list"></div></div><div class="record"><span></span><code id="record-id">EARTH / TERRE</code></div></aside>
      </section>
      <section class="comparison"><div class="section-head"><div><label>03 / Comparateur pédagogique</label><h2>Les proportions, autrement.</h2></div><div class="compare-switch"><button data-mode="size" class="compare-button active" type="button">Taille</button><button data-mode="distance" class="compare-button" type="button">Distance</button><button data-mode="sun-size" class="compare-button" type="button">Taille vs Soleil</button><button data-mode="sun-dist" class="compare-button" type="button">Distance Soleil</button></div></div><p class="comparison-intro">Les valeurs réelles sont conservées dans les fiches. Les barres utilisent une échelle logarithmique pour rendre visibles les écarts entre les corps célestes.</p><div id="bars" class="bars"></div><div id="sun-compare" class="sun-compare hidden"><div class="sun-visual"><div class="sun-circle"></div><div class="sun-label">Soleil <small>1 392 700 km</small></div></div><div class="planet-vs"><div id="vs-planet" class="vs-planet-circle"></div><div id="vs-planet-name" class="vs-planet-name"></div></div></div></section>
    </main>
    <footer><span>Solar System / Field Notes</span><span>Données de référence : NASA Science</span><span class="mono">BUILD 03 · THREE.JS</span></footer>
  </div>
`

/* ==========================================================
   ÉTAT
   ========================================================== */
let selected = planets[2]
let paused = false
let speed = 0.6
let compareMode = 'size'
let showMoons = true
let vsSunPlanet = planets[2]

/* ==========================================================
   THREE.JS — SCÈNE
   ========================================================== */
const sceneHost = document.querySelector('#scene')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08111f)
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000)
camera.position.set(0, 30, 40)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
sceneHost.prepend(renderer.domElement)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minDistance = 9
controls.maxDistance = 120
controls.target.set(0, 0, 0)

scene.add(new THREE.AmbientLight(0x8098b7, 0.55))
const sunLight = new THREE.PointLight(0xffc16b, 4.5, 140)
sunLight.position.set(0, 0, 0)
scene.add(sunLight)

// Étoiles
const starGeometry = new THREE.BufferGeometry()
const starPositions = []
for (let i = 0; i < 1200; i += 1) {
  const radius = 90 + Math.random() * 120
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  starPositions.push(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb9cbe0, size: 0.22, transparent: true, opacity: 0.72 })))

/* ==========================================================
   SOLEIL
   ========================================================== */
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.15, 40, 40),
  new THREE.MeshBasicMaterial({ color: 0xffbd58 })
)
scene.add(sun)
const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(2.7, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xff9d3d, transparent: true, opacity: 0.12, side: THREE.BackSide })
)
scene.add(sunGlow)
// Corona
const sunCorona = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.04, side: THREE.BackSide })
)
scene.add(sunCorona)

/* ==========================================================
   PLANÈTES ET LUNES
   ========================================================== */
const planetObjects = []
const orbitGroups = []
const moonGroups = []
const distanceScale = (distance) => 4.8 + Math.log(distance + 1) * 5.8
const visualRadius = (diameter) => 0.34 + Math.pow(diameter / 12756, 0.43) * 0.52

planets.forEach((planet, index) => {
  const orbitRadius = distanceScale(planet.distance)

  // Orbite
  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(orbitRadius - 0.012, orbitRadius + 0.012, 128),
    new THREE.MeshBasicMaterial({ color: 0x93aeca, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
  )
  orbit.rotation.x = Math.PI / 2
  scene.add(orbit)

  // Groupe planète
  const group = new THREE.Group()
  const radius = visualRadius(planet.diameter)

  // Matériau avec texture
  const texture = textures[planet.id] || null
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: texture ? 0xffffff : planet.color,
    roughness: 0.78,
    metalness: 0.02,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 32), material)
  mesh.userData.planet = planet
  mesh.position.x = orbitRadius
  group.add(mesh)

  // Atmosphère / halo pour Terre et Vénus
  if (planet.id === 'earth' || planet.id === 'venus') {
    const haloColor = planet.id === 'earth' ? 0x6fa8dc : 0xd5a35f
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({ color: haloColor, transparent: true, opacity: 0.12, side: THREE.BackSide })
    )
    mesh.add(halo)
  }

  // Anneaux
  if (planet.id === 'saturn') {
    const ringGeo = new THREE.RingGeometry(radius * 1.25, radius * 2.15, 96)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd7bf91, transparent: true, opacity: 0.65, side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.3
    mesh.add(ring)
    // Anneau secondaire plus fin
    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(radius * 2.25, radius * 2.45, 96),
      new THREE.MeshBasicMaterial({ color: 0xcbb078, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    )
    ring2.rotation.x = Math.PI / 2.3
    mesh.add(ring2)
  }
  if (planet.id === 'uranus') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.6, radius * 1.9, 64),
      new THREE.MeshBasicMaterial({ color: 0x88a8a8, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    )
    ring.rotation.x = Math.PI / 1.9
    mesh.add(ring)
  }

  // Lunes
  const moons = []
  planet.moons.forEach((moonName, mi) => {
    const moonRadius = radius * (0.12 + Math.random() * 0.1)
    const moonOrbitRadius = radius * (1.6 + mi * 0.55 + Math.random() * 0.3)
    const moonMat = new THREE.MeshStandardMaterial({
      map: textures.moon,
      color: 0xdddddd,
      roughness: 0.92,
      metalness: 0.01
    })
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 16, 12), moonMat)
    moonMesh.userData = { moon: true, name: moonName, planetId: planet.id }
    const moonGroup = new THREE.Group()
    moonMesh.position.x = moonOrbitRadius
    moonGroup.add(moonMesh)
    // Orbite lunaire (anneau très fin)
    const moonOrbitVis = new THREE.Mesh(
      new THREE.RingGeometry(moonOrbitRadius - 0.008, moonOrbitRadius + 0.008, 64),
      new THREE.MeshBasicMaterial({ color: 0x93aeca, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    )
    moonOrbitVis.rotation.x = Math.PI / 2
    moonGroup.add(moonOrbitVis)
    group.add(moonGroup)
    moons.push({ mesh: moonMesh, group: moonGroup, angle: mi * 1.3, speed: 0.8 + Math.random() * 1.2, radius: moonOrbitRadius })
  })

  scene.add(group)
  orbitGroups.push(group)
  planetObjects.push({ planet, mesh, group, orbitRadius, angle: index * 0.78, moons })
  moonGroups.push(...moons)
})

/* ==========================================================
   INTERACTIONS — Raycaster
   ========================================================== */
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(planetObjects.map((item) => item.mesh))
  if (hits[0]?.object.userData.planet) {
    selectPlanet(hits[0].object.userData.planet)
  }
})

/* ==========================================================
   UI — Mise à jour de la fiche planète
   ========================================================== */
function selectPlanet(planet) {
  selected = planet
  vsSunPlanet = planet
  const hex = `#${planet.color.toString(16).padStart(6, '0')}`
  document.querySelector('#swatch').style.setProperty('--planet', hex)
  document.querySelector('#swatch').style.setProperty('--accent', planet.accent)
  document.querySelector('#type').textContent = planet.type
  document.querySelector('#name').textContent = planet.name
  document.querySelector('#description').textContent = planet.description
  document.querySelector('#diameter').textContent = `${planet.diameter.toLocaleString('fr-FR')} km`
  document.querySelector('#distance').textContent = `${planet.distance.toLocaleString('fr-FR')} UA`
  document.querySelector('#mass').textContent = planet.mass
  document.querySelector('#gravity').textContent = planet.gravity
  document.querySelector('#orbitalPeriod').textContent = planet.orbitalPeriod
  document.querySelector('#dayLength').textContent = planet.dayLength
  document.querySelector('#temperature').textContent = planet.temperature
  document.querySelector('#earth-ratio').textContent = `${(planet.diameter / 12756).toFixed(2).replace('.', ',')} ×`
  document.querySelector('#moon-count').textContent = planet.moons.length
    ? `${planet.moons.length} principale${planet.moons.length > 1 ? 's' : ''}`
    : 'Aucune connue'
  document.querySelector('#moon-list').innerHTML = planet.moons.length
    ? planet.moons.map((moon) => `<span>${moon}</span>`).join('')
    : '<span class="empty">Aucune lune principale</span>'
  document.querySelector('#record-id').textContent = `${planet.id.toUpperCase()} / ${planet.name.toUpperCase()}`
  document.querySelector('#view-selected').click()
  renderBars()
  renderSunCompare()
}

/* ==========================================================
   COMPARATEUR
   ========================================================== */
function renderBars() {
  const max = Math.max(...planets.map((p) => {
    if (compareMode === 'size') return p.diameter
    if (compareMode === 'distance') return p.distance
    if (compareMode === 'sun-size') return p.diameter
    if (compareMode === 'sun-dist') return p.distance
    return p.diameter
  }))

  const sunCompareEl = document.querySelector('#sun-compare')
  if (compareMode === 'sun-size' || compareMode === 'sun-dist') {
    sunCompareEl.classList.remove('hidden')
  } else {
    sunCompareEl.classList.add('hidden')
  }

  document.querySelector('#bars').innerHTML = planets.map((planet, index) => {
    let value, label, width
    if (compareMode === 'size') {
      value = planet.diameter
      width = Math.max(3, Math.pow(value / max, 0.42) * 100)
      label = `${planet.diameter.toLocaleString('fr-FR')} km`
    } else if (compareMode === 'distance') {
      value = planet.distance
      width = Math.max(3, Math.pow(value / max, 0.42) * 100)
      label = `${planet.distance.toLocaleString('fr-FR')} UA`
    } else if (compareMode === 'sun-size') {
      value = planet.diameter
      width = Math.max(1.5, (value / SUN_DIAMETER) * 100)
      label = `${(value / SUN_DIAMETER * 100).toFixed(2).replace('.', ',')} % du Soleil`
    } else if (compareMode === 'sun-dist') {
      value = planet.distance
      const distKm = Math.round(value * 149597870.7)
      width = Math.max(1.5, Math.pow(value / max, 0.42) * 100)
      label = `${distKm.toLocaleString('fr-FR')} km`
    }
    return `<button class="bar-row ${planet.id === selected.id ? 'selected' : ''}" data-planet="${planet.id}" type="button"><span class="bar-index">${String(index + 1).padStart(2, '0')}</span><span class="bar-name">${planet.name}</span><span class="bar-track"><i style="width:${width}%;background:${planet.accent}"></i></span><strong>${label}</strong></button>`
  }).join('')
}

function renderSunCompare() {
  const circle = document.querySelector('#vs-planet')
  const name = document.querySelector('#vs-planet-name')
  const ratio = vsSunPlanet.diameter / SUN_DIAMETER
  const sizePx = Math.max(6, Math.sqrt(ratio) * 180)
  circle.style.width = `${sizePx}px`
  circle.style.height = `${sizePx}px`
  circle.style.background = vsSunPlanet.accent
  name.textContent = `${vsSunPlanet.name} — ${(ratio * 100).toFixed(2).replace('.', ',')} % du diamètre solaire`
}

/* ==========================================================
   ÉCOUTEURS UI
   ========================================================== */
document.querySelector('#bars').addEventListener('click', (event) => {
  const row = event.target.closest('.bar-row')
  if (row) selectPlanet(planets.find((p) => p.id === row.dataset.planet))
})

document.querySelectorAll('.compare-button').forEach((button) => button.addEventListener('click', () => {
  compareMode = button.dataset.mode
  document.querySelectorAll('.compare-button').forEach((item) => item.classList.toggle('active', item === button))
  renderBars()
}))

document.querySelector('#pause').addEventListener('click', (event) => {
  paused = !paused
  event.currentTarget.innerHTML = paused ? '▶ <span>Lecture</span>' : 'Ⅱ <span>Pause</span>'
})

document.querySelector('#speed').addEventListener('input', (event) => {
  speed = Number(event.target.value)
  document.querySelector('#speed-value').textContent = `${speed.toFixed(1).replace('.', ',')}×`
})

document.querySelector('#reset-camera').addEventListener('click', () => {
  camera.position.set(0, 30, 40)
  controls.target.set(0, 0, 0)
  controls.update()
})

document.querySelector('#toggle-moons').addEventListener('click', (event) => {
  showMoons = !showMoons
  event.currentTarget.textContent = showMoons ? 'Masquer lunes' : 'Afficher lunes'
  moonGroups.forEach((m) => { m.group.visible = showMoons })
})

document.querySelector('#view-system').addEventListener('click', () => {
  controls.target.set(0, 0, 0)
  camera.position.set(0, 30, 40)
  controls.update()
  document.querySelector('#view-system').classList.add('active')
  document.querySelector('#view-selected').classList.remove('active')
})

document.querySelector('#view-selected').addEventListener('click', () => {
  const item = planetObjects.find((entry) => entry.planet.id === selected.id)
  controls.target.set(item.mesh.position.x / 2, 0, 0)
  camera.position.set(item.mesh.position.x + 6, 7, item.mesh.position.x + 9)
  controls.update()
  document.querySelector('#view-selected').classList.add('active')
  document.querySelector('#view-system').classList.remove('active')
})

/* ==========================================================
   REDIMENSIONNEMENT & ANIMATION
   ========================================================== */
function resize() {
  const width = sceneHost.clientWidth
  const height = sceneHost.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}
window.addEventListener('resize', resize)

function animate(time) {
  requestAnimationFrame(animate)
  const delta = time * 0.00001 * speed

  if (!paused) {
    sun.rotation.y += 0.002
    sunGlow.rotation.y -= 0.001
    sunCorona.rotation.y += 0.0005

    planetObjects.forEach((item, index) => {
      item.angle = index * 0.78 + delta / (0.7 + index * 0.35)
      item.group.rotation.y = item.angle
      item.mesh.rotation.y += 0.004
    })

    moonGroups.forEach((moon) => {
      moon.angle += 0.008 * moon.speed * speed
      moon.group.rotation.y = moon.angle
    })
  }

  controls.update()
  renderer.render(scene, camera)
}

selectPlanet(selected)
renderBars()
renderSunCompare()
requestAnimationFrame(animate)
