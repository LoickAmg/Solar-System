import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

/* Kit 3D partagé par le mode classique et le récit : textures photographiques
   (Solar System Scope, CC BY 4.0, d'après les données NASA), Soleil, planètes,
   anneaux et ceinture d'astéroïdes. */

export const BASE = import.meta.env.BASE_URL
export const clamp01 = (t) => Math.min(1, Math.max(0, t))
export const smoothstep = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x) }
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const visualRadius = (diameter) => 0.34 + Math.pow(diameter / 12756, 0.43) * 0.52
export const SUN_RADIUS = 2.3

/* ---------------------------------------------------------- textures */

function oceanMaskInto(canvas, image) {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const ocean = d[i + 2] > d[i] * 1.6 && d[i + 2] > d[i + 1] * 1.15
    const v = ocean ? 255 : 16
    d[i] = v; d[i + 1] = v; d[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
}

function uranusRingTexture() {
  const w = 512, h = 4
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(w, h)
  for (let x = 0; x < w; x++) {
    const t = x / w
    let a = 0.85 * (1 - smoothstep(0, 0.02, Math.abs(t - 0.76)))
    a = Math.max(a, 0.14 * (1 - smoothstep(0, 0.03, Math.abs(t - 0.5))))
    for (let y = 0; y < h; y++) {
      const k = (y * w + x) * 4
      img.data[k] = 176; img.data[k + 1] = 190; img.data[k + 2] = 194; img.data[k + 3] = a * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function glowTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512
  const x = c.getContext('2d')
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256)
  g.addColorStop(0, 'rgba(255,238,196,0.95)')
  g.addColorStop(0.14, 'rgba(255,214,140,0.85)')
  g.addColorStop(0.30, 'rgba(255,160,60,0.4)')
  g.addColorStop(0.55, 'rgba(255,120,30,0.14)')
  g.addColorStop(1, 'rgba(255,110,20,0)')
  x.fillStyle = g; x.fillRect(0, 0, 512, 512)
  return new THREE.CanvasTexture(c)
}

export function loadTextures(renderer, manager) {
  const loader = new THREE.TextureLoader(manager)
  const aniso = renderer.capabilities.getMaxAnisotropy()
  const load = (file, { srgb = true, onLoad } = {}) => {
    const tex = loader.load(`${BASE}textures/${file}`, onLoad)
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = aniso
    return tex
  }

  const specCanvas = document.createElement('canvas')
  specCanvas.width = 1024; specCanvas.height = 512
  const earthSpec = new THREE.CanvasTexture(specCanvas)

  const tx = {
    sun: load('sun.jpg'),
    mercury: load('mercury.jpg'),
    venus: load('venus_atmosphere.jpg'),
    venusSurface: load('venus_surface.jpg'),
    earth: load('earth_daymap.jpg', { onLoad: (t) => { oceanMaskInto(specCanvas, t.image); earthSpec.needsUpdate = true } }),
    earthNight: load('earth_nightmap.jpg'),
    clouds: load('earth_clouds.jpg', { srgb: false }),
    moon: load('moon.jpg'),
    mars: load('mars.jpg'),
    jupiter: load('jupiter.jpg'),
    saturn: load('saturn.jpg'),
    ringSaturn: load('saturn_ring_alpha.png'),
    uranus: load('uranus.jpg'),
    neptune: load('neptune.jpg'),
    sky: load('stars_milky_way.jpg'),
    earthSpec,
    ringUranus: uranusRingTexture(),
    glow: glowTexture(),
  }
  tx.sun.wrapS = THREE.RepeatWrapping
  tx.sky.mapping = THREE.EquirectangularReflectionMapping
  return tx
}

/* ---------------------------------------------------------- shaders */

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

const SUN_VERT = `
varying vec3 vPos; varying vec2 vUv; varying vec3 vNormalV; varying vec3 vViewPos;
void main(){
  vPos = position; vUv = uv;
  vNormalV = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

/* Photosphère : la vraie texture solaire, animée par un bruit qui fait « bouillir » la
   granulation, avec l'assombrissement centre-bord d'une vraie étoile (le bord du disque
   est plus rouge et plus sombre que le centre). uIgnite sert au récit : 0 = protoétoile. */
const SUN_FRAG = `
uniform float uTime; uniform float uIgnite; uniform sampler2D uMap;
varying vec3 vPos; varying vec2 vUv; varying vec3 vNormalV; varying vec3 vViewPos;
${SNOISE}
float fbm(vec3 p){ float a=0.5; float r=0.0; for(int i=0;i<4;i++){ r+=a*snoise(p); p=p*2.03+vec3(11.7); a*=0.5; } return r; }
void main(){
  vec3 p = normalize(vPos);
  float t = uTime * 0.05;
  float n1 = fbm(p * 3.0 + vec3(t, t * 0.7, -t * 0.5));
  float n2 = fbm(p * 8.0 - vec3(t * 1.4, 0.0, t * 0.9) + n1);
  vec3 tex = texture2D(uMap, vUv + vec2(n1, n2) * 0.004 + vec2(uTime * 0.0015, 0.0)).rgb;
  float heat = 0.82 + 0.3 * n1 + 0.22 * n2;
  vec3 col = tex * heat * 2.1;
  col += vec3(1.0, 0.72, 0.32) * pow(max(n2, 0.0), 3.0) * 0.9;
  float mu = clamp(dot(normalize(vNormalV), normalize(-vViewPos)), 0.0, 1.0);
  col *= mix(vec3(0.95, 0.42, 0.12), vec3(1.0), pow(mu, 0.45));
  col *= 0.5 + 0.5 * pow(mu, 0.35);
  vec3 proto = vec3(0.9, 0.22, 0.06) * (0.35 + 0.4 * heat);
  gl_FragColor = vec4(mix(proto, col, uIgnite), 1.0);
}`

const ATMOS_VERT = `varying vec3 vN; varying vec3 vE; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vE=mv.xyz; gl_Position=projectionMatrix*mv; }`
/* Halo vu de l'intérieur d'une coquille (BackSide) : d vaut 0 au bord de la coquille et
   uD0 au bord du globe qu'elle entoure ; l'intensité s'éteint donc en douceur vers
   l'extérieur, sans liseré dur. */
const ATMOS_FRAG = `uniform vec3 uColor; uniform float uPow; uniform float uMul; uniform float uD0; varying vec3 vN; varying vec3 vE;
void main(){ float d = dot(normalize(vN), normalize(vE)); float f = pow(clamp(d / uD0, 0.0, 1.0), uPow); gl_FragColor = vec4(uColor * f * uMul, 1.0); }`

export function makeAtmosphere(radius, color, mul, pw, scale = 1.06) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * scale, 64, 40),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uMul: { value: mul }, uPow: { value: pw }, uD0: { value: Math.sqrt(1 - 1 / (scale * scale)) } },
      vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
  )
}

export function createSun(tx) {
  const group = new THREE.Group()
  const uniforms = { uTime: { value: 0 }, uIgnite: { value: 1 }, uMap: { value: tx.sun } }
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 96, 64),
    new THREE.ShaderMaterial({ uniforms, vertexShader: SUN_VERT, fragmentShader: SUN_FRAG })
  )
  group.add(mesh)
  const corona = makeAtmosphere(SUN_RADIUS, 0xff9a3c, 1.5, 2.6, 1.7)
  group.add(corona)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.glow, color: 0xffb050, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.scale.setScalar(17)
  group.add(glow)
  return { group, mesh, corona, glow, uniforms }
}

/* Lumières des villes : n'apparaissent que du côté nuit (le Soleil est à l'origine du
   monde, donc la direction vers lui est -vWorldPos). */
function attachEarthNightLights(material, nightTexture) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.nightMap = { value: nightTexture }
    shader.vertexShader = `varying vec3 vWorldPos;\nvarying vec3 vWorldNormal;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
 vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
 vWorldNormal = normalize(mat3(modelMatrix) * normal);`
    )
    shader.fragmentShader = `varying vec3 vWorldPos;\nvarying vec3 vWorldNormal;\nuniform sampler2D nightMap;\n${shader.fragmentShader}`.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      {
        float ndotl = dot(normalize(vWorldNormal), normalize(-vWorldPos));
        float nightMix = smoothstep(0.18, -0.22, ndotl);
        vec3 city = texture2D(nightMap, vMapUv).rgb;
        totalEmissiveRadiance += city * vec3(1.0, 0.82, 0.55) * nightMix * 2.2;
      }`
    )
  }
}

