import './story.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { planets } from './data.js'
import { chapters } from './story-content.js'
import { loadTextures, createSun, createPlanet, createBelt, createStarField, circleLine, easeInOut, smoothstep, clamp01 } from './kit.js'

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const isNarrow = () => innerWidth < 820
const N = chapters.length
const idx = Object.fromEntries(chapters.map((c, i) => [c.id, i]))
const UP = new THREE.Vector3(0, 1, 0)

/* ==========================================================
   DOM — chapitres, habillage fixe
   ========================================================== */
// Lettre par lettre pour l'animation, mais regroupées par mot pour ne jamais couper un mot en fin de ligne.
const split = (text) => {
  let i = 0
  return text.split(' ').map((word) => {
    const letters = [...word].map((ch) => `<span class="ch" style="--i:${i++}">${ch}</span>`).join('')
    i++
    return `<span class="w">${letters}</span>`
  }).join(' ')
}
const auLabel = (au) => (au == null ? '' : au === 0 ? 'Origine' : `${au.toLocaleString('fr-FR')} UA`)

function statsHtml(stats) {
  return `<dl class="stats">${stats.map((s) => `<div><dt>${s.label}</dt><dd>${s.count != null
    ? `<b data-count="${s.count}">0</b> <small>${s.unit}</small>`
    : `<b>${s.value}</b>`}</dd></div>`).join('')}</dl>`
}

const finalHtml = `
  <div class="final-actions">
    <a class="btn btn--primary" href="./">Explorer la carte interactive</a>
    <button class="btn" type="button" data-restart>Revoir le voyage ↑</button>
  </div>
  <p class="credits">Textures : <a href="https://www.solarsystemscope.com/textures/" rel="noopener">Solar System Scope</a> (CC BY 4.0), d’après les données NASA · Distances et tailles compressées pour le récit ·
  <a href="mentions-legales.html">Mentions légales</a> · <a href="confidentialite.html">Confidentialité</a> · <a href="contact.html">Contact</a></p>`

function chapterHtml(c, i) {
  if (c.kind === 'intro') {
    return `<section class="chapter chapter--intro" id="ch-intro" data-chapter="${i}" aria-label="Introduction">
      <div class="ui intro-ui">
        <p class="intro-kicker"><span></span>Solar System · Le récit<span></span></p>
        <h1 class="intro-title split"><span class="line">${split('L’histoire du')}</span><span class="line accent">${split('système solaire')}</span></h1>
        <p class="intro-sub">Un voyage de 4,6 milliards d’années, de la poussière d’étoiles jusqu’aux confins de Neptune. Chaque défilement vous rapproche d’un nouveau monde.</p>
        <div class="scroll-cue"><span class="mouse"><i></i></span>Faites défiler pour commencer</div>
      </div>
    </section>`
  }
  const num = c.kind === 'epilogue' ? 'Épilogue' : `Chapitre ${c.num}`
  const beats = c.beats.map((b, k) => `
      <article class="beat${b.wow ? ' beat--wow' : ''}" data-beat="${k}">
        <h3>${b.label}</h3>
        ${b.lead ? `<p class="lead">${b.lead}</p>` : ''}
        ${b.text ? `<p>${b.text}</p>` : ''}
        ${k === c.beats.length - 1 && c.stats ? statsHtml(c.stats) : ''}
        ${b.final ? finalHtml : ''}
      </article>`).join('')
  return `<section class="chapter chapter--${c.kind}" id="ch-${c.id}" data-chapter="${i}" style="--accent:${c.accent}" aria-labelledby="t-${c.id}">
    <div class="ui bgname" aria-hidden="true">${c.title}</div>
    <div class="ui panel side-${c.side}">
      <p class="kicker"><span class="num">${num}</span><span class="rule"></span><span class="au">${auLabel(c.au)}</span></p>
      <h2 class="title split" id="t-${c.id}">${split(c.title)}</h2>
      <p class="subtitle">${c.subtitle}</p>
      <div class="beats">${beats}</div>
      <div class="beat-track" aria-hidden="true">${c.beats.map(() => '<i></i>').join('')}</div>
    </div>
  </section>`
}

