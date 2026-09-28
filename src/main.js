import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { planets, sunInfo, SUN_DIAMETER } from './data.js'
import { loadTextures, createSun, createPlanet, createBelt, createStarField, circleLine, easeInOut } from './kit.js'

/* ==========================================================
   UI — Génération du HTML
   ========================================================== */
const app = document.querySelector('#app')
app.innerHTML = `
  <div class="shell">
    <header class="topbar"><a class="wordmark" href="#top"><span class="mark"><i></i></span><span><strong>SOLAR</strong><small>SYSTEM / FIELD NOTES</small></span></a><nav class="mode-switch" aria-label="Mode de visite"><a class="active" href="./" aria-current="page">Classique</a><a href="recit.html">Récit</a></nav></header>
    <main id="top">
      <section class="hero"><div><p class="kicker">Observatoire orbital <span></span></p><h1>Voir les mondes<br><em>prendre forme.</em></h1></div><div class="hero-copy"><p>Une maquette interactive pour comprendre les proportions, les distances et les familles de notre voisinage cosmique.</p><a class="story-cta" href="recit.html"><span aria-hidden="true">▶</span> Vivre le récit du système solaire</a><small>Modèle pédagogique · dimensions et distances compressées pour rester lisibles</small></div></section>
      <section class="workspace">
        <div class="scene-card"><div class="scene-head"><div><label>01 / Navigation spatiale</label><h2>Carte 3D du système solaire</h2></div><div class="scene-tools"><button id="view-system" class="tool-button active" type="button">Système</button><button id="view-selected" class="tool-button" type="button">Suivre la sélection</button></div></div><div id="scene" class="scene"><div id="scene-loader" class="scene-loader"><span class="loader-mark"></span><span class="loader-text">Initialisation du moteur 3D…</span></div><div class="scene-overlay"><span class="axis">Y ↑</span><span class="hint">Glisser pour orbiter · molette pour zoomer · clic sur une planète pour la suivre</span></div></div><div class="scene-foot"><button id="pause" class="primary-button" type="button">Ⅱ <span>Pause</span></button><label class="range-label">Vitesse <input id="speed" type="range" min="0" max="2" step="0.1" value="0.6"><b id="speed-value">0,6×</b></label><button id="toggle-moons" class="link-button" type="button">Masquer lunes</button><button id="toggle-labels" class="link-button" type="button">Masquer étiquettes</button><button id="reset-camera" class="link-button" type="button">Réinitialiser la vue</button></div></div>
        <aside class="inspector"><label>02 / Fiche d’observation</label><div id="swatch" class="swatch"></div><p id="type" class="planet-type">Tellurique</p><h2 id="name">Terre</h2><p id="description" class="description"></p><div class="lore"><p class="lore-entry"><small>Origine du nom</small><span id="myth"></span></p><p class="lore-entry"><small>Récit</small><span id="story"></span></p><p class="lore-entry lore-wow"><small>Le saviez-vous ?</small><span id="wow"></span></p></div><div class="facts facts-grid"><div><small>Diamètre équatorial</small><strong id="diameter"></strong></div><div><small>Distance moyenne</small><strong id="distance"></strong></div><div><small>Masse</small><strong id="mass"></strong></div><div><small>Gravité de surface</small><strong id="gravity"></strong></div><div><small>Période orbitale</small><strong id="orbitalPeriod"></strong></div><div><small>Durée du jour</small><strong id="dayLength"></strong></div><div><small>Température moy.</small><strong id="temperature"></strong></div><div><small>Comparée à la Terre</small><strong id="earth-ratio"></strong></div></div><div class="moons"><small>Lunes principales <b id="moon-count">—</b></small><div id="moon-list"></div></div><div class="record"><span></span><code id="record-id">EARTH / TERRE</code></div></aside>
      </section>
      <section class="comparison"><div class="section-head"><div><label>03 / Comparateur pédagogique</label><h2>Les proportions, autrement.</h2></div><div class="compare-switch"><button data-mode="size" class="compare-button active" type="button">Taille</button><button data-mode="distance" class="compare-button" type="button">Distance</button><button data-mode="sun-size" class="compare-button" type="button">Taille vs Soleil</button><button data-mode="sun-dist" class="compare-button" type="button">Distance Soleil</button></div></div><p class="comparison-intro">Les valeurs réelles sont conservées dans les fiches. Les barres utilisent une échelle logarithmique pour rendre visibles les écarts entre les corps célestes.</p><div id="bars" class="bars"></div><div id="sun-compare" class="sun-compare hidden"><div class="sun-visual"><div class="sun-circle"></div><div class="sun-label">Soleil <small>1 392 700 km</small></div></div><div class="planet-vs"><div id="vs-planet" class="vs-planet-circle"></div><div id="vs-planet-name" class="vs-planet-name"></div></div></div></section>
    </main>
    <footer><span>Solar System / Field Notes</span><span>Données de référence : NASA Science · Textures : <a href="https://www.solarsystemscope.com/textures/" rel="noopener">Solar System Scope</a> (CC BY 4.0)</span><span class="footer-links mono"><a href="mentions-legales.html">Mentions légales</a><a href="confidentialite.html">Confidentialité</a><a href="contact.html">Contact</a></span></footer>
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
let showLabels = true
let vsSunPlanet = planets[2]
let followId = null
let camTween = null
const lastFollow = new THREE.Vector3()
const labelEls = {}
const HOME_POS = new THREE.Vector3(0, 32, 44)

/* ==========================================================
   THREE.JS — SCÈNE, RENDU, POST-PROCESSING
   ========================================================== */
const sceneHost = document.querySelector('#scene')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200)
camera.position.copy(HOME_POS)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
sceneHost.prepend(renderer.domElement)

const loadingManager = new THREE.LoadingManager()
const tx = loadTextures(renderer, loadingManager)
scene.background = tx.sky
scene.backgroundIntensity = 0.9

const composer = new EffectComposer(renderer)
composer.setPixelRatio(renderer.getPixelRatio())
composer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new UnrealBloomPass(new THREE.Vector2(sceneHost.clientWidth, sceneHost.clientHeight), 0.62, 0.55, 0.86))
composer.addPass(new OutputPass())

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2'
sceneHost.appendChild(labelRenderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minDistance = 3.5
controls.maxDistance = 150
controls.target.set(0, 0, 0)

scene.add(new THREE.AmbientLight(0x404a5c, 0.35))
scene.add(new THREE.PointLight(0xfff1d6, 3.4, 0, 0))

const starsNear = createStarField(260, 2.4, 0.9)
scene.add(starsNear)

/* ---- Soleil ---- */
const sun = createSun(tx)
scene.add(sun.group)

function makeLabel(text, color) {
  const div = document.createElement('div')
  div.className = 'p-label'
  div.innerHTML = `<i style="background:${color}"></i><span>${text}</span>`
  return div
}
const sunLabelDiv = makeLabel('Soleil', '#ffbd58')
sunLabelDiv.addEventListener('click', (e) => { e.stopPropagation(); selectPlanet(sunInfo) })
const sunLabel = new CSS2DObject(sunLabelDiv)
sunLabel.position.set(0, 3.5, 0)
scene.add(sunLabel)

/* Réticule fin en quatre arcs : un tracé net, sans halo flou, dont la périphérie est
   strictement transparente (un voile quasi invisible deviendrait visible sur le ciel noir). */
function selectRingTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512
  const x = c.getContext('2d')
  x.strokeStyle = '#e6ae61'; x.lineWidth = 4; x.lineCap = 'round'
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + 0.22
    x.beginPath(); x.arc(256, 256, 236, a, a + Math.PI / 2 - 0.44); x.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ==========================================================
   PLANÈTES ET LUNES
   ========================================================== */
const planetObjects = []
const moonGroups = []
const distanceScale = (distance) => 4.8 + Math.log(distance + 1) * 5.8
const selRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: selectRingTexture(), color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false }))
selRing.visible = false
selRing.renderOrder = 999

planets.forEach((planet, index) => {
  const orbitRadius = distanceScale(planet.distance)
  const inclGroup = new THREE.Group()
  inclGroup.rotation.x = THREE.MathUtils.degToRad(planet.incl)
  inclGroup.rotation.y = index * 1.7
  scene.add(inclGroup)
  inclGroup.add(circleLine(orbitRadius, 0x93aeca, 0.2))

  const pivot = new THREE.Group()
  inclGroup.add(pivot)
  const body = createPlanet(planet, tx)
  body.holder.position.x = orbitRadius
  pivot.add(body.holder)
  body.moons.forEach((m) => moonGroups.push(m))

  const labelDiv = makeLabel(planet.name, planet.accent)
  labelDiv.addEventListener('click', (e) => { e.stopPropagation(); selectPlanet(planet) })
  const label = new CSS2DObject(labelDiv)
  label.position.set(0, body.radius * 1.75 + 0.18, 0)
  body.holder.add(label)
  labelEls[planet.id] = labelDiv

  planetObjects.push({
    ...body, pivot,
    angle: index * 0.78 + Math.random() * 0.5,
    orbitSpeed: 0.35 / planet.period,
  })
})

/* ==========================================================
   CEINTURE D'ASTÉROÏDES
   ========================================================== */
const beltGroup = createBelt(tx, { count: 900, rMin: distanceScale(2.15), rMax: distanceScale(3.25), thickness: 0.55, size: [0.02, 0.08] })
scene.add(beltGroup)


/* ==========================================================
   INTERACTIONS — Raycaster (survol + clic avec seuil de glissement)
   ========================================================== */
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let downX = 0, downY = 0

function pick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(planetObjects.map((item) => item.mesh), false)
  return hits[0]?.object.userData.planet || null
}
renderer.domElement.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY })
renderer.domElement.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return
  const planet = pick(e.clientX, e.clientY)
  if (planet) selectPlanet(planet)
})
renderer.domElement.addEventListener('pointermove', (e) => {
  const planet = pick(e.clientX, e.clientY)
  renderer.domElement.style.cursor = planet ? 'pointer' : ''
  Object.entries(labelEls).forEach(([id, el]) => el.classList.toggle('hover', planet?.id === id))
})

/* ==========================================================
   UI — Mise à jour de la fiche planète
   ========================================================== */
function selectPlanet(planet, skipFocus = false) {
  selected = planet
  if (planet.id !== 'sun') vsSunPlanet = planet
  const hex = `#${planet.color.toString(16).padStart(6, '0')}`
  document.querySelector('#swatch').style.setProperty('--planet', hex)
  document.querySelector('#swatch').style.setProperty('--accent', planet.accent)
  document.querySelector('#type').textContent = planet.type
  document.querySelector('#name').textContent = planet.name
  document.querySelector('#description').textContent = planet.description
  document.querySelector('#myth').textContent = planet.myth || ''
  document.querySelector('#story').textContent = planet.story || ''
  document.querySelector('#wow').textContent = planet.wow || ''
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
    ? planet.moons.map((m) => `<span>${m.name}</span>`).join('')
    : '<span class="empty">Aucune lune principale</span>'
  document.querySelector('#record-id').textContent = `${planet.id.toUpperCase()} / ${planet.name.toUpperCase()}`
  const item = planetObjects.find((o) => o.planet.id === planet.id)
  if (item) {
    item.holder.add(selRing)
    selRing.scale.setScalar(item.ringOuter * 2.9)
    selRing.visible = true
  } else {
    selRing.visible = false
  }
  Object.entries(labelEls).forEach(([id, el]) => el.classList.toggle('active', id === planet.id))
  sunLabelDiv.classList.toggle('active', planet.id === 'sun')
  renderBars()
  renderSunCompare()
  if (!skipFocus) startFollow(planet)
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