/* Ombre de l'anneau sur le globe : un point de la surface est dans l'ombre si le segment
   qui le relie au Soleil traverse le plan de l'anneau entre ses rayons intérieur et
   extérieur (calcul en espace objet ; uSunLocal est mis à jour à chaque image). */
function attachRingShadow(material, innerR, outerR) {
  const uniforms = { uSunLocal: { value: new THREE.Vector3() }, uRingInner: { value: innerR }, uRingOuter: { value: outerR } }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = `varying vec3 vObjPos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>', `#include <begin_vertex>\n vObjPos = position;`
    )
    shader.fragmentShader = `varying vec3 vObjPos;\nuniform vec3 uSunLocal;\nuniform float uRingInner;\nuniform float uRingOuter;\n${shader.fragmentShader}`.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      {
        float dy = uSunLocal.y - vObjPos.y;
        if (abs(dy) > 1e-5) {
          float t = -vObjPos.y / dy;
          if (t > 0.0 && t < 1.0) {
            float r = length(vObjPos.xz + t * (uSunLocal.xz - vObjPos.xz));
            float s = smoothstep(uRingInner - 0.04, uRingInner + 0.04, r) * (1.0 - smoothstep(uRingOuter - 0.04, uRingOuter + 0.04, r));
            diffuseColor.rgb *= 1.0 - s * 0.78;
          }
        }
      }`
    )
  }
  return uniforms
}

/* Ombre du globe sur son anneau : le rayon qui part du fragment vers le Soleil touche-t-il
   la sphère de la planète ? (en espace monde) */
function attachPlanetShadow(material, planetR) {
  const uniforms = { uPlanetPos: { value: new THREE.Vector3() }, uPlanetR: { value: planetR } }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = `varying vec3 vWPos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>', `#include <begin_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    )
    shader.fragmentShader = `varying vec3 vWPos;\nuniform vec3 uPlanetPos;\nuniform float uPlanetR;\n${shader.fragmentShader}`.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      {
        vec3 d = normalize(-vWPos);
        vec3 oc = vWPos - uPlanetPos;
        float b = dot(oc, d);
        float h = b * b - (dot(oc, oc) - uPlanetR * uPlanetR);
        if (b < 0.0) diffuseColor.rgb *= 1.0 - 0.88 * smoothstep(0.0, uPlanetR * uPlanetR * 0.04, h);
      }`
    )
  }
  return uniforms
}

function addRing(parent, inner, outer, tex, opacity, planetR) {
  const geo = new THREE.RingGeometry(inner, outer, 200, 1)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i))
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  const material = new THREE.MeshBasicMaterial({ map: tex, color: 0xd9d2c4, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  const shadow = attachPlanetShadow(material, planetR)
  const ring = new THREE.Mesh(geo, material)
  ring.rotation.x = Math.PI / 2
  ring.renderOrder = 1
  parent.add(ring)
  return { ring, shadow }
}

export function circleLine(r, color, opacity, segments = 160) {
  const pts = []
  for (let i = 0; i <= segments; i++) { const a = (i / segments) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)) }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
}

const ATMOS = {
  earth: { color: 0x6aa8f0, mul: 1.15, pow: 2.2, scale: 1.06 },
  venus: { color: 0xf0c98a, mul: 0.85, pow: 2.0, scale: 1.06 },
  mars: { color: 0xd8956a, mul: 0.45, pow: 2.6, scale: 1.04 },
  uranus: { color: 0x9fd8d8, mul: 0.7, pow: 2.2, scale: 1.06 },
  neptune: { color: 0x5a7fe8, mul: 0.8, pow: 2.2, scale: 1.06 },
}

/**
 * Construit une planète complète (globe, nuages, atmosphère, anneaux, lunes).
 * `withVenusSurface` ajoute sous les nuages de Vénus un second globe (le sol radar),
 * que le récit révèle en rendant la couche nuageuse transparente.
 */
export function createPlanet(planet, tx, { withVenusSurface = false, moonOrbitLines = true } = {}) {
  const radius = visualRadius(planet.diameter)
  const holder = new THREE.Group()
  const tiltGroup = new THREE.Group()
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(planet.tilt)
  holder.add(tiltGroup)

  let mesh, clouds = null, surface = null
  const geo = new THREE.SphereGeometry(radius, 128, 80)
  if (planet.id === 'earth') {
    mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: tx.earth, specularMap: tx.earthSpec, specular: new THREE.Color(0x6f8fb0), shininess: 28 }))
    attachEarthNightLights(mesh.material, tx.earthNight)
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.012, 96, 64),
      new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: tx.clouds, transparent: true, opacity: 0.92, roughness: 1, metalness: 0, depthWrite: false })
    )
    tiltGroup.add(clouds)
  } else if (planet.id === 'venus' && withVenusSurface) {
    surface = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.992, 96, 64), new THREE.MeshStandardMaterial({ map: tx.venusSurface, roughness: 0.95, metalness: 0 }))
    tiltGroup.add(surface)
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tx.venus, roughness: 1, metalness: 0, transparent: true, opacity: 1 }))
  } else {
    const gas = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.id)
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tx[planet.id], roughness: gas ? 1 : 0.92, metalness: 0 }))
  }
  mesh.userData.planet = planet
  tiltGroup.add(mesh)

  const atmo = ATMOS[planet.id]
  if (atmo) tiltGroup.add(makeAtmosphere(radius, atmo.color, atmo.mul, atmo.pow, atmo.scale))

  let ringShadow = null, planetShadow = null, ringOuter = radius
  if (planet.id === 'saturn') {
    const r = addRing(tiltGroup, radius * 1.24, radius * 2.27, tx.ringSaturn, 1, radius)
    planetShadow = r.shadow
    ringShadow = attachRingShadow(mesh.material, radius * 1.24, radius * 2.27)
    ringOuter = radius * 2.27
  }
  if (planet.id === 'uranus') {
    const r = addRing(tiltGroup, radius * 1.55, radius * 2.05, tx.ringUranus, 0.85, radius)
    planetShadow = r.shadow
    ringShadow = attachRingShadow(mesh.material, radius * 1.53, radius * 2.07)
    ringOuter = radius * 2.05
  }

  const moons = planet.moons.map((cfg, mi) => {
    const moonRadius = Math.max(0.045, radius * cfg.r)
    const orbit = radius * cfg.d
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 40, 28), new THREE.MeshStandardMaterial({ map: tx.moon, color: cfg.c, roughness: 0.95, metalness: 0 }))
    moonMesh.userData = { moon: true, name: cfg.name, planetId: planet.id }
    moonMesh.position.x = orbit
    const group = new THREE.Group()
    group.add(moonMesh)
    if (moonOrbitLines) group.add(circleLine(orbit, 0x93aeca, 0.1, 96))
    tiltGroup.add(group)
    return { mesh: moonMesh, group, angle: mi * 1.9 + planet.distance, speed: cfg.s * 0.55, radius: orbit }
  })

  const rotSpeed = (24 / Math.abs(planet.dayH)) * Math.sign(planet.dayH) * 0.35
  const _tmp = new THREE.Vector3()

  return {
    planet, holder, tiltGroup, mesh, clouds, surface, radius, ringOuter, moons,
    spin(dt, speed = 1) {
      mesh.rotation.y += rotSpeed * speed * dt
      if (surface) surface.rotation.y = mesh.rotation.y
      if (clouds) clouds.rotation.y += rotSpeed * 0.62 * speed * dt
      for (const m of moons) { m.angle += m.speed * speed * dt; m.group.rotation.y = m.angle }
    },
    /** À appeler après scene.updateMatrixWorld() : recale les ombres anneau ↔ globe. */
    updateShadows() {
      if (ringShadow) ringShadow.uSunLocal.value.copy(mesh.worldToLocal(_tmp.set(0, 0, 0)))
      if (planetShadow) holder.getWorldPosition(planetShadow.uPlanetPos.value)
    },
  }
}

/* ---------------------------------------------------------- ceinture & ciel */

/* Rocher bosselé et lisse : sommets fusionnés puis déformés par un bruit basse fréquence
   (déterministe selon la position), normales recalculées pour un ombrage doux. */
function rockGeometry(seed) {
  const base = new THREE.IcosahedronGeometry(1, 3)
  base.deleteAttribute('normal')
  base.deleteAttribute('uv')
  const geo = mergeVertices(base)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = 1
      + 0.26 * Math.sin(2.1 * v.x + seed) * Math.sin(1.9 * v.y + seed * 1.7) * Math.sin(2.3 * v.z + seed * 0.6)
      + 0.1 * Math.sin(5.3 * v.x + 3.1 * v.y + seed) * Math.cos(4.7 * v.z - 2.2 * v.x)
      + 0.04 * Math.sin(13.0 * v.y + 9.0 * v.z + seed)
    v.multiplyScalar(n)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

export function createBelt(_tx, { count = 900, rMin, rMax, thickness = 0.55, size = [0.02, 0.075] }) {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0 })
  const kinds = 3
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  for (let k = 0; k < kinds; k++) {
    const n = Math.floor(count / kinds)
    const inst = new THREE.InstancedMesh(rockGeometry(1.3 + k * 2.7), material, n)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const r = rMin + Math.random() * (rMax - rMin)
      dummy.position.set(Math.cos(a) * r, (Math.random() + Math.random() - 1) * thickness, Math.sin(a) * r)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      const s = size[0] + Math.pow(Math.random(), 3) * (size[1] - size[0])
      dummy.scale.set(s, s * (0.65 + Math.random() * 0.5), s * (0.8 + Math.random() * 0.35))
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
      const tone = 0.13 + Math.random() * 0.16
      const warm = Math.random()
      color.setRGB(tone * (1.0 + warm * 0.12), tone * 0.92, tone * (0.84 - warm * 0.1))
      inst.setColorAt(i, color)
    }
    inst.instanceMatrix.needsUpdate = true
    group.add(inst)
  }
  return group
}

/* Quelques étoiles « au premier plan » par-dessus la Voie lactée photographique, pour le scintillement. */
export function createStarField(count, size, opacity, rMin = 300, rMax = 420) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const pal = [[0.78, 0.84, 1], [1, 1, 1], [1, 0.9, 0.76], [0.8, 0.88, 1]]
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin)
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.cos(ph)
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    const c = pal[Math.floor(Math.random() * pal.length)]
    const b = 0.5 + Math.random() * 0.5
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, opacity, depthWrite: false }))
}
