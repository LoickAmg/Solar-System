import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const planets = [
  { id:'mercury', name:'Mercure', type:'Tellurique', diameter:4879, distance:0.39, color:0x9b9da4, accent:'#bfc4cb', moons:[], description:'Le plus petit monde et le plus proche du Soleil. Sa surface cratérisée connaît des écarts thermiques extrêmes.' },
  { id:'venus', name:'Vénus', type:'Tellurique', diameter:12104, distance:0.72, color:0xd5a35f, accent:'#f4d6a0', moons:[], description:'Une planète jumelle de la Terre par sa taille, mais enveloppée d’une atmosphère dense et brûlante.' },
  { id:'earth', name:'Terre', type:'Tellurique', diameter:12756, distance:1, color:0x277bb7, accent:'#8fc8d3', moons:['Lune'], description:'Notre planète océan, seule planète connue à abriter une biosphère riche et diversifiée.' },
  { id:'mars', name:'Mars', type:'Tellurique', diameter:6792, distance:1.52, color:0xb55e45, accent:'#e9a57f', moons:['Phobos','Déimos'], description:'Le désert rouge conserve les traces d’une histoire géologique et hydrologique fascinante.' },
  { id:'jupiter', name:'Jupiter', type:'Géante gazeuse', diameter:142984, distance:5.2, color:0xbc906a, accent:'#f3d7b0', moons:['Io','Europe','Ganymède','Callisto'], description:'Le géant du système solaire. Ses quatre lunes galiléennes forment un mini-système fascinant.' },
  { id:'saturn', name:'Saturne', type:'Géante gazeuse', diameter:120536, distance:9.54, color:0xd0b47b, accent:'#f1dbad', moons:['Titan','Rhéa','Japet','Dioné','Encelade'], description:'Un monde pâle entouré d’anneaux glacés et d’une famille de lunes remarquables.' },
  { id:'uranus', name:'Uranus', type:'Géante de glace', diameter:51118, distance:19.19, color:0x77b8c0, accent:'#c3f0ec', moons:['Titania','Obéron','Ariel','Umbriel','Miranda'], description:'Une géante bleu-vert qui tourne presque sur le côté, avec un système d’anneaux discret.' },
  { id:'neptune', name:'Neptune', type:'Géante de glace', diameter:49528, distance:30.07, color:0x3d63b5, accent:'#9eb8ff', moons:['Triton','Néréide','Protée'], description:'La frontière bleue du système solaire, balayée par des vents supersoniques.' },
]

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="shell">
    <header class="topbar"><a class="wordmark" href="#top"><span class="mark"><i></i></span><span><strong>SOLAR</strong><small>SYSTEM / FIELD NOTES</small></span></a><div class="status"><span></span> VISUALISATION 3D <b>·</b> OBS-09</div></header>
    <main id="top">
      <section class="hero"><div><p class="kicker">Observatoire orbital <span></span></p><h1>Voir les mondes<br><em>prendre forme.</em></h1></div><div class="hero-copy"><p>Une maquette interactive pour comprendre les proportions, les distances et les familles de notre voisinage cosmique.</p><small>Modèle pédagogique · dimensions et distances compressées pour rester lisibles</small></div></section>
      <section class="workspace">
        <div class="scene-card"><div class="scene-head"><div><label>01 / Navigation spatiale</label><h2>Carte 3D du système solaire</h2></div><div class="scene-tools"><button id="view-system" class="tool-button active" type="button">Système</button><button id="view-selected" class="tool-button" type="button">Focus sélection</button></div></div><div id="scene" class="scene"><div class="scene-overlay"><span class="axis">Y ↑</span><span class="hint">Glisser pour orbiter · molette pour zoomer</span></div></div><div class="scene-foot"><button id="pause" class="primary-button" type="button">Ⅱ <span>Pause</span></button><label class="range-label">Vitesse <input id="speed" type="range" min="0" max="2" step="0.1" value="0.6"><b id="speed-value">0,6×</b></label><button id="reset-camera" class="link-button" type="button">Réinitialiser la vue</button></div></div>
        <aside class="inspector"><label>02 / Fiche d’observation</label><div id="swatch" class="swatch"></div><p id="type" class="planet-type">Tellurique</p><h2 id="name">Terre</h2><p id="description" class="description"></p><div class="facts"><div><small>Diamètre équatorial</small><strong id="diameter"></strong></div><div><small>Distance moyenne</small><strong id="distance"></strong></div><div><small>Comparée à la Terre</small><strong id="earth-ratio"></strong></div><div><small>Lunes principales</small><strong id="moon-count"></strong></div></div><div class="moons"><small>Lunes à observer</small><div id="moon-list"></div></div><div class="record"><span></span><code id="record-id">EARTH / TERRE</code></div></aside>
      </section>
      <section class="comparison"><div class="section-head"><div><label>03 / Comparateur pédagogique</label><h2>Les proportions, autrement.</h2></div><div class="compare-switch"><button data-mode="size" class="compare-button active" type="button">Taille</button><button data-mode="distance" class="compare-button" type="button">Distance</button></div></div><p class="comparison-intro">Les valeurs réelles sont conservées dans les fiches. Les barres utilisent une échelle logarithmique pour rendre visibles les écarts entre Mercure, la Terre et les géantes.</p><div id="bars" class="bars"></div></section>
    </main>
    <footer><span>Solar System / Field Notes</span><span>Données de référence : NASA Science</span><span class="mono">BUILD 02 · THREE.JS</span></footer>
  </div>