document.querySelector('#toggle-moons').addEventListener('click', (event) => {
  showMoons = !showMoons
  event.currentTarget.textContent = showMoons ? 'Masquer lunes' : 'Afficher lunes'
  moonGroups.forEach((m) => { m.group.visible = showMoons })
})

document.querySelector('#toggle-labels').addEventListener('click', (event) => {
  showLabels = !showLabels
  event.currentTarget.textContent = showLabels ? 'Masquer étiquettes' : 'Afficher étiquettes'
  sceneHost.classList.toggle('labels-hidden', !showLabels)
})

document.querySelector('#reset-camera').addEventListener('click', () => {
  document.querySelector('#view-system').click()
})

function setActiveView(id) {
  document.querySelector('#view-system').classList.toggle('active', id === 'system')
  document.querySelector('#view-selected').classList.toggle('active', id === 'selected')
}
function tweenHome() {
  followId = null
  camTween = { t: 0, dur: 1.4, follow: false, fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos: HOME_POS.clone(), toTarget: new THREE.Vector3(0, 0, 0) }
  controls.enabled = false
}
function startFollow(planet) {
  const item = planetObjects.find((o) => o.planet.id === planet.id)
  if (!item) { setActiveView('system'); tweenHome(); return }
  followId = planet.id
  setActiveView('selected')
  const wp = new THREE.Vector3(); item.holder.getWorldPosition(wp)
  // Vue de trois-quarts côté jour : la caméra se place entre la planète et le Soleil, décalée sur le côté.
  const toSun = wp.clone().negate().normalize()
  const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), toSun).normalize()
  const dir = toSun.multiplyScalar(0.55).add(side.multiplyScalar(0.8)).add(new THREE.Vector3(0, 0.38, 0)).normalize()
  const offset = dir.multiplyScalar(item.ringOuter * 4.6)
  camTween = { t: 0, dur: 1.4, follow: true, item, offset, fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos: new THREE.Vector3(), toTarget: new THREE.Vector3() }
  controls.enabled = false
}

