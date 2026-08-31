import './style.css'

const planets = [
  {
    id: 'mercury', name: 'Mercure', type: 'Planète tellurique', color: '#9b9da4', accent: '#d8d9de',
    radius: 4, orbit: 0.12, period: 0.24, temperature: '167 °C', distance: '57,9 M km', moons: '0',
    description: 'Un petit monde rocheux, brûlé par le Soleil le jour et glacé dans sa nuit permanente.',
  },
  {
    id: 'venus', name: 'Vénus', type: 'Planète tellurique', color: '#d5a35f', accent: '#f4d6a0',
    radius: 7, orbit: 0.18, period: 0.62, temperature: '464 °C', distance: '108,2 M km', moons: '0',
    description: 'Une atmosphère dense et opaque enveloppe le monde le plus chaud de notre voisinage.',
  },
  {
    id: 'earth', name: 'Terre', type: 'Planète tellurique', color: '#277bb7', accent: '#8fc8d3',
    radius: 8, orbit: 0.25, period: 1, temperature: '15 °C', distance: '149,6 M km', moons: '1',
    description: 'Notre planète océan, la seule connue à abriter une biosphère riche et diversifiée.',
  },
  {
    id: 'mars', name: 'Mars', type: 'Planète tellurique', color: '#b55e45', accent: '#e9a57f',
    radius: 6, orbit: 0.32, period: 1.88, temperature: '-63 °C', distance: '227,9 M km', moons: '2',
    description: 'Le désert rouge conserve les traces d’une histoire géologique et hydrologique fascinante.',
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'Géante gazeuse', color: '#bc906a', accent: '#f3d7b0',
    radius: 16, orbit: 0.45, period: 11.86, temperature: '-110 °C', distance: '778,5 M km', moons: '95',
    description: 'Le géant du système, reconnaissable à ses bandes nuageuses et à sa Grande Tache rouge.',
  },
  {
    id: 'saturn', name: 'Saturne', type: 'Géante gazeuse', color: '#d0b47b', accent: '#f1dbad',
    radius: 14, orbit: 0.58, period: 29.45, temperature: '-140 °C', distance: '1,43 Md km', moons: '146',
    description: 'Un monde pâle entouré du système d’anneaux le plus spectaculaire observé depuis la Terre.',
  },
  {
    id: 'uranus', name: 'Uranus', type: 'Géante de glace', color: '#77b8c0', accent: '#c3f0ec',
    radius: 10, orbit: 0.70, period: 84, temperature: '-195 °C', distance: '2,87 Md km', moons: '28',
    description: 'Une géante bleu-vert qui roule presque sur le côté, comme un monde posé sur son orbite.',
  },
  {
    id: 'neptune', name: 'Neptune', type: 'Géante de glace', color: '#3d63b5', accent: '#9eb8ff',
    radius: 10, orbit: 0.82, period: 164.8, temperature: '-200 °C', distance: '4,50 Md km', moons: '16',
    description: 'La frontière bleue du système solaire, balayée par les vents les plus rapides connus.',
  },
]

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <a class="wordmark" href="#top" aria-label="Solar System — accueil">
        <span class="wordmark-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span><strong>SOLAR</strong><small>SYSTEM</small></span>
      </a>
      <div class="topbar-meta">
        <span class="signal-dot"></span>
        <span>Session d’observation active</span>
        <span class="topbar-divider"></span>
        <span class="mono">OBS-08 / 2025</span>
      </div>
    </header>

    <main id="top">
      <section class="intro">
        <div>
          <p class="kicker"><span class="kicker-line"></span> Observatoire orbital</p>
          <h1>Notre voisinage,<br><em>à portée de regard.</em></h1>
        </div>
        <div class="intro-copy">
          <p>Une carte interactive pour parcourir les huit mondes qui gravitent autour de notre étoile.</p>
          <span class="intro-note">Échelle visuelle amplifiée · distances non proportionnelles</span>
        </div>
      </section>

      <section class="workspace" aria-label="Exploration interactive du système solaire">
        <div class="stage-card">
          <div class="stage-head">
            <div>
              <span class="section-label">01 / Carte orbitale</span>
              <h2>Le système intérieur</h2>
            </div>
            <span class="live-chip"><span></span> Simulation en direct</span>
          </div>
          <div class="canvas-wrap">
            <canvas id="solar-canvas" aria-label="Carte animée du système solaire, cliquez sur une planète pour la sélectionner"></canvas>
            <div class="canvas-hint"><span class="mouse-icon">⌖</span> Cliquez sur un monde pour l’inspecter</div>
            <div class="north-mark">N<br><span>↑</span></div>
          </div>
          <div class="control-bar">
            <button id="play-toggle" class="play-button" type="button" aria-label="Mettre la simulation en pause"><span class="play-icon">Ⅱ</span><span id="play-label">Pause</span></button>
            <div class="speed-control">
              <label for="speed">Vitesse de simulation</label>
              <input id="speed" type="range" min="0.25" max="4" value="1" step="0.25">
              <span id="speed-value" class="mono">1×</span>
            </div>
            <button id="reset" class="text-button" type="button">Réinitialiser</button>
            <label class="switch-label"><input id="labels-toggle" type="checkbox" checked><span class="switch"></span><span>Étiquettes</span></label>
          </div>
        </div>

        <aside class="inspector" aria-live="polite">
          <div class="inspector-head"><span class="section-label">02 / Fiche d’observation</span><span class="record-dot">REC</span></div>
          <div id="planet-swatch" class="planet-swatch" aria-hidden="true"><span></span></div>
          <p id="planet-type" class="planet-type">Planète tellurique</p>
          <h2 id="planet-name">Terre</h2>
          <p id="planet-description" class="planet-description">Notre planète océan, la seule connue à abriter une biosphère riche et diversifiée.</p>
          <div class="stats-grid">
            <div class="stat"><span>Distance au Soleil</span><strong id="planet-distance">149,6 M km</strong></div>
            <div class="stat"><span>Température moyenne</span><strong id="planet-temperature">15 °C</strong></div>
            <div class="stat"><span>Satellites naturels</span><strong id="planet-moons">1</strong></div>
            <div class="stat"><span>Position orbitale</span><strong id="planet-position">03 / 08</strong></div>
          </div>
          <div class="inspector-footer"><span class="footer-rule"></span><span id="planet-id" class="mono">EARTH / TERRE</span><span class="footer-rule"></span></div>
        </aside>
      </section>

      <section class="planet-index">
        <div class="index-heading"><span class="section-label">03 / Index des mondes</span><span class="index-note">Sélectionnez une destination</span></div>
        <div id="planet-buttons" class="planet-buttons"></div>
      </section>
    </main>

    <footer class="footer"><span>Solar System / Archive d’observation</span><span class="mono">DONNÉES PÉDAGOGIQUES · 01</span><span>Interface conçue pour apprendre en mouvement.</span></footer>
  </div>
