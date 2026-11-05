// Scène 3D du hero.
// Intro : showroom dans le noir, les phares s'allument, le moteur démarre, la voiture avance vers l'écran,
// freine, puis la caméra passe en orbite (pilotée par le scroll et la souris).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Réglages du modèle 3D. Pour changer de voiture (ex. BMW M3), remplacer le fichier
// et adapter les noms ci-dessous (voir README).
const CAR = {
  url: '/models/car.glb',
  length: 4.6, // longueur en mètres après mise à l'échelle
  paint: /^Paint 1/, // matériau de carrosserie principal
  accent: /^Paint 2/, // éléments de carrosserie secondaires
  headlights: /Headlight/, // matériau des phares avant
  taillights: /Brakelight|Taillight/, // matériau des feux arrière
  wheels: ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'],
  hide: /License|Emblem/, // pièces masquées (plaque, logos tiers)
};

const PAINTS = {
  noir: { color: 0x050507, roughness: 0.18 },
  graphite: { color: 0x2a2d32, roughness: 0.32 },
  argent: { color: 0xc4c8ce, roughness: 0.22 },
  rouge: { color: 0x8f0a1c, roughness: 0.25 },
};

// Chronologie de l'intro (secondes)
const T = { lightsOn: 0.5, studioOn: 1.0, engine: 1.1, driveStart: 1.7, driveEnd: 5.2, camBlend: 1.8 };
const START_Z = -20;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function initHero({ canvas, onProgress, onReady, onError }) {
  const isMobile = matchMedia('(max-width: 800px)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    onError?.(e);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030304);
  scene.fog = new THREE.Fog(0x030304, 12, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Sol noir laqué
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x060607, metalness: 0.25, roughness: 0.5, envMapIntensity: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Anneaux lumineux au sol (rouge du logo + argent), allumés après l'arrivée
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff1a33, transparent: true, opacity: 0 });
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xc9ccd1, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.014, 8, 200), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.006, 8, 200), ring2Mat);
  for (const r of [ring, ring2]) { r.rotation.x = -Math.PI / 2; r.position.y = 0.005; scene.add(r); }

  // Rampes de studio : s'allument une à une
  const strips = [];
  for (let i = -1; i <= 1; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const s = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 0.1), m);
    s.position.set(0, 5.5, i * 1.3);
    scene.add(s);
    strips.push(m);
  }

  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0);
  const key = new THREE.DirectionalLight(0xffffff, 0);
  key.position.set(3, 6, 4);
  const rimRed = new THREE.PointLight(0xff1a33, 0, 14, 1.6);
  rimRed.position.set(-4.5, 1.4, -2.5);
  const rimRed2 = new THREE.PointLight(0xff1a33, 0, 12, 1.6);
  rimRed2.position.set(4.5, 2.2, -3.5);
  scene.add(hemi, key, rimRed, rimRed2);

  // Matériaux
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: PAINTS.noir.color, metalness: 0.85, roughness: PAINTS.noir.roughness, clearcoat: 1, clearcoatRoughness: 0.02 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: 0x08080a, metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x050507, metalness: 0.9, roughness: 0.04, transparent: true, opacity: 0.85 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xeaf2ff, emissiveIntensity: 0 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff1020, emissiveIntensity: 0 });

  // Voiture + faisceaux des phares
  const car = new THREE.Group();
  scene.add(car);
  const beams = [];
  for (const side of [-1, 1]) {
    const spot = new THREE.SpotLight(0xeaf2ff, 0, 22, Math.PI / 7, 0.55, 1.2);
    spot.position.set(side * 0.65, 0.8, 2.0);
    spot.target.position.set(side * 0.9, 0, 10);
    car.add(spot, spot.target);
    beams.push(spot);
  }

  let wheels = [];
  let wheelRadius = 0.35;
  const body = new THREE.Group(); // reçoit les vibrations moteur et le tangage au freinage
  car.add(body);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_, loaded, total) => onProgress?.(loaded / total);
  const draco = new DRACOLoader(manager).setDecoderPath('/vendor/three/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader(manager).setDRACOLoader(draco);

  loader.load(CAR.url, (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      if (CAR.hide.test(o.name)) { o.visible = false; return; }
      const name = o.material.name || '';
      if (CAR.paint.test(name)) o.material = bodyMat;
      else if (CAR.accent.test(name)) o.material = accentMat;
      else if (CAR.headlights.test(name)) o.material = headMat;
      else if (CAR.taillights.test(name)) o.material = tailMat;
      else if (o.material.transmission > 0) o.material = glassMat;
    });

    // Mise à l'échelle et centrage (avant de la voiture vers +Z)
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(CAR.length / Math.max(size.x, size.z));
    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    model.updateMatrixWorld(true);
    const final = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());

    wheels = CAR.wheels.map((n) => model.getObjectByName(n)).filter(Boolean);
    if (wheels[0]) wheelRadius = new THREE.Box3().setFromObject(wheels[0]).getSize(new THREE.Vector3()).y / 2;

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(final.x * 1.5, final.z * 1.25),
      new THREE.MeshBasicMaterial({ map: radialTexture([[0, 'rgba(0,0,0,.95)'], [0.5, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false, toneMapped: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    car.add(shadow);
    body.add(model);
    car.position.z = reduceMotion ? 0 : START_Z;
    onReady?.();
  }, undefined, (e) => onError?.(e));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), isMobile ? 0.45 : 0.6, 0.5, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Interaction
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
  });
  let scroll = 0;
  let smoothScroll = 0;
  const hero = canvas.closest('section');
  addEventListener('scroll', () => { scroll = Math.min(1, Math.max(0, scrollY / hero.offsetHeight)); }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.filmOffset = w > 800 ? -Math.min(8, (w / h) * 3.6) : 0;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  // État de l'intro
  let introT = null; // temps écoulé depuis le lancement (avance image par image)
  let introDone = reduceMotion;
  let onIntroEnd = null;
  let lastZ = START_Z;
  let pitchVel = 0, pitch = 0;
  let orbitTime = 0;
  const axisX = new THREE.Vector3(1, 0, 0);
  const qSpin = new THREE.Quaternion();
  const camIntro = new THREE.Vector3();
  const camOrbit = new THREE.Vector3();
  const look = new THREE.Vector3();

  // Clignotement d'allumage des phares (style démarrage)
  const flicker = (t) => (t < 0 ? 0 : t < 0.08 ? 1 : t < 0.16 ? 0.15 : t < 0.26 ? 1 : t < 0.32 ? 0.5 : 1);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const now = clock.elapsedTime;
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    smoothScroll += (scroll - smoothScroll) * 0.08;

    if (introT !== null) introT += dt;
    const t = introT === null ? (reduceMotion ? 99 : -1) : introT;

    // 1. Lumières : phares (avec clignotement), feux arrière, puis studio
    const lights = reduceMotion ? 1 : flicker(t - T.lightsOn);
    headMat.emissiveIntensity = lights * 4;
    tailMat.emissiveIntensity = lights * 4;
    beams.forEach((b) => (b.intensity = lights * 10));
    const studio = reduceMotion ? 1 : smooth(T.studioOn, T.studioOn + 2.2, t);
    strips.forEach((m, i) => m.color.setScalar(smooth(i * 0.25, i * 0.25 + 0.5, studio * 1.5)));
    scene.environmentIntensity = 0.12 + studio * 0.78;
    hemi.intensity = studio * 0.15;
    key.intensity = studio * 1.6;
    rimRed.intensity = studio * 40;
    rimRed2.intensity = studio * 6;

    // 2. Démarrage moteur : vibration de la caisse
    const rev = smooth(T.engine, T.engine + 0.15, t) * (1 - smooth(T.engine + 0.5, T.engine + 0.9, t));
    const idle = t > T.engine ? 0.0025 : 0;
    body.position.y = Math.sin(now * 90) * (rev * 0.012 + idle);

    // 3. Approche vers l'écran, roues qui tournent, freinage avec plongée du nez
    if (!reduceMotion && t >= 0) {
      const k = Math.min(1, Math.max(0, (t - T.driveStart) / (T.driveEnd - T.driveStart)));
      car.position.z = START_Z * (1 - easeOut(k));
      const dz = car.position.z - lastZ;
      lastZ = car.position.z;
      qSpin.setFromAxisAngle(axisX, dz / wheelRadius);
      wheels.forEach((w) => w.quaternion.premultiply(qSpin));
      // Tangage : léger cabrage au démarrage, plongée du nez au freinage, puis rebond amorti
      const target = k > 0 && k < 0.15 ? -0.008 : k > 0.6 && k < 1 ? 0.016 : 0;
      pitchVel += ((target - pitch) * 70 - pitchVel * 8) * dt;
      pitch += pitchVel * dt;
      body.rotation.x = pitch;
      if (!introDone && t > T.driveEnd + 0.4) { introDone = true; onIntroEnd?.(); }
    }

    // 4. Caméra : plan bas de face pendant l'approche, puis orbite libre
    const blend = reduceMotion ? 1 : smooth(T.driveEnd - 0.6, T.driveEnd + T.camBlend, t);
    if (blend > 0) orbitTime += dt;
    camIntro.set(isMobile ? 1.6 : 2.4, isMobile ? 0.9 : 0.75, isMobile ? 11 : 7.8);
    const angle = 0.35 + orbitTime * 0.05 + smoothScroll * 2.4 + pointer.x * 0.3 * blend;
    const radius = (isMobile ? 15 : 11) - smoothScroll * 2;
    camOrbit.set(Math.sin(angle) * radius, 1.7 - pointer.y * 0.4 + smoothScroll * 1.2, Math.cos(angle) * radius);
    camera.position.lerpVectors(camIntro, camOrbit, blend);
    look.set(0, THREE.MathUtils.lerp(isMobile ? -1.2 : 0.55, isMobile ? -1.5 : 0.5, blend), THREE.MathUtils.lerp(car.position.z * 0.55, 0, blend));
    camera.lookAt(look);

    // Anneaux au sol une fois la voiture arrivée
    const rings = reduceMotion ? 1 : smooth(T.driveEnd - 0.3, T.driveEnd + 1, t);
    ringMat.opacity = rings * (0.6 + Math.sin(now * 1.6) * 0.3);
    ring2Mat.opacity = rings * 0.25;
    composer.render();
  });

  return {
    // Lance l'intro ; la promesse se résout quand la voiture est arrêtée
    start() {
      introT = 0;
      return new Promise((resolve) => (introDone ? resolve() : (onIntroEnd = resolve)));
    },
    setPaint(name) {
      const p = PAINTS[name];
      const from = bodyMat.color.clone();
      const to = new THREE.Color(p.color);
      let k = 0;
      const step = () => {
        k = Math.min(1, k + 0.05);
        bodyMat.color.copy(from).lerp(to, k);
        if (k < 1) requestAnimationFrame(step);
      };
      bodyMat.roughness = p.roughness;
      step();
    },
  };
}
