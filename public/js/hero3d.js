// Scène 3D du hero : voiture concept en showroom, reflets, néons rouges, caméra pilotée par le scroll et la souris.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PAINTS = {
  graphite: { color: 0x2a2d32, roughness: 0.35 },
  argent: { color: 0xc4c8ce, roughness: 0.22 },
  rouge: { color: 0x8f0a1c, roughness: 0.25 },
  blanc: { color: 0xeeeeec, roughness: 0.3 },
};
const CAR_LENGTH = 4.6;

// Ombre douce au sol, dessinée dans un canvas (pas de fichier à charger)
function contactShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,.95)');
  grad.addColorStop(0.5, 'rgba(0,0,0,.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function initHero({ canvas, onProgress, onReady, onError }) {
  const isMobile = matchMedia('(max-width: 800px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    onError?.(e);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050506);
  scene.fog = new THREE.Fog(0x050506, 10, 24);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Sol noir laqué
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 64),
    new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.7, roughness: 0.3, envMapIntensity: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Anneaux lumineux au sol (rouge du logo + argent)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff1a33, transparent: true });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.014, 8, 200), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.006, 8, 200), new THREE.MeshBasicMaterial({ color: 0xc9ccd1, transparent: true, opacity: 0.25 }));
  for (const r of [ring, ring2]) { r.rotation.x = -Math.PI / 2; r.position.y = 0.005; scene.add(r); }

  // Rampes lumineuses de studio au plafond : elles dessinent des reflets sur la carrosserie
  const stripMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 0.1), stripMat);
    s.position.set(0, 5.5, i * 1.3);
    scene.add(s);
  }

  scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rimRed = new THREE.PointLight(0xff1a33, 40, 14, 1.6);
  rimRed.position.set(-4.5, 1.4, -2.5);
  scene.add(rimRed);
  const rimRed2 = new THREE.PointLight(0xff1a33, 10, 12, 1.6);
  rimRed2.position.set(4.5, 2.2, -3.5);
  scene.add(rimRed2);

  // Matériaux
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: PAINTS.graphite.color, metalness: 0.9, roughness: PAINTS.graphite.roughness, clearcoat: 1, clearcoatRoughness: 0.03 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: 0x08080a, metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x050507, metalness: 0.9, roughness: 0.04, transparent: true, opacity: 0.82 });

  const car = new THREE.Group();
  scene.add(car);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_, loaded, total) => onProgress?.(loaded / total);
  const draco = new DRACOLoader(manager).setDecoderPath('/vendor/three/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader(manager).setDRACOLoader(draco);

  loader.load('/models/car.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      // Plaque et emblème retirés : aucun logo tiers à l'écran
      if (/License|Emblem/i.test(o.name)) { o.visible = false; return; }
      const m = o.material;
      if (/^Paint 1/.test(m.name)) o.material = bodyMat;
      else if (/^Paint 2/.test(m.name)) o.material = accentMat;
      else if (m.transmission > 0) o.material = glassMat;
      else if (m.emissive && /Brake|Signal/i.test(m.name)) m.emissiveIntensity = 3;
    });

    // Mise à l'échelle, centrage et orientation (longueur sur l'axe Z)
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    if (size.x > size.z) model.rotation.y = Math.PI / 2;
    model.scale.setScalar(CAR_LENGTH / Math.max(size.x, size.z));
    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    const final = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(final.x * 1.5, final.z * 1.25),
      new THREE.MeshBasicMaterial({ map: contactShadow(), transparent: true, depthWrite: false, toneMapped: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    car.add(shadow, model);
    onReady?.();
  }, undefined, (e) => onError?.(e));

  // Post-traitement : bloom discret, seulement sur les sources très lumineuses
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), isMobile ? 0.35 : 0.5, 0.45, 0.9));
  composer.addPass(new OutputPass());

  // Interaction : souris (parallaxe) et scroll (orbite autour de la voiture)
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
    // Décale la voiture vers la droite sur grand écran pour laisser la place au titre
    camera.filmOffset = w > 800 ? -Math.min(8, (w / h) * 3.6) : 0;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  let intro = 0;
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    intro = Math.min(1, intro + dt * 0.4);
    const ease = 1 - Math.pow(1 - intro, 3);
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    smoothScroll += (scroll - smoothScroll) * 0.08;

    // Arrivée en travelling, puis lente orbite + scroll + souris
    const angle = 0.9 + t * 0.05 + smoothScroll * 2.4 + pointer.x * 0.3 - (1 - ease) * 1.6;
    const radius = (isMobile ? 15 : 11) - smoothScroll * 2 + (1 - ease) * 5;
    camera.position.set(Math.sin(angle) * radius, 1.7 - pointer.y * 0.4 + smoothScroll * 1.2, Math.cos(angle) * radius);
    camera.lookAt(0, isMobile ? -1.5 : 0.5, 0);

    ringMat.opacity = 0.6 + Math.sin(t * 1.6) * 0.3;
    composer.render();
  });

  return {
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