document.querySelector('#view-system').addEventListener('click', () => {
  setActiveView('system')
  tweenHome()
})
document.querySelector('#view-selected').addEventListener('click', () => {
  startFollow(selected)
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
  composer.setSize(width, height)
  labelRenderer.setSize(width, height)
}
new ResizeObserver(resize).observe(sceneHost)
resize()

const _wp = new THREE.Vector3()
const _delta = new THREE.Vector3()
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)

  if (!paused) {
    sun.uniforms.uTime.value += dt
    sun.mesh.rotation.y += 0.02 * dt * speed
    beltGroup.rotation.y += 0.08 * dt * speed
    planetObjects.forEach((item) => {
      item.angle += item.orbitSpeed * speed * dt
      item.pivot.rotation.y = item.angle
      item.spin(dt, speed)
    })
  }
  scene.updateMatrixWorld(true)
  planetObjects.forEach((item) => item.updateShadows())

  if (camTween) {
    camTween.t += dt
    const k = easeInOut(Math.min(camTween.t / camTween.dur, 1))
    if (camTween.follow) {
      camTween.item.holder.getWorldPosition(_wp)
      camTween.toTarget.copy(_wp)
      camTween.toPos.copy(_wp).add(camTween.offset)
    }
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, k)
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, k)
    camera.lookAt(controls.target)
    if (camTween.t >= camTween.dur) {
      const done = camTween
      camTween = null
      controls.enabled = true
      if (done.follow) done.item.holder.getWorldPosition(lastFollow)
      controls.update()
    }
  } else {
    if (followId) {
      const item = planetObjects.find((o) => o.planet.id === followId)
      if (item) {
        item.holder.getWorldPosition(_wp)
        _delta.subVectors(_wp, lastFollow)
        camera.position.add(_delta)
        controls.target.copy(_wp)
        lastFollow.copy(_wp)
      }
    }
    controls.update()
  }

  composer.render()
  labelRenderer.render(scene, camera)
}

selectPlanet(selected, true)
renderBars()
renderSunCompare()
const loaderEl = document.querySelector('#scene-loader')
const loaderText = loaderEl.querySelector('.loader-text')
loadingManager.onProgress = (_url, loaded, total) => { loaderText.textContent = `Chargement des textures… ${Math.round((loaded / total) * 100)} %` }
loadingManager.onLoad = () => loaderEl.classList.add('done')
requestAnimationFrame(animate)
