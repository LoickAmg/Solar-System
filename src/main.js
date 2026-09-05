import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

/* ==========================================================
   DONNÉES ENRICHIES — Système solaire
   period = année terrienne · dayH = heures (négatif = rotation rétrograde)
   tilt = inclinaison axiale · incl = inclinaison orbitale
   moons: r = rayon relatif · d = distance orbitale relative · c = teinte · s = vitesse
   ========================================================== */
const SUN_DIAMETER = 1392700

const planets = [
  {
    id: 'mercury', name: 'Mercure', type: 'Tellurique',
    diameter: 4879, distance: 0.39, color: 0x9b9da4, accent: '#bfc4cb',
    mass: '3,30 × 10²³ kg', gravity: '3,7 m/s²', orbitalPeriod: '88 jours',
    dayLength: '58,6 jours', temperature: '-180 °C à 430 °C',
    period: 0.241, dayH: 1407.6, tilt: 0.03, incl: 7.0,
    moons: [],
    description: 'Le plus petit monde et le plus proche du Soleil. Sa surface cratérisée connaît des écarts thermiques extrêmes entre le jour et la nuit.'
  },
  {
    id: 'venus', name: 'Vénus', type: 'Tellurique',
    diameter: 12104, distance: 0.72, color: 0xd5a35f, accent: '#f4d6a0',
    mass: '4,87 × 10²⁴ kg', gravity: '8,87 m/s²', orbitalPeriod: '225 jours',
    dayLength: '243 jours', temperature: '462 °C (surface)',
    period: 0.615, dayH: -5832.5, tilt: 177.4, incl: 3.39,
    moons: [],
    description: 'Une planète jumelle de la Terre par sa taille, mais enveloppée d’une atmosphère dense et brûlante à base de CO₂ qui piège la chaleur.'
  },
  {
    id: 'earth', name: 'Terre', type: 'Tellurique',
    diameter: 12756, distance: 1, color: 0x277bb7, accent: '#8fc8d3',
    mass: '5,97 × 10²⁴ kg', gravity: '9,8 m/s²', orbitalPeriod: '365,25 jours',
    dayLength: '23 h 56 min', temperature: '15 °C (moyenne)',
    period: 1, dayH: 23.93, tilt: 23.44, incl: 0,
    moons: [{ name: 'Lune', r: 0.27, d: 2.7, c: 0xcfcfcf, s: 1.0 }],
    description: 'Notre planète océan, seule planète connue à abriter une biosphère riche et diversifiée. Une lune unique et massive stabilise son axe.'
  },
  {
    id: 'mars', name: 'Mars', type: 'Tellurique',
    diameter: 6792, distance: 1.52, color: 0xb55e45, accent: '#e9a57f',
    mass: '6,42 × 10²³ kg', gravity: '3,71 m/s²', orbitalPeriod: '687 jours',
    dayLength: '24 h 37 min', temperature: '-63 °C (moyenne)',
    period: 1.881, dayH: 24.62, tilt: 25.19, incl: 1.85,
    moons: [
      { name: 'Phobos', r: 0.08, d: 1.8, c: 0xb0a494, s: 2.8 },
      { name: 'Déimos', r: 0.06, d: 2.5, c: 0xa89c8c, s: 2.1 },
    ],
    description: 'Le désert rouge conserve les traces d’une histoire géologique et hydrologique fascinante. Ses deux lunes sont de petits astéroïdes capturés.'
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'Géante gazeuse',
    diameter: 142984, distance: 5.2, color: 0xbc906a, accent: '#f3d7b0',
    mass: '1,90 × 10²⁷ kg', gravity: '24,79 m/s²', orbitalPeriod: '11,86 ans',
    dayLength: '9 h 55 min', temperature: '-108 °C (nuages)',
    period: 11.86, dayH: 9.93, tilt: 3.13, incl: 1.3,
    moons: [
      { name: 'Io', r: 0.26, d: 1.9, c: 0xd8c27a, s: 2.2 },
      { name: 'Europe', r: 0.22, d: 2.45, c: 0xd8cdbb, s: 1.7 },
      { name: 'Ganymède', r: 0.34, d: 3.05, c: 0xa89a8a, s: 1.3 },
      { name: 'Callisto', r: 0.3, d: 3.7, c: 0x8d8378, s: 1.0 },
    ],
    description: 'Le géant du système solaire. Ses quatre lunes galiléennes forment un mini-système fascinant. La Grande Tache Rouge est une tempête géante.'
  },
  {
    id: 'saturn', name: 'Saturne', type: 'Géante gazeuse',
    diameter: 120536, distance: 9.54, color: 0xd0b47b, accent: '#f1dbad',
    mass: '5,68 × 10²⁶ kg', gravity: '10,44 m/s²', orbitalPeriod: '29,46 ans',
    dayLength: '10 h 33 min', temperature: '-139 °C (nuages)',
    period: 29.46, dayH: 10.66, tilt: 26.73, incl: 2.49,
    moons: [
      { name: 'Encelade', r: 0.1, d: 2.7, c: 0xe8ecec, s: 1.6 },
      { name: 'Dioné', r: 0.13, d: 3.1, c: 0xcfcbc0, s: 1.4 },
      { name: 'Rhéa', r: 0.12, d: 3.5, c: 0xc5c0b5, s: 1.2 },
      { name: 'Titan', r: 0.3, d: 4.1, c: 0xc8a25f, s: 0.95 },
      { name: 'Japet', r: 0.13, d: 4.8, c: 0xb0a898, s: 0.7 },
    ],
    description: 'Un monde pâle entouré d’anneaux glacés spectaculaires et d’une famille de lunes remarquables. Titan possède une atmosphère dense.'
  },
  {
    id: 'uranus', name: 'Uranus', type: 'Géante de glace',
    diameter: 51118, distance: 19.19, color: 0x77b8c0, accent: '#c3f0ec',
    mass: '8,68 × 10²⁵ kg', gravity: '8,69 m/s²', orbitalPeriod: '84 ans',
    dayLength: '17 h 14 min', temperature: '-197 °C (nuages)',
    period: 84.02, dayH: -17.24, tilt: 97.77, incl: 0.77,
    moons: [
      { name: 'Miranda', r: 0.09, d: 2.2, c: 0xb8c4c4, s: 1.5 },
      { name: 'Ariel', r: 0.13, d: 2.6, c: 0xc4cccc, s: 1.3 },
      { name: 'Umbriel', r: 0.12, d: 3.0, c: 0x9ca8a8, s: 1.1 },
      { name: 'Titania', r: 0.15, d: 3.5, c: 0xbcc4c4, s: 0.9 },
      { name: 'Obéron', r: 0.15, d: 4.0, c: 0xb4bec0, s: 0.75 },
    ],
    description: 'Une géante bleu-vert qui tourne presque sur le côté (inclinaison de 98°), avec un système d’anneaux discrets et une famille de lunes glacées.'
  },
  {
    id: 'neptune', name: 'Neptune', type: 'Géante de glace',
    diameter: 49528, distance: 30.07, color: 0x3d63b5, accent: '#9eb8ff',
    mass: '1,02 × 10²⁶ kg', gravity: '11,15 m/s²', orbitalPeriod: '164,8 ans',
    dayLength: '16 h 6 min', temperature: '-201 °C (nuages)',
    period: 164.8, dayH: 16.11, tilt: 28.32, incl: 1.77,
    moons: [
      { name: 'Protée', r: 0.12, d: 2.1, c: 0x9aa4a8, s: 1.3 },
      { name: 'Triton', r: 0.22, d: 2.7, c: 0xd0d8dc, s: -1.2 },
      { name: 'Néréide', r: 0.07, d: 3.6, c: 0xa8a094, s: 0.6 },
    ],
    description: 'La frontière bleue du système solaire, balayée par des vents supersoniques les plus rapides du système. Triton orbite à rebours.'
  },
]