`

const canvas = document.querySelector('#solar-canvas')
const context = canvas.getContext('2d')
const playToggle = document.querySelector('#play-toggle')
const playLabel = document.querySelector('#play-label')
const speedInput = document.querySelector('#speed')
const speedValue = document.querySelector('#speed-value')
const labelsToggle = document.querySelector('#labels-toggle')
const planetButtons = document.querySelector('#planet-buttons')
const defaultPlanet = planets.find((planet) => planet.id === 'earth')

let selectedPlanet = defaultPlanet
let paused = false
let speed = 1
let elapsed = 0
let lastFrame = performance.now()
let hoveredPlanet = null
let planetPositions = []
let stars = []

function createStars(width, height) {
  let seed = 8247
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: Math.max(100, Math.floor(width * height / 5500)) }, () => ({
    x: random() * width,
    y: random() * height,
    radius: random() * 1.35 + 0.2,
    alpha: random() * 0.6 + 0.16,
  }))
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(rect.width * ratio)
  canvas.height = Math.floor(rect.height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  stars = createStars(rect.width, rect.height)
}

function drawGlow(x, y, radius, color) {
  const glow = context.createRadialGradient(x, y, 0, x, y, radius)
  glow.addColorStop(0, `${color}aa`)
  glow.addColorStop(0.35, `${color}20`)
  glow.addColorStop(1, `${color}00`)
  context.fillStyle = glow
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
}

function drawPlanet(planet, x, y, radius, isSelected) {
  if (planet.id === 'saturn') {
    context.save()
    context.translate(x, y)
    context.rotate(-0.18)
    context.strokeStyle = `${planet.accent}aa`
    context.lineWidth = 2
    context.beginPath()
    context.ellipse(0, 0, radius * 1.85, radius * 0.55, 0, 0, Math.PI * 2)
    context.stroke()
    context.strokeStyle = `${planet.accent}42`
    context.lineWidth = 4
    context.beginPath()
    context.ellipse(0, 0, radius * 2.05, radius * 0.62, 0, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }

  drawGlow(x, y, radius * (isSelected ? 4.5 : 3.2), planet.accent)
  const gradient = context.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius)
  gradient.addColorStop(0, planet.accent)
  gradient.addColorStop(0.38, planet.color)
  gradient.addColorStop(1, '#111a2c')
  context.fillStyle = gradient
  context.beginPath()
  context.arc(x, y, radius + (isSelected ? 1.5 : 0), 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = isSelected ? '#f4f0df' : `${planet.accent}66`
  context.lineWidth = isSelected ? 1.5 : 0.7
  context.stroke()

  if (planet.id === 'earth') {
    context.fillStyle = '#75aa68bb'
    context.beginPath()
    context.ellipse(x - radius * 0.28, y - radius * 0.08, radius * 0.26, radius * 0.45, -0.4, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.ellipse(x + radius * 0.26, y + radius * 0.23, radius * 0.16, radius * 0.25, 0.5, 0, Math.PI * 2)
    context.fill()
  }
  if (planet.id === 'jupiter') {
    context.strokeStyle = '#6d493d88'
    context.lineWidth = 1.4
    for (let offset = -0.52; offset <= 0.52; offset += 0.28) {
      context.beginPath()
      context.ellipse(x, y + radius * offset, radius * 0.82, radius * 0.11, 0, 0, Math.PI * 2)
      context.stroke()
    }
  }
  if (planet.id === 'uranus') {
    context.save()
    context.translate(x, y)
    context.rotate(0.8)
    context.strokeStyle = `${planet.accent}55`
    context.lineWidth = 1
    context.beginPath()
    context.ellipse(0, 0, radius * 1.55, radius * 0.4, 0, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }
}

function render(timestamp) {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  const centerX = width * 0.49
  const centerY = height * 0.52
  const orbitScale = Math.min(width, height) * 0.42
  const baseRadius = Math.max(2.5, Math.min(width, height) / 78)

  context.clearRect(0, 0, width, height)
  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#0b1323')
  background.addColorStop(0.58, '#101a30')
  background.addColorStop(1, '#09111f')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  for (const star of stars) {
    context.fillStyle = `rgba(221, 232, 244, ${star.alpha})`
    context.beginPath()
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    context.fill()
  }

  context.strokeStyle = 'rgba(152, 180, 209, 0.13)'
  context.lineWidth = 1
  const orbitRadii = planets.map((planet) => orbitScale * planet.orbit)
  orbitRadii.forEach((radius, index) => {
    context.setLineDash(index < 4 ? [2, 5] : [1, 7])
    context.beginPath()
    context.ellipse(centerX, centerY, radius, radius * 0.46, -0.07, 0, Math.PI * 2)
    context.stroke()
  })
  context.setLineDash([])

  drawGlow(centerX, centerY, 74, '#e7aa4c')
  const sunGradient = context.createRadialGradient(centerX - 6, centerY - 7, 2, centerX, centerY, 25)
  sunGradient.addColorStop(0, '#fff4c4')
  sunGradient.addColorStop(0.3, '#f8bd55')
  sunGradient.addColorStop(1, '#b75628')
  context.fillStyle = sunGradient
  context.beginPath()
  context.arc(centerX, centerY, 17, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#ffd98666'
  context.lineWidth = 1
  context.stroke()

  planetPositions = planets.map((planet, index) => {
    const orbit = orbitRadii[index]
    const phase = index * 0.93 - elapsed * (0.55 / planet.period)
    const x = centerX + Math.cos(phase) * orbit
    const y = centerY + Math.sin(phase) * orbit * 0.46
    const radius = baseRadius * (planet.radius / 8)
    const isSelected = selectedPlanet.id === planet.id
    const isHovered = hoveredPlanet?.id === planet.id
    drawPlanet(planet, x, y, radius + (isHovered ? 2 : 0), isSelected)
    if (labelsToggle.checked || isSelected || isHovered) {
      const labelX = x + radius + 8
      const labelY = y - radius - 5
      context.font = `${isSelected ? '600' : '500'} 10px "IBM Plex Mono", monospace`
      context.fillStyle = isSelected ? '#f6d18d' : 'rgba(221,232,244,0.68)'
      context.fillText(planet.name.toUpperCase(), labelX, labelY)
      context.fillStyle = 'rgba(221,232,244,0.36)'
      context.font = '9px "IBM Plex Mono", monospace'
      context.fillText(String(index + 1).padStart(2, '0'), labelX, labelY + 13)
    }
    return { planet, x, y, radius: Math.max(radius, 8) }
  })

  context.fillStyle = 'rgba(236, 242, 246, 0.45)'
  context.font = '10px "IBM Plex Mono", monospace'
  context.fillText('SOLEIL', centerX + 25, centerY + 3)

  if (!paused) elapsed += (timestamp - lastFrame) / 1000 * speed
  lastFrame = timestamp
  requestAnimationFrame(render)
}

function updateInspector(planet) {
  selectedPlanet = planet
  document.querySelector('#planet-type').textContent = planet.type
  document.querySelector('#planet-name').textContent = planet.name
  document.querySelector('#planet-description').textContent = planet.description
  document.querySelector('#planet-distance').textContent = planet.distance
  document.querySelector('#planet-temperature').textContent = planet.temperature
  document.querySelector('#planet-moons').textContent = planet.moons
  document.querySelector('#planet-position').textContent = `${String(planets.indexOf(planet) + 1).padStart(2, '0')} / 08`
  document.querySelector('#planet-id').textContent = `${planet.id.toUpperCase()} / ${planet.name.toUpperCase()}`
  document.querySelector('#planet-swatch').style.setProperty('--planet-color', planet.color)
  document.querySelector('#planet-swatch').style.setProperty('--planet-accent', planet.accent)
  document.querySelectorAll('.planet-button').forEach((button) => {
    const isActive = button.dataset.planet === planet.id
    button.classList.toggle('active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
}

function buildPlanetIndex() {
  planetButtons.innerHTML = planets.map((planet, index) => `
    <button class="planet-button" type="button" data-planet="${planet.id}" aria-pressed="false">
      <span class="button-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="button-orb" style="--orb-color:${planet.color};--orb-accent:${planet.accent}"></span>
      <span class="button-name">${planet.name}</span>
      <span class="button-type">${planet.type.replace('Planète ', '').replace('Géante ', '')}</span>
    </button>
  `).join('')
  planetButtons.addEventListener('click', (event) => {
    const button = event.target.closest('.planet-button')
    if (!button) return
    const planet = planets.find((item) => item.id === button.dataset.planet)
    if (planet) updateInspector(planet)
  })
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

canvas.addEventListener('mousemove', (event) => {
  const pointer = pointerPosition(event)
  hoveredPlanet = planetPositions.find(({ x, y, radius }) => Math.hypot(pointer.x - x, pointer.y - y) <= radius + 8)?.planet || null
  canvas.style.cursor = hoveredPlanet ? 'pointer' : 'crosshair'
})

canvas.addEventListener('mouseleave', () => { hoveredPlanet = null })
canvas.addEventListener('click', (event) => {
  const pointer = pointerPosition(event)
  const target = planetPositions.find(({ x, y, radius }) => Math.hypot(pointer.x - x, pointer.y - y) <= radius + 10)
  if (target) updateInspector(target.planet)
})

playToggle.addEventListener('click', () => {
  paused = !paused
  playToggle.setAttribute('aria-label', paused ? 'Reprendre la simulation' : 'Mettre la simulation en pause')
  playToggle.querySelector('.play-icon').textContent = paused ? '▶' : 'Ⅱ'
  playLabel.textContent = paused ? 'Lecture' : 'Pause'
})
speedInput.addEventListener('input', () => {
  speed = Number(speedInput.value)
  speedValue.textContent = `${speed}×`
})
document.querySelector('#reset').addEventListener('click', () => {
  elapsed = 0
  updateInspector(defaultPlanet)
})
labelsToggle.addEventListener('change', () => { canvas.setAttribute('aria-label', labelsToggle.checked ? 'Carte animée du système solaire avec étiquettes' : 'Carte animée du système solaire') })
window.addEventListener('resize', resizeCanvas)

buildPlanetIndex()
updateInspector(defaultPlanet)
resizeCanvas()
requestAnimationFrame(render)