document.querySelector('#app').innerHTML = `
  <div class="loader" role="status"><div class="loader-ring"></div><p>Chargement des mondes <b id="load-pct">0 %</b></p></div>
  <div class="webgl" id="webgl" aria-hidden="true"></div>
  <div class="vignette" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
  <div class="progress" aria-hidden="true"><i></i></div>
  <header class="story-top">
    <a class="brand" href="./"><span class="mark"><i></i></span><span><strong>SOLAR</strong><small>LE RÉCIT</small></span></a>
    <nav class="mode-switch" aria-label="Mode de visite"><a href="./">Classique</a><a class="active" href="recit.html" aria-current="page">Récit</a></nav>
    <button class="sound-toggle" type="button" aria-pressed="false"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="lbl">Son</span></button>
  </header>
  <nav class="chapter-nav" aria-label="Chapitres">
    ${chapters.map((c, i) => `<button type="button" data-goto="${i}"><span>${c.kind === 'intro' ? 'Début' : `${c.num} · ${c.title}`}</span></button>`).join('')}
  </nav>
  <div class="odometer" aria-hidden="true">
    <small>Distance au Soleil</small>
    <strong><b id="odo-au">0,00</b> UA</strong>
    <span id="odo-km">—</span>
    <span id="odo-light">—</span>
  </div>
  <main class="chapters">${chapters.map(chapterHtml).join('')}</main>
`

const sections = [...document.querySelectorAll('.chapter')]
const navButtons = [...document.querySelectorAll('.chapter-nav button')]
const progressBar = document.querySelector('.progress i')
const flashEl = document.querySelector('.flash')
const odo = { au: document.querySelector('#odo-au'), km: document.querySelector('#odo-km'), light: document.querySelector('#odo-light') }

/* ==========================================================
   THREE — rendu, post-traitement
   ========================================================== */
const host = document.querySelector('#webgl')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, isNarrow() ? 1.5 : 1.75))
renderer.setSize(innerWidth, innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.12
host.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 3000)
scene.add(camera)

const manager = new THREE.LoadingManager()
const tx = loadTextures(renderer, manager)
scene.background = tx.sky
scene.backgroundIntensity = 0.85

const composer = new EffectComposer(renderer)
composer.setPixelRatio(renderer.getPixelRatio())
composer.setSize(innerWidth, innerHeight)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.6, 0.84)
composer.addPass(bloom)
composer.addPass(new OutputPass())

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(innerWidth, innerHeight)
labelRenderer.domElement.className = 'label-layer'
host.appendChild(labelRenderer.domElement)

scene.add(new THREE.AmbientLight(0x2c3446, 0.28))
const sunLight = new THREE.PointLight(0xfff1d6, 3.6, 0, 0)
scene.add(sunLight)
const stars = createStarField(420, 2.2, 0.9, 700, 900)
scene.add(stars)

/* ==========================================================
   LE NUAGE PRIMORDIAL — particules qui s'effondrent en disque
   ========================================================== */
function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2 }