/* ==========================================================
    TEXTURES PROCÉDURALES HD — bruit de valeur sans couture
    (l'échantillonnage en cos/sin garantit la périodicité en longitude)
    ========================================================== */
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.min(1, Math.max(0, t))
const smoothstep = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x) }
const mix3 = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

function makeNoise(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const t = p[i]; p[i] = p[j]; p[j] = t
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  function noise2(x, y) {
    const X = Math.floor(x), Y = Math.floor(y)
    const xf = x - X, yf = y - Y
    const xi = X & 255, yi = Y & 255
    const h = (i, j) => perm[perm[xi + i] + yi + j] / 255
    const u = fade(xf), v = fade(yf)
    const tl = h(0, 0), tr = h(1, 0), bl = h(0, 1), br = h(1, 1)
    return (tl + (tr - tl) * u) * (1 - v) + (bl + (br - bl) * u) * v
  }
  function fbm(x, y, oct = 4) {
    let sum = 0, amp = 1, norm = 0
    for (let i = 0; i < oct; i++) {
      sum += amp * noise2(x, y)
      norm += amp; amp *= 0.5; x *= 2.07; y *= 2.07
    }
    return sum / norm
  }
  return { fbm }
}
const N = makeNoise(1337)

function paletteAt(stops, t) {
  t = clamp01(t)
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1)
      return mix3(stops[i - 1][1], stops[i][1], k)
    }
  }
  return stops[stops.length - 1][1]
}
const P = (arr) => arr.map(([t, c]) => [t, hexRgb(c)])