`

let selected = planets[2]
let paused = false
let speed = 0.6
let compareMode = 'size'

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
controls.maxDistance = 80
controls.target.set(0, 0, 0)
scene.add(new THREE.AmbientLight(0x8098b7, 0.72))
const sunLight = new THREE.PointLight(0xffc16b, 3.5, 90)
sunLight.position.set(0, 0, 0)
scene.add(sunLight)

const starGeometry = new THREE.BufferGeometry()
const starPositions = []
for (let i = 0; i < 850; i += 1) {
  const radius = 90 + Math.random() * 80
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  starPositions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta))
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb9cbe0, size: 0.22, transparent: true, opacity: 0.72 })))

const sun = new THREE.Mesh(new THREE.SphereGeometry(2.15, 40, 40), new THREE.MeshBasicMaterial({ color: 0xffbd58 }))
scene.add(sun)
const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff9d3d, transparent: true, opacity: 0.1, side: THREE.BackSide }))
scene.add(sunGlow)
const planetObjects = []
const orbitGroups = []
const distanceScale = (distance) => 4.8 + Math.log(distance + 1) * 5.8
const visualRadius = (diameter) => 0.34 + Math.pow(diameter / 12756, 0.43) * 0.52

planets.forEach((planet, index) => {
  const orbitRadius = distanceScale(planet.distance)
  const orbit = new THREE.Mesh(new THREE.RingGeometry(orbitRadius - 0.012, orbitRadius + 0.012, 128), new THREE.MeshBasicMaterial({ color: 0x93aeca, transparent: true, opacity: 0.16, side: THREE.DoubleSide }))
  orbit.rotation.x = Math.PI / 2
  scene.add(orbit)
  const group = new THREE.Group()
  const radius = visualRadius(planet.diameter)
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), new THREE.MeshStandardMaterial({ color: planet.color, roughness: 0.75, metalness: 0.02 }))
  mesh.userData.planet = planet
  mesh.position.x = orbitRadius
  group.add(mesh)
  if (planet.id === 'saturn') {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.35, radius * 2.05, 64), new THREE.MeshBasicMaterial({ color: 0xd7bf91, transparent: true, opacity: 0.75, side: THREE.DoubleSide }))
    ring.rotation.x = Math.PI / 2.5
    mesh.add(ring)
  }
  scene.add(group)
  orbitGroups.push(group)
  planetObjects.push({ planet, mesh, group, orbitRadius, angle: index * 0.78 })
})

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObjects(planetObjects.map((item) => item.mesh))[0]
  if (hit?.object.userData.planet) selectPlanet(hit.object.userData.planet)
})

function selectPlanet(planet) {
  selected = planet
  document.querySelector('#swatch').style.setProperty('--planet', `#${planet.color.toString(16).padStart(6, '0')}`)
  document.querySelector('#swatch').style.setProperty('--accent', planet.accent)
  document.querySelector('#type').textContent = planet.type
  document.querySelector('#name').textContent = planet.name
  document.querySelector('#description').textContent = planet.description
  document.querySelector('#diameter').textContent = `${planet.diameter.toLocaleString('fr-FR')} km`
  document.querySelector('#distance').textContent = `${planet.distance.toLocaleString('fr-FR')} UA`
  document.querySelector('#earth-ratio').textContent = `${(planet.diameter / 12756).toFixed(2).replace('.', ',')} ×`
  document.querySelector('#moon-count').textContent = planet.moons.length ? `${planet.moons.length} principale${planet.moons.length > 1 ? 's' : ''}` : 'Aucune connue'
  document.querySelector('#moon-list').innerHTML = planet.moons.length ? planet.moons.map((moon) => `<span>${moon}</span>`).join('') : '<span class="empty">Aucune lune principale</span>'
  document.querySelector('#record-id').textContent = `${planet.id.toUpperCase()} / ${planet.name.toUpperCase()}`
  document.querySelector('#view-selected').click()
}

function renderBars() {
  const max = Math.max(...planets.map((planet) => compareMode === 'size' ? planet.diameter : planet.distance))
  document.querySelector('#bars').innerHTML = planets.map((planet, index) => {
    const value = compareMode === 'size' ? planet.diameter : planet.distance
    const width = Math.max(3, Math.pow(value / max, 0.42) * 100)
    const label = compareMode === 'size' ? `${planet.diameter.toLocaleString('fr-FR')} km` : `${planet.distance.toLocaleString('fr-FR')} UA`
    return `<button class="bar-row ${planet.id === selected.id ? 'selected' : ''}" data-planet="${planet.id}" type="button"><span class="bar-index">${String(index + 1).padStart(2, '0')}</span><span class="bar-name">${planet.name}</span><span class="bar-track"><i style="width:${width}%;background:${planet.accent}"></i></span><strong>${label}</strong></button>`
  }).join('')
}

document.querySelector('#bars').addEventListener('click', (event) => {
  const row = event.target.closest('.bar-row')
  if (row) selectPlanet(planets.find((planet) => planet.id === row.dataset.planet))
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
    planetObjects.forEach((item, index) => {
      item.angle = index * 0.78 + delta / (0.7 + index * 0.35)
      item.group.rotation.y = item.angle
      item.mesh.rotation.y += 0.004
    })
  }
  controls.update()
  renderer.render(scene, camera)
}
selectPlanet(selected)
renderBars()
requestAnimationFrame(animate)