function createNebula(count) {
  const aCloud = new Float32Array(count * 3)
  const aDisk = new Float32Array(count * 3)
  const aColor = new Float32Array(count * 3)
  const aSize = new Float32Array(count)
  const aAlpha = new Float32Array(count)
  const palette = [[0.62, 0.42, 1.0], [1.0, 0.42, 0.58], [0.36, 0.7, 1.0], [1.0, 0.7, 0.42], [0.5, 0.88, 0.84]]
  const blobs = Array.from({ length: 16 }, () => {
    const v = new THREE.Vector3(gauss(), gauss() * 0.6, gauss()).multiplyScalar(26)
    return { c: v, s: 5 + Math.random() * 10, col: palette[Math.floor(Math.random() * palette.length)] }
  })
  for (let i = 0; i < count; i++) {
    const b = blobs[i % blobs.length]
    aCloud[i * 3] = b.c.x + gauss() * b.s
    aCloud[i * 3 + 1] = b.c.y + gauss() * b.s * 0.7
    aCloud[i * 3 + 2] = b.c.z + gauss() * b.s
    const r = 2.8 + Math.pow(Math.random(), 1.5) * 38
    aDisk[i * 3] = r
    aDisk[i * 3 + 1] = Math.random() * Math.PI * 2
    aDisk[i * 3 + 2] = gauss() * (0.15 + r * 0.018)
    const j = 0.8 + Math.random() * 0.4
    aColor[i * 3] = b.col[0] * j; aColor[i * 3 + 1] = b.col[1] * j; aColor[i * 3 + 2] = b.col[2] * j
    const puff = i % 25 === 0
    aSize[i] = puff ? 26 + Math.random() * 46 : 0.7 + Math.random() * 2.2
    aAlpha[i] = puff ? 0.045 : 0.35 + Math.random() * 0.5
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(aCloud, 3))
  geo.setAttribute('aDisk', new THREE.BufferAttribute(aDisk, 3))
  geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1))
  const uniforms = { uTime: { value: 0 }, uCollapse: { value: 0 }, uDisperse: { value: 0 }, uOpacity: { value: 1 }, uPR: { value: renderer.getPixelRatio() } }
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aDisk; attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
      uniform float uTime, uCollapse, uDisperse, uPR;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        float r = aDisk.x;
        float ang = aDisk.y + uTime * (1.8 / (1.0 + r * 0.22)) * (0.12 + uCollapse);
        vec3 disk = vec3(cos(ang) * r, aDisk.z, sin(ang) * r);
        float ca = uTime * 0.025; float cs = cos(ca), sn = sin(ca);
        vec3 cloud = vec3(position.x * cs - position.z * sn, position.y, position.x * sn + position.z * cs);
        float k = uCollapse * uCollapse * (3.0 - 2.0 * uCollapse);
        vec3 p = mix(cloud, disk, k) * (1.0 + uDisperse * 1.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (120.0 / max(-mv.z, 0.1));
        vec3 warm = mix(vec3(1.0, 0.8, 0.48), vec3(0.62, 0.48, 0.4), clamp(r / 30.0, 0.0, 1.0));
        vColor = mix(aColor, warm, k * 0.75);
        vAlpha = aAlpha * (1.0 - uDisperse);
      }`,
    fragmentShader: `
      uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = pow(1.0 - d * 2.0, 1.7);
        gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
      }`,
  })
  const points = new THREE.Points(geo, material)
  points.frustumCulled = false
  return { points, uniforms }
}
const nebula = createNebula(isNarrow() ? 9000 : 16000)
scene.add(nebula.points)

/* ==========================================================
   LE SOLEIL, LES PLANÈTES, LA CEINTURE
   ========================================================== */
const sun = createSun(tx)
scene.add(sun.group)

const storyDist = (au) => 6 + Math.log(au + 1) * 9
const orbitGroup = new THREE.Group()
scene.add(orbitGroup)
const bodies = {}
const labelObjects = []

function makeLabel(text) {
  const div = document.createElement('div')
  div.className = 's-label'
  div.textContent = text
  const obj = new CSS2DObject(div)
  labelObjects.push(obj)
  return obj
}

planets.forEach((p, i) => {
  const body = createPlanet(p, tx, { withVenusSurface: true, moonOrbitLines: false })
  const a = 0.4 - 0.62 * i
  const r = storyDist(p.distance)
  body.holder.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
  scene.add(body.holder)
  orbitGroup.add(circleLine(r, 0x9fb6d0, 1, 256))
  // Vue finale : les mondes intérieurs, trop serrés, cèdent la place au « Vous êtes ici ».
  if (!['mercury', 'venus', 'earth'].includes(p.id)) {
    const label = makeLabel(p.name)
    label.position.set(0, body.ringOuter * 1.1 + 0.5, 0)
    body.holder.add(label)
  }
  bodies[p.id] = body
})
{
  const label = makeLabel('Soleil')
  label.position.set(0, 3.6, 0)
  sun.group.add(label)
}

const hereDiv = document.createElement('div')
hereDiv.className = 'here-label'
hereDiv.innerHTML = '<span>Vous êtes ici</span>'
bodies.earth.holder.add(new CSS2DObject(hereDiv))

const belt = createBelt(tx, { count: isNarrow() ? 1800 : 3300, rMin: storyDist(2.15), rMax: storyDist(3.3), thickness: 0.8, size: [0.01, 0.1] })
scene.add(belt)
const BELT_ANGLE = -1.62
const ceres = new THREE.Mesh(new THREE.SphereGeometry(0.34, 64, 40), new THREE.MeshStandardMaterial({ map: tx.moon, color: 0xb7aa98, roughness: 1 }))
ceres.position.set(Math.cos(BELT_ANGLE - 0.42) * storyDist(2.77), 0.15, Math.sin(BELT_ANGLE - 0.42) * storyDist(2.77))
scene.add(ceres)

/* ==========================================================
   TRAÎNÉES DE VITESSE — visibles seulement pendant les voyages
   ========================================================== */
const STREAKS = 260
const streakPos = new Float32Array(STREAKS * 6)
const streakData = Array.from({ length: STREAKS }, () => {
  const a = Math.random() * Math.PI * 2
  const r = 0.5 + Math.random() * 3.5
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: -2 - Math.random() * 40 }
})
const streakGeo = new THREE.BufferGeometry()
streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3))
const streakMat = new THREE.LineBasicMaterial({ color: 0xd6e6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
const streaks = new THREE.LineSegments(streakGeo, streakMat)
streaks.frustumCulled = false
camera.add(streaks)

function updateStreaks(dt, vel, travel) {
  const strength = reduceMotion ? 0 : clamp01((vel - 0.06) * 1.4) * travel
  streakMat.opacity = strength * 0.6
  streaks.visible = strength > 0.01
  if (!streaks.visible) return
  const len = 0.2 + strength * 9
  const speedZ = 6 + strength * 90
  streakData.forEach((s, i) => {
    s.z += speedZ * dt
    if (s.z > -1) s.z -= 40
    streakPos.set([s.x, s.y, s.z, s.x, s.y, s.z - len], i * 6)
  })
  streakGeo.attributes.position.needsUpdate = true
}

/* ==========================================================
   CAMÉRA — une pose par chapitre, un vol entre deux chapitres
   ========================================================== */
const holdEnd = (c) => (c.kind === 'intro' ? 0.28 : c.kind === 'epilogue' ? 1 : 0.72)

function sideOffset(side) {
  if (isNarrow()) return { ox: 0, oy: side === 'center' ? 0.1 : 0.2 }
  if (side === 'left') return { ox: -0.19, oy: 0 }
  if (side === 'right') return { ox: 0.19, oy: 0 }
  return { ox: 0, oy: 0.12 }
}

// Sur un écran vertical, le champ horizontal rétrécit : on recule pour garder le monde entier dans le cadre.
const portraitFactor = () => Math.max(1, 0.8 / camera.aspect)

function planetPose(body, side, l) {
  const P = body.holder.position
  const toSun = P.clone().negate().normalize()
  const perp = new THREE.Vector3().crossVectors(UP, toSun).normalize()
  const dir = toSun.multiplyScalar(0.5).add(perp.multiplyScalar(0.85)).addScaledVector(UP, 0.3).normalize()
  dir.applyAxisAngle(UP, (l - 0.36) * 0.55)
  const extent = body.planet.id === 'saturn' ? body.radius * 2.15 : body.planet.id === 'uranus' ? body.radius * 1.5 : body.radius
  const dist = extent * 4.4 * portraitFactor()
  return { pos: P.clone().addScaledVector(dir, dist), target: P.clone(), ...sideOffset(side) }
}

function poseFor(i, l) {
  const c = chapters[i]
  switch (c.kind) {
    case 'intro':
      return { pos: new THREE.Vector3(Math.sin(l * 0.4) * 8, 3 + l * 4, 96 - l * 10), target: new THREE.Vector3(0, 0, 0), ox: 0, oy: 0 }
    case 'nebula': {
      const k = l / 0.72
      return { pos: new THREE.Vector3(Math.sin(k * 0.8) * 20, 8 + k * 18, 64 - k * 18), target: new THREE.Vector3(0, 0, 0), ...sideOffset(c.side) }
    }
    case 'sun': {
      const dir = new THREE.Vector3(1, 0.22, 0.9).normalize().applyAxisAngle(UP, (l - 0.36) * 0.6)
      return { pos: dir.multiplyScalar(11.5 * portraitFactor()), target: new THREE.Vector3(0, 0, 0), ...sideOffset(c.side) }
    }
    case 'belt': {
      const r = storyDist(2.72)
      const a = BELT_ANGLE + 0.14 - l * 0.42
      return {
        pos: new THREE.Vector3(Math.cos(a) * r, 0.55, Math.sin(a) * r),
        target: new THREE.Vector3(Math.cos(a - 0.3) * (r + 0.5), -0.15, Math.sin(a - 0.3) * (r + 0.5)),
        ...sideOffset(c.side),
      }
    }
    case 'epilogue': {
      const k = smoothstep(0, 0.75, l)
      return {
        pos: new THREE.Vector3(8 - k * 8, 56 + k * 70, 66 + k * 44),
        target: new THREE.Vector3(0, 0, -4 * k),
        ...sideOffset(c.side),
      }
    }
    default:
      return planetPose(bodies[c.id], c.side, l)
  }
}

const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), ox: 0, oy: 0, travel: 0, au: null }

function cameraAt(g) {
  const i = Math.min(Math.floor(g), N - 1)
  const l = g - i
  const c = chapters[i]
  const he = holdEnd(c)
  if (l <= he || i === N - 1) {
    const p = poseFor(i, Math.min(l, he))
    Object.assign(cam, p, { travel: 0, au: c.au })
    return
  }
  const e = easeInOut((l - he) / (1 - he))
  const A = poseFor(i, he)
  const B = poseFor(i + 1, 0)
  // Le regard se tourne vers la destination avant que le corps ne s'y rende : on la voit grandir.
  const look = easeInOut(Math.min(1, e * 1.7))
  cam.pos.lerpVectors(A.pos, B.pos, e).addScaledVector(UP, Math.sin(Math.PI * e) * A.target.distanceTo(B.target) * 0.1)
  cam.target.lerpVectors(A.target, B.target, look)
  cam.ox = A.ox + (B.ox - A.ox) * look
  cam.oy = A.oy + (B.oy - A.oy) * look
  cam.travel = Math.sin(Math.PI * e)
  const auA = c.au, auB = chapters[i + 1].au
  cam.au = auA == null ? (e > 0.5 ? auB : null) : auB == null ? auA : auA + (auB - auA) * e
}

/* ==========================================================
   SCROLL — progression lissée, chapitre actif, temps du texte
   ========================================================== */
let tops = [], heights = []
function measure() {
  sections.forEach((s, i) => { tops[i] = s.offsetTop; heights[i] = s.offsetHeight })
}
function progressAt(y) {
  for (let i = N - 1; i >= 0; i--) if (y >= tops[i]) return Math.min(i + (y - tops[i]) / heights[i], N - 0.001)
  return 0
}

let activeChapter = -1
const activeBeat = new Array(N).fill(-1)

function beatFor(c, l) {
  const n = c.beats.length
  const start = 0.03
  const end = c.kind === 'epilogue' ? 0.66 : holdEnd(c) - 0.04
  return Math.max(0, Math.min(n - 1, Math.floor(((l - start) / (end - start)) * n)))
}

function countUp(scope) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count)
    if (reduceMotion) { el.textContent = to.toLocaleString('fr-FR'); return }
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min((now - t0) / 1600, 1)
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString('fr-FR')
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

function setActive(i, l) {
  const c = chapters[i]
  let on = -1
  if (c.kind === 'intro') on = l < 0.26 ? i : -1
  else if (l >= 0.015 && (c.kind === 'epilogue' || l <= holdEnd(c) - 0.02)) on = i

  if (on !== activeChapter) {
    if (activeChapter >= 0) sections[activeChapter].classList.remove('is-active')
    if (on >= 0) {
      sections[on].classList.add('is-active')
      chime(on)
    }
    activeChapter = on
  }
  navButtons.forEach((b, k) => b.classList.toggle('on', k === i))

  if (on >= 0 && c.beats) {
    const k = beatFor(c, l)
    if (k !== activeBeat[on]) {
      activeBeat[on] = k
      const sec = sections[on]
      sec.querySelectorAll('.beat').forEach((el, j) => el.classList.toggle('is-on', j === k))
      sec.querySelectorAll('.beat-track i').forEach((el, j) => el.classList.toggle('on', j <= k))
      const beatEl = sec.querySelector(`.beat[data-beat="${k}"]`)
      if (beatEl) countUp(beatEl)
    }
  }
  for (let j = 0; j < N; j++) if (j !== on) activeBeat[j] = -1
  if (on >= 0) sections[on].style.setProperty('--shift', `${((0.5 - l) * 0.55 * innerWidth).toFixed(1)}px`)

  document.body.classList.toggle('is-overview', i === idx.epilogue && l > 0.05)
  document.body.classList.toggle('show-here', i === idx.epilogue && activeBeat[idx.epilogue] >= 1)
}

/* ==========================================================
   HUD — distance au Soleil, temps-lumière
   ========================================================== */
function formatLight(sec) {
  if (sec < 1) return 'Lumière du Soleil : instantanée'
  if (sec < 60) return `Lumière du Soleil : ${Math.round(sec)} s`
  if (sec < 3600) { const m = Math.floor(sec / 60); return `Lumière du Soleil : ${m} min ${String(Math.round(sec % 60)).padStart(2, '0')} s` }
  const h = Math.floor(sec / 3600)
  return `Lumière du Soleil : ${h} h ${String(Math.round((sec % 3600) / 60)).padStart(2, '0')} min`
}
function updateOdometer(au) {
  document.body.classList.toggle('show-odo', au != null)
  if (au == null) return
  odo.au.textContent = au.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const mkm = au * 149.6
  odo.km.textContent = mkm >= 1000
    ? `≈ ${(mkm / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} milliards de km`
    : `≈ ${Math.round(mkm).toLocaleString('fr-FR')} millions de km`
  odo.light.textContent = formatLight(au * 499)
}

/* ==========================================================
   SON — nappe d'ambiance synthétisée + carillon à chaque chapitre
   ========================================================== */
let audio = null
const soundBtn = document.querySelector('.sound-toggle')

function startAudio() {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 0.8
  filter.connect(master)
  ;[55, 82.41, 110, 164.81, 220].forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = i % 2 ? 'triangle' : 'sawtooth'
    o.frequency.value = f
    o.detune.value = (i - 2) * 7
    const g = ctx.createGain()
    g.gain.value = i < 2 ? 0.14 : 0.05
    o.connect(g).connect(filter)
    o.start()
  })
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.06
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 220
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
  const delay = ctx.createDelay(1.5)
  delay.delayTime.value = 0.42
  const fb = ctx.createGain()
  fb.gain.value = 0.38
  delay.connect(fb).connect(delay)
  delay.connect(master)
  master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3)
  return { ctx, master, filter, delay }
}

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5]
function chime(i) {
  if (!audio || audio.ctx.state !== 'running') return
  const { ctx, delay, master } = audio
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = SCALE[i % SCALE.length] / 2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2)
  o.connect(g)
  g.connect(master)
  g.connect(delay)
  o.start()
  o.stop(ctx.currentTime + 3.3)
}

soundBtn.addEventListener('click', async () => {
  if (!audio) audio = startAudio()
  else if (audio.ctx.state === 'running') await audio.ctx.suspend()
  else await audio.ctx.resume()
  const on = audio.ctx.state === 'running'
  soundBtn.setAttribute('aria-pressed', String(on))
  soundBtn.querySelector('.lbl').textContent = on ? 'Son activé' : 'Son'
})

/* ==========================================================
   NAVIGATION
   ========================================================== */
navButtons.forEach((b) => b.addEventListener('click', () => {
  const i = Number(b.dataset.goto)
  scrollTo({ top: i === 0 ? 0 : tops[i] + heights[i] * 0.05, behavior: reduceMotion ? 'auto' : 'smooth' })
}))
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-restart]')) scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
})

let mx = 0, my = 0, pmx = 0, pmy = 0
addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1 })

function resize() {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
  labelRenderer.setSize(innerWidth, innerHeight)
  measure()
}
addEventListener('resize', resize)
measure()

manager.onProgress = (_url, loaded, total) => { document.querySelector('#load-pct').textContent = `${Math.round((loaded / total) * 100)} %` }
const reveal = () => { document.body.classList.add('is-loaded'); measure() }
manager.onLoad = reveal
setTimeout(reveal, 15000)

/* ==========================================================
   BOUCLE
   ========================================================== */
const clock = new THREE.Clock()
let smoothY = scrollY
let lastG = progressAt(smoothY)
let time = 0
const IGNITION = 1.88
let prevG = lastG
let flashStart = -10
const _right = new THREE.Vector3()

function frame() {
  requestAnimationFrame(frame)
  const dt = Math.min(clock.getDelta(), 0.05)
  time += dt

  smoothY = reduceMotion ? scrollY : smoothY + (scrollY - smoothY) * (1 - Math.exp(-dt * 5))
  const g = progressAt(smoothY)
  const vel = Math.abs(g - lastG) / Math.max(dt, 1e-4)
  lastG = g
  const i = Math.min(Math.floor(g), N - 1)
  setActive(i, g - i)
  progressBar.style.transform = `scaleX(${(smoothY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4)})`

  // Chronologie cosmique : effondrement du nuage, allumage du Soleil, apparition des mondes.
  const collapse = smoothstep(1.06, 1.62, g)
  const ignite = smoothstep(1.8, 1.95, g)
  // L'éclair d'allumage est un événement minuté, déclenché au franchissement du seuil en descendant.
  if (prevG < IGNITION && g >= IGNITION) flashStart = time
  prevG = g
  const flash = reduceMotion ? 0 : Math.pow(Math.max(0, 1 - (time - flashStart) / 1.4), 2)
  const disperse = smoothstep(1.88, 2.2, g)
  const appear = smoothstep(1.95, 2.4, g)

  nebula.uniforms.uTime.value = time
  nebula.uniforms.uCollapse.value = collapse
  nebula.uniforms.uDisperse.value = disperse
  nebula.points.visible = disperse < 0.999

  sun.group.visible = g > 1.02
  sun.group.scale.setScalar(0.22 + 0.78 * ignite + 0.12 * collapse * (1 - ignite))
  sun.uniforms.uIgnite.value = ignite
  sun.uniforms.uTime.value = time
  sun.mesh.rotation.y += 0.02 * dt
  sun.glow.material.opacity = 0.15 * collapse + 0.45 * ignite
  sun.corona.material.uniforms.uMul.value = 1.25 * ignite
  sunLight.intensity = 0.2 + 3.4 * ignite

  flashEl.style.opacity = (flash * 0.92).toFixed(3)
  bloom.strength = 0.7 + flash * 2.4

  // Seuls la planète du chapitre (et la suivante pendant le voyage) restent pleinement visibles :
  // une voisine trop proche de la caméra s'efface au lieu d'encombrer le cadre et le texte.
  const cur = chapters[i]
  const next = chapters[i + 1]
  const traveling = g - i > holdEnd(cur)
  const focus = new Set()
  if (cur.kind === 'planet') focus.add(cur.id)
  if (next && next.kind === 'planet' && (traveling || cur.kind === 'belt')) focus.add(next.id)
  const overviewAll = cur.kind === 'epilogue'
  const kVis = 1 - Math.exp(-dt * 4)
  for (const b of Object.values(bodies)) {
    const angular = b.ringOuter / Math.max(0.01, camera.position.distanceTo(b.holder.position))
    const want = focus.has(b.planet.id) || overviewAll ? 1 : 1 - smoothstep(0.012, 0.028, angular)
    b.vis = b.vis == null ? want : b.vis + (want - b.vis) * kVis
    const s = appear * b.vis
    b.holder.visible = s > 0.002
    b.holder.scale.setScalar(Math.max(s, 0.002))
    b.spin(dt, 0.35)
  }
  belt.visible = appear > 0.001 && ((g > idx.mars - 0.3 && g < idx.jupiter + 0.75) || g > idx.epilogue - 0.2)
  ceres.visible = belt.visible && g < idx.epilogue - 0.2
  belt.rotation.y += 0.004 * dt
  ceres.rotation.y += 0.05 * dt
  const overview = smoothstep(idx.epilogue + 0.02, idx.epilogue + 0.4, g)
  orbitGroup.children.forEach((line) => { line.material.opacity = appear * (0.05 + 0.3 * overview) })

  // Vénus : la couche nuageuse se dissipe pendant le récit de Venera 13, révélant le sol.
  const venus = bodies.venus
  const reveal = i === idx.venus && activeBeat[idx.venus] >= 2 ? 0.06 : 1
  venus.mesh.material.opacity += (reveal - venus.mesh.material.opacity) * (1 - Math.exp(-dt * 2.5))
  venus.mesh.material.depthWrite = venus.mesh.material.opacity > 0.98

  scene.updateMatrixWorld(true)
  for (const b of Object.values(bodies)) b.updateShadows()

  // Caméra + léger parallaxe à la souris.
  cameraAt(g)
  pmx += (mx - pmx) * (1 - Math.exp(-dt * 2))
  pmy += (my - pmy) * (1 - Math.exp(-dt * 2))
  const dist = cam.pos.distanceTo(cam.target)
  _right.subVectors(cam.target, cam.pos).cross(UP).normalize()
  camera.position.copy(cam.pos)
  if (!reduceMotion) camera.position.addScaledVector(_right, pmx * dist * 0.025).addScaledVector(UP, -pmy * dist * 0.018)
  camera.lookAt(cam.target)
  camera.setViewOffset(innerWidth, innerHeight, cam.ox * innerWidth, cam.oy * innerHeight, innerWidth, innerHeight)

  updateStreaks(dt, vel, cam.travel)
  updateOdometer(i === idx.epilogue && activeBeat[idx.epilogue] >= 3 ? null : cam.au)
  if (audio && audio.ctx.state === 'running') audio.filter.frequency.setTargetAtTime(380 + 900 * Math.exp(-g / 4), audio.ctx.currentTime, 0.5)

  composer.render()
  labelRenderer.render(scene, camera)
}
requestAnimationFrame(frame)