function buildTexture(w, h, fn) {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    const v = y / h
    for (let x = 0; x < w; x++) {
      const u = x / w
      const a = u * Math.PI * 2
      const c = fn(u, v, Math.cos(a), Math.sin(a))
      const i = (y * w + x) * 4
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]
      d[i + 3] = c.length > 3 ? c[3] : 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return { canvas, ctx }
}
function toTexture(canvas, linear = false) {
  const tex = new THREE.CanvasTexture(canvas)
  if (!linear) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

function craters(ctx, w, h, count, strength = 1) {
  for (let i = 0; i < count; i++) {
    const cx = Math.random() * w
    const cy = Math.random() * h
    const r = 1.5 + Math.random() * 9
    const offs = [0]
    if (cx < 24) offs.push(w)
    if (cx > w - 24) offs.push(-w)
    for (const ox of offs) {
      const x = cx + ox
      const g = ctx.createRadialGradient(x, cy, r * 0.15, x, cy, r)
      g.addColorStop(0, `rgba(0,0,0,${0.28 * strength})`)
      g.addColorStop(0.62, `rgba(0,0,0,${0.1 * strength})`)
      g.addColorStop(0.82, `rgba(255,255,255,${0.09 * strength})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const textures = {}

// Mercure — gris cratérisé
{
  const { canvas, ctx } = buildTexture(512, 256, (u, v, cu, sv) => {
    const e = N.fbm(cu * 2.4 + 3.7, v * 4.8, 4) * 0.6 + N.fbm(sv * 4.2 + 8.1, v * 9.0, 3) * 0.4
    const base = mix3([112, 112, 118], [178, 178, 184], e)
    const g = 1 - 0.22 * N.fbm(cu * 9 + 1.2, sv * 9 + 3.3, 2)
    return [base[0] * g, base[1] * g, base[2] * g]
  })
  craters(ctx, 512, 256, 130)
  textures.mercury = toTexture(canvas)
}

// Vénus — nuages ocre en swirl
textures.venus = toTexture(buildTexture(512, 256, (u, v, cu, sv) => {
  const w1 = N.fbm(cu * 1.8 + 3.3, v * 3.6, 3)
  const sw = N.fbm(cu * 3.4 + w1 * 1.7 + 11.0, v * 6.4 + w1 * 1.3, 4)
  return mix3([196, 144, 78], [242, 216, 162], sw)
}).canvas)

// Terre — couleur + specular océans + nuages
{
  const w = 1024, h = 512
  const c1 = document.createElement('canvas'); c1.width = w; c1.height = h
  const c2 = document.createElement('canvas'); c2.width = w; c2.height = h
  const x1 = c1.getContext('2d'), x2 = c2.getContext('2d')
  const i1 = x1.createImageData(w, h), i2 = x2.createImageData(w, h)
  const d1 = i1.data, d2 = i2.data
  for (let y = 0; y < h; y++) {
    const v = y / h
    const pol = smoothstep(0.35, 0.385, Math.abs(v - 0.5))
    for (let x = 0; x < w; x++) {
      const u = x / w
      const cu = Math.cos(u * Math.PI * 2), sv = Math.sin(u * Math.PI * 2)
      const e = N.fbm(cu * 1.7 + 7.3, v * 3.6, 4) * 0.62 + N.fbm(sv * 2.9 + 3.1, v * 7.2, 3) * 0.38
      let col, spec
      if (e > 0.545) {
        const g = N.fbm(cu * 4.5 + 11.0, v * 9.4, 3)
        col = mix3([42, 104, 66], [178, 154, 102], smoothstep(0.42, 0.74, g))
        if (Math.abs(v - 0.5) < 0.16 && g > 0.56) col = mix3(col, [204, 176, 118], 0.6)
        spec = 30
      } else {
        col = mix3([10, 38, 92], [28, 96, 165], smoothstep(0.3, 0.545, e))
        spec = 235
      }
      if (pol > 0) {
        col = mix3(col, [232, 238, 244], pol * 0.92)
        spec = lerp(spec, 120, pol)
      }
      const i = (y * w + x) * 4
      d1[i] = col[0]; d1[i + 1] = col[1]; d1[i + 2] = col[2]; d1[i + 3] = 255
      d2[i] = spec; d2[i + 1] = spec; d2[i + 2] = spec; d2[i + 3] = 255
    }
  }
  x1.putImageData(i1, 0, 0); x2.putImageData(i2, 0, 0)
  textures.earth = toTexture(c1)
  textures.earthSpec = toTexture(c2, true)
  textures.clouds = toTexture(buildTexture(512, 256, (u, v, cu, sv) => {
    const c = N.fbm(cu * 2.6 + 21.0, v * 5.4, 4) * 0.6 + N.fbm(sv * 5.2 + 4.4, v * 10.5, 3) * 0.4
    return [255, 255, 255, smoothstep(0.52, 0.8, c) * 235]
  }).canvas)
}

// Mars — ocre + mers sombres + calottes
textures.mars = toTexture(buildTexture(768, 384, (u, v, cu, sv) => {
  const e = N.fbm(cu * 2.2 + 8.8, v * 4.6, 4) * 0.65 + N.fbm(sv * 4.6 + 2.2, v * 9.4, 3) * 0.35
  let col = mix3([142, 52, 24], [218, 132, 82], e)
  const m = N.fbm(cu * 1.5 + 2.2, v * 3.0, 3)
  if (m > 0.58) col = mix3(col, [92, 38, 20], Math.min(1, (m - 0.58) * 3.2))
  const pol = smoothstep(0.4, 0.435, Math.abs(v - 0.5))
  return mix3(col, [238, 228, 218], pol * 0.8)
}).canvas)

// Jupiter — bandes turbulentes + Grande Tache Rouge
{
  const stops = P([[0, '#a8886a'], [0.07, '#c9a97e'], [0.14, '#e8d3ac'], [0.22, '#b58a5e'],
    [0.30, '#f0e0c0'], [0.38, '#c49a6a'], [0.46, '#ead2a8'], [0.52, '#a87850'],
    [0.60, '#f2e2c4'], [0.68, '#c08c5e'], [0.76, '#e6cfa8'], [0.84, '#b08860'],
    [0.92, '#d8bc94'], [1, '#a07858']])
  const { canvas, ctx } = buildTexture(1024, 512, (u, v, cu, sv) => {
    const tb = (N.fbm(cu * 2.6 + 4.2, v * 22, 4) - 0.5) * 0.055 + (N.fbm(sv * 7.0 + 9.1, v * 44, 3) - 0.5) * 0.02
    const col = paletteAt(stops, v + tb)
    const b = 1 + (N.fbm(cu * 8.0 + 1.0, v * 55, 3) - 0.5) * 0.22
    return [col[0] * b, col[1] * b, col[2] * b]
  })
  ctx.fillStyle = 'rgba(240,220,190,0.35)'
  ctx.beginPath(); ctx.ellipse(1024 * 0.30, 512 * 0.63, 1024 * 0.07, 512 * 0.055, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(186,84,46,0.85)'
  ctx.beginPath(); ctx.ellipse(1024 * 0.30, 512 * 0.63, 1024 * 0.052, 512 * 0.04, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(222,124,92,0.9)'
  ctx.beginPath(); ctx.ellipse(1024 * 0.30, 512 * 0.63, 1024 * 0.028, 512 * 0.021, 0, 0, Math.PI * 2); ctx.fill()
  textures.jupiter = toTexture(canvas)
}

// Saturne — bandes pastel
{
  const stops = P([[0, '#b39872'], [0.1, '#cdb387'], [0.2, '#e2cd9f'], [0.35, '#d4b98a'],
    [0.5, '#ecd9ae'], [0.65, '#d6bd8e'], [0.8, '#e8d4a6'], [0.92, '#c4a87a'], [1, '#ab9068']])
  textures.saturn = toTexture(buildTexture(768, 384, (u, v, cu, sv) => {
    const tb = (N.fbm(cu * 2.2 + 6.5, v * 18, 3) - 0.5) * 0.025
    return paletteAt(stops, v + tb)
  }).canvas)
}

// Uranus — dégradé cyan lissé
{
  const stops = P([[0, '#8ec8ce'], [0.45, '#aadde0'], [0.55, '#a2d8da'], [1, '#78b6bd']])
  textures.uranus = toTexture(buildTexture(512, 256, (u, v, cu, sv) => {
    const t = v + (N.fbm(cu * 2.0 + 5.0, v * 8.0, 3) - 0.5) * 0.04
    const col = paletteAt(stops, t)
    const band = 1 - 0.05 * (1 - smoothstep(0, 0.05, Math.abs(v - 0.62)))
    return [col[0] * band, col[1] * band, col[2] * band]
  }).canvas)
}

// Neptune — bleu profond + traînées + tache sombre
{
  const stops = P([[0, '#2b49a8'], [0.35, '#3a63c8'], [0.5, '#4a7ad9'], [0.68, '#3a5fc0'], [1, '#27438f']])
  const { canvas, ctx } = buildTexture(512, 256, (u, v, cu, sv) => {
    const tb = (N.fbm(cu * 2.4 + 7.7, v * 14, 3) - 0.5) * 0.03
    let col = paletteAt(stops, v + tb)
    const streak = N.fbm(cu * 3.0 + 14.0, v * 18, 3)
    if (streak > 0.66) col = mix3(col, [220, 230, 255], (streak - 0.66) * 1.6)
    return col
  })
  ctx.fillStyle = 'rgba(18,30,72,0.55)'
  ctx.beginPath(); ctx.ellipse(512 * 0.42, 256 * 0.45, 512 * 0.09, 256 * 0.05, 0, 0, Math.PI * 2); ctx.fill()
  textures.neptune = toTexture(canvas)
}

// Lune — gris + mers + cratères
{
  const { canvas, ctx } = buildTexture(256, 128, (u, v, cu, sv) => {
    const e = N.fbm(cu * 2.6 + 5.5, v * 5.2, 4) * 0.6 + N.fbm(sv * 5.0 + 2.7, v * 10, 3) * 0.4
    let col = mix3([140, 140, 144], [204, 204, 208], e)
    const m = N.fbm(cu * 1.6 + 6.0, v * 2.2, 3)
    if (m > 0.62) col = mix3(col, [96, 96, 100], (m - 0.62) * 3)
    return col
  })
  craters(ctx, 256, 128, 60, 0.8)
  textures.moon = toTexture(canvas)
}

// Anneaux de Saturne — bandes radiales + divisions de Cassini/Encke
textures.ringSaturn = toTexture(buildTexture(1024, 8, (u) => {
  const t = u
  const n = N.fbm(t * 34, 0.5, 3)
  let a = 0.3 + 0.7 * smoothstep(0.35, 0.75, n)
  a *= smoothstep(0, 0.06, t)
  a *= 1 - 0.9 * smoothstep(0.92, 1.0, t)
  a *= 1 - 0.92 * (1 - smoothstep(0, 0.014, Math.abs(t - 0.6)))
  a *= 1 - 0.8 * (1 - smoothstep(0, 0.008, Math.abs(t - 0.86)))
  const col = mix3([152, 134, 102], [236, 218, 180], n)
  return [col[0], col[1], col[2], a * 255]
}).canvas)

// Anneaux d'Uranus — discrets, un anneau lumineux (epsilon)
textures.ringUranus = toTexture(buildTexture(256, 8, (u) => {
  const t = u
  let a = 0.85 * (1 - smoothstep(0, 0.02, Math.abs(t - 0.76)))
  a = Math.max(a, 0.14 * (1 - smoothstep(0, 0.03, Math.abs(t - 0.5))))
  return [176, 190, 194, a * 255]
}).canvas)

// Sprite de lueur solaire
function glowTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256
  const x = c.getContext('2d')
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,214,140,0.9)')
  g.addColorStop(0.22, 'rgba(255,160,60,0.4)')
  g.addColorStop(0.5, 'rgba(255,120,30,0.14)')
  g.addColorStop(1, 'rgba(255,110,20,0)')
  x.fillStyle = g; x.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

// Sprite d'anneau de sélection
function selectRingTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128
  const x = c.getContext('2d')
  x.strokeStyle = '#e6ae61'; x.lineWidth = 3.5
  x.shadowColor = '#e6ae61'; x.shadowBlur = 12
  x.beginPath(); x.arc(64, 64, 54, 0, Math.PI * 2); x.stroke()
  return new THREE.CanvasTexture(c)
}

// Fond dégradé vertical
function backgroundTexture() {
  const c = document.createElement('canvas'); c.width = 2; c.height = 512
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#030509'); g.addColorStop(0.45, '#071021'); g.addColorStop(0.75, '#0a1830'); g.addColorStop(1, '#04070d')
  x.fillStyle = g; x.fillRect(0, 0, 2, 512)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
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
        <div class="scene-card"><div class="scene-head"><div><label>01 / Navigation spatiale</label><h2>Carte 3D du système solaire</h2></div><div class="scene-tools"><button id="view-system" class="tool-button active" type="button">Système</button><button id="view-selected" class="tool-button" type="button">Suivre la sélection</button></div></div><div id="scene" class="scene"><div id="scene-loader" class="scene-loader"><span class="loader-mark"></span><span class="loader-text">Initialisation du moteur 3D…</span></div><div class="scene-overlay"><span class="axis">Y ↑</span><span class="hint">Glisser pour orbiter · molette pour zoomer · clic sur une planète pour la suivre</span></div></div><div class="scene-foot"><button id="pause" class="primary-button" type="button">Ⅱ <span>Pause</span></button><label class="range-label">Vitesse <input id="speed" type="range" min="0" max="2" step="0.1" value="0.6"><b id="speed-value">0,6×</b></label><button id="toggle-moons" class="link-button" type="button">Masquer lunes</button><button id="toggle-labels" class="link-button" type="button">Masquer étiquettes</button><button id="reset-camera" class="link-button" type="button">Réinitialiser la vue</button></div></div>
        <aside class="inspector"><label>02 / Fiche d’observation</label><div id="swatch" class="swatch"></div><p id="type" class="planet-type">Tellurique</p><h2 id="name">Terre</h2><p id="description" class="description"></p><div class="facts facts-grid"><div><small>Diamètre équatorial</small><strong id="diameter"></strong></div><div><small>Distance moyenne</small><strong id="distance"></strong></div><div><small>Masse</small><strong id="mass"></strong></div><div><small>Gravité de surface</small><strong id="gravity"></strong></div><div><small>Période orbitale</small><strong id="orbitalPeriod"></strong></div><div><small>Durée du jour</small><strong id="dayLength"></strong></div><div><small>Température moy.</small><strong id="temperature"></strong></div><div><small>Comparée à la Terre</small><strong id="earth-ratio"></strong></div></div><div class="moons"><small>Lunes principales <b id="moon-count">—</b></small><div id="moon-list"></div></div><div class="record"><span></span><code id="record-id">EARTH / TERRE</code></div></aside>
      </section>
      <section class="comparison"><div class="section-head"><div><label>03 / Comparateur pédagogique</label><h2>Les proportions, autrement.</h2></div><div class="compare-switch"><button data-mode="size" class="compare-button active" type="button">Taille</button><button data-mode="distance" class="compare-button" type="button">Distance</button><button data-mode="sun-size" class="compare-button" type="button">Taille vs Soleil</button><button data-mode="sun-dist" class="compare-button" type="button">Distance Soleil</button></div></div><p class="comparison-intro">Les valeurs réelles sont conservées dans les fiches. Les barres utilisent une échelle logarithmique pour rendre visibles les écarts entre les corps célestes.</p><div id="bars" class="bars"></div><div id="sun-compare" class="sun-compare hidden"><div class="sun-visual"><div class="sun-circle"></div><div class="sun-label">Soleil <small>1 392 700 km</small></div></div><div class="planet-vs"><div id="vs-planet" class="vs-planet-circle"></div><div id="vs-planet-name" class="vs-planet-name"></div></div></div></section>
    </main>
    <footer><span>Solar System / Field Notes</span><span>Données de référence : NASA Science</span><span class="footer-links mono"><a href="mentions-legales.html">Mentions légales</a><a href="confidentialite.html">Confidentialité</a><a href="contact.html">Contact</a></span></footer>
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
   THREE.JS — SCÈNE
   ========================================================== */
/* ==========================================================
    GLSL — Soleil & atmosphères
    ========================================================== */
const SNOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`
const SUN_VERT = `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const SUN_FRAG = `
uniform float uTime; varying vec3 vPos;
${SNOISE}
float fbm(vec3 p){ float a=0.5; float r=0.0; for(int i=0;i<5;i++){ r+=a*snoise(p); p=p*2.03+vec3(11.7); a*=0.5; } return r; }
void main(){
  vec3 p=normalize(vPos);
  float t=uTime*0.055;
  float n1=fbm(p*3.2+vec3(t,t*0.7,-t*0.5));
  float n2=fbm(p*6.5-vec3(t*1.3,0.0,t*0.8)+n1*0.9);
  float heat=clamp(0.5+0.5*n1+0.35*n2,0.0,1.4);
  vec3 deep=vec3(0.45,0.08,0.01); vec3 mid=vec3(1.0,0.42,0.04); vec3 hot=vec3(1.0,0.86,0.50);
  vec3 col=mix(deep,mid,smoothstep(0.0,0.6,heat));
  col=mix(col,hot,smoothstep(0.55,1.05,heat));
  col+=hot*pow(max(n2,0.0),3.0)*0.9;
  gl_FragColor=vec4(col*1.35,1.0);
}`
const ATMOS_VERT = `varying vec3 vN; varying vec3 vE; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vE=mv.xyz; gl_Position=projectionMatrix*mv; }`
const ATMOS_FRAG = `uniform vec3 uColor; uniform float uPow; uniform float uMul; varying vec3 vN; varying vec3 vE; void main(){ float f=pow(clamp(1.0-abs(dot(normalize(vN),normalize(-vE))),0.0,1.0),uPow); gl_FragColor=vec4(uColor,1.0)*f*uMul; }`

/* ==========================================================
    ÉTAT — SCÈNE, RENDERS, POST-PROCESSING
    ========================================================== */
const sceneHost = document.querySelector('#scene')
const scene = new THREE.Scene()
scene.background = backgroundTexture()
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200)
camera.position.copy(HOME_POS)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15
sceneHost.prepend(renderer.domElement)

const composer = new EffectComposer(renderer)
composer.setPixelRatio(renderer.getPixelRatio())
composer.setSize(sceneHost.clientWidth, sceneHost.clientHeight)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(sceneHost.clientWidth, sceneHost.clientHeight), 0.72, 0.6, 0.78)
composer.addPass(bloom)
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

scene.add(new THREE.AmbientLight(0x3a4a66, 0.55))
const sunLight = new THREE.PointLight(0xfff1d6, 3.2, 0, 0)
sunLight.position.set(0, 0, 0)
scene.add(sunLight)

/* ---- Étoiles + voie lactée ---- */
function starField(count, size, opacity) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const pal = [[0.72, 0.78, 0.88], [1, 1, 1], [1, 0.88, 0.72], [0.72, 0.82, 1]]
  for (let i = 0; i < count; i++) {
    const r = 200 + Math.random() * 160
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.cos(ph)
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    const c = pal[Math.floor(Math.random() * pal.length)]
    const b = 0.45 + Math.random() * 0.55
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, opacity, depthWrite: false }))
}
scene.add(starField(2600, 1.6, 0.85))
scene.add(starField(160, 3.2, 1))
{
  const count = 2400
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2
    const r = 230 + Math.random() * 120
    pos[i * 3] = Math.cos(th) * r
    pos[i * 3 + 1] = (Math.random() + Math.random() + Math.random() - 1.5) * 26
    pos[i * 3 + 2] = Math.sin(th) * r
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const band = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaec0e0, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }))
  band.rotation.set(1.05, 0, 0.4)
  scene.add(band)
}

/* ---- Soleil ---- */
const sunUniforms = { uTime: { value: 0 } }
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.3, 64, 48),
  new THREE.ShaderMaterial({ uniforms: sunUniforms, vertexShader: SUN_VERT, fragmentShader: SUN_FRAG })
)
scene.add(sun)
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb050, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }))
sunGlow.scale.setScalar(16)
scene.add(sunGlow)

/* ---- Helpers de construction ---- */
function circleLine(r, color, opacity) {
  const pts = []
  for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)) }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }))
}
function makeAtmosphere(radius, color, mul, pw) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.14, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uMul: { value: mul }, uPow: { value: pw } },
      vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    })
  )
}
function addRing(parent, inner, outer, tex, opacity) {
  const geo = new THREE.RingGeometry(inner, outer, 160, 1)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i))
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity, side: THREE.DoubleSide, roughness: 1, metalness: 0, depthWrite: false }))
  ring.rotation.x = Math.PI / 2
  ring.renderOrder = 1
  parent.add(ring)
  return ring
}
function makeLabel(text, color) {
  const div = document.createElement('div')
  div.className = 'p-label'
  div.innerHTML = `<i style="background:${color}"></i><span>${text}</span>`
  return div
}
const sunLabel = new CSS2DObject(makeLabel('Soleil', '#ffbd58'))
sunLabel.position.set(0, 3.5, 0)
scene.add(sunLabel)

/* ==========================================================
   PLANÈTES ET LUNES
   ========================================================== */
const planetObjects = []
const moonGroups = []
const distanceScale = (distance) => 4.8 + Math.log(distance + 1) * 5.8
const visualRadius = (diameter) => 0.34 + Math.pow(diameter / 12756, 0.43) * 0.52
const ATMOS = {
  earth: { color: 0x5f9fe8, mul: 0.7, pow: 2.6 },
  venus: { color: 0xf0c98a, mul: 0.5, pow: 2.8 },
  mars: { color: 0xd8956a, mul: 0.22, pow: 3.2 },
  uranus: { color: 0x9fd8d8, mul: 0.35, pow: 3.0 },
  neptune: { color: 0x5a7fe8, mul: 0.4, pow: 3.0 },
}
const selRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: selectRingTexture(), color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }))
selRing.visible = false
selRing.renderOrder = 999

planets.forEach((planet, index) => {
  const orbitRadius = distanceScale(planet.distance)
  const radius = visualRadius(planet.diameter)

  const inclGroup = new THREE.Group()
  inclGroup.rotation.x = THREE.MathUtils.degToRad(planet.incl)
  inclGroup.rotation.y = index * 1.7
  scene.add(inclGroup)
  inclGroup.add(circleLine(orbitRadius, 0x93aeca, 0.22))

  const pivot = new THREE.Group()
  inclGroup.add(pivot)
  const holder = new THREE.Group()
  holder.position.x = orbitRadius
  pivot.add(holder)
  const tiltGroup = new THREE.Group()
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(planet.tilt)
  holder.add(tiltGroup)

  let mesh, clouds = null
  if (planet.id === 'earth') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.MeshPhongMaterial({ map: textures.earth, specularMap: textures.earthSpec, specular: new THREE.Color(0x8fa8c0), shininess: 16 }))
    clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 48, 32), new THREE.MeshStandardMaterial({ map: textures.clouds, transparent: true, opacity: 0.9, roughness: 1, depthWrite: false }))
    tiltGroup.add(clouds)
  } else {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.MeshStandardMaterial({ map: textures[planet.id], roughness: 0.88, metalness: 0.02 }))
  }
  mesh.userData.planet = planet
  tiltGroup.add(mesh)

  const atmo = ATMOS[planet.id]
  if (atmo) tiltGroup.add(makeAtmosphere(radius, atmo.color, atmo.mul, atmo.pow))

  if (planet.id === 'saturn') {
    addRing(tiltGroup, radius * 1.24, radius * 2.3, textures.ringSaturn, 0.95)
    const thin = new THREE.Mesh(new THREE.RingGeometry(radius * 2.42, radius * 2.6, 128), new THREE.MeshBasicMaterial({ color: 0xcbb078, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }))
    thin.rotation.x = Math.PI / 2
    tiltGroup.add(thin)
  }
  if (planet.id === 'uranus') addRing(tiltGroup, radius * 1.55, radius * 2.05, textures.ringUranus, 0.8)

  const moons = planet.moons.map((cfg, mi) => {
    const moonRadius = Math.max(0.045, radius * cfg.r)
    const moonOrbitRadius = radius * cfg.d
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 20, 14), new THREE.MeshStandardMaterial({ map: textures.moon, color: cfg.c, roughness: 0.95 }))
    moonMesh.userData = { moon: true, name: cfg.name, planetId: planet.id }
    const moonGroup = new THREE.Group()
    moonMesh.position.x = moonOrbitRadius
    moonGroup.add(moonMesh)
    moonGroup.add(circleLine(moonOrbitRadius, 0x93aeca, 0.1))
    tiltGroup.add(moonGroup)
    const entry = { mesh: moonMesh, group: moonGroup, angle: mi * 1.9 + index, speed: cfg.s * 0.55, radius: moonOrbitRadius }
    moonGroups.push(entry)
    return entry
  })

  const sel = selRing
  const labelDiv = makeLabel(planet.name, planet.accent)
  labelDiv.addEventListener('click', (e) => { e.stopPropagation(); selectPlanet(planet) })
  const label = new CSS2DObject(labelDiv)
  label.position.set(0, radius * 1.75 + 0.18, 0)
  holder.add(label)
  labelEls[planet.id] = labelDiv

  planetObjects.push({
    planet, mesh, clouds, holder, pivot, radius, sel,
    angle: index * 0.78 + Math.random() * 0.5,
    orbitSpeed: 0.35 / planet.period,
    rotSpeed: (24 / Math.abs(planet.dayH)) * Math.sign(planet.dayH) * 0.35,
    moons,
  })
})

/* ==========================================================
   CEINTURE D'ASTÉROÏDES
   ========================================================== */
const beltGroup = new THREE.Group()
scene.add(beltGroup)
{
  const count = 550
  const inst = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x8a7d6d, roughness: 1, metalness: 0 }),
    count
  )
  const dummy = new THREE.Object3D()
  const rMin = distanceScale(2.15), rMax = distanceScale(3.25)
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const r = rMin + Math.random() * (rMax - rMin)
    dummy.position.set(Math.cos(a) * r, (Math.random() + Math.random() - 1) * 0.55, Math.sin(a) * r)
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    const s = 0.02 + Math.random() * 0.055
    dummy.scale.set(s, s * (0.6 + Math.random() * 0.8), s)
    dummy.updateMatrix()
    inst.setMatrixAt(i, dummy.matrix)
  }
  inst.instanceMatrix.needsUpdate = true
  beltGroup.add(inst)
}

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
    ? planet.moons.map((m) => `<span>${m.name}</span>`).join('')
    : '<span class="empty">Aucune lune principale</span>'
  document.querySelector('#record-id').textContent = `${planet.id.toUpperCase()} / ${planet.name.toUpperCase()}`
  const item = planetObjects.find((o) => o.planet.id === planet.id)
  if (item) {
    item.holder.add(selRing)
    selRing.scale.setScalar(item.radius * 3.6)
    selRing.visible = true
  }
  Object.entries(labelEls).forEach(([id, el]) => el.classList.toggle('active', id === planet.id))
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
  if (!item) return
  followId = planet.id
  setActiveView('selected')
  const wp = new THREE.Vector3(); item.holder.getWorldPosition(wp)
  const r = item.radius
  camTween = { t: 0, dur: 1.4, follow: true, item, offset: new THREE.Vector3(r * 3.4, r * 2.2, r * 5.4), fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos: new THREE.Vector3(), toTarget: new THREE.Vector3() }
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
window.addEventListener('resize', resize)

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const _wp = new THREE.Vector3()
const _delta = new THREE.Vector3()
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)

  if (!paused) {
    sunUniforms.uTime.value += dt
    sun.rotation.y += 0.02 * dt * speed
    beltGroup.rotation.y += 0.08 * dt * speed
    planetObjects.forEach((item) => {
      item.angle += item.orbitSpeed * speed * dt
      item.pivot.rotation.y = item.angle
      item.mesh.rotation.y += item.rotSpeed * speed * dt
      if (item.clouds) item.clouds.rotation.y += item.rotSpeed * 0.62 * speed * dt
      item.moons.forEach((m) => {
        m.angle += m.speed * speed * dt
        m.group.rotation.y = m.angle
      })
    })
  }

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
if (loaderEl) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loaderEl.classList.add('done')
    })
  })
}
requestAnimationFrame(animate)
