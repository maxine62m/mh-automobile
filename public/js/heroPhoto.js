// Hero « photo cinéma » : la voiture détourée arrive du fond du showroom.
// Séquence : noir → phares qui s'allument → démarrage (vibration) → approche → freinage → relief à la souris.

const TIMELINE = { lights: 400, studio: 900, engine: 1000, drive: 1600, driveDuration: 3000 };

export function initHeroPhoto(stage) {
  const car = stage.querySelector('.stage-car');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Relief : la voiture pivote légèrement en suivant la souris (perspective CSS)
  let tx = 0, ty = 0, x = 0, y = 0, scrollK = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
  });
  addEventListener('scroll', () => { scrollK = Math.min(1, scrollY / stage.offsetHeight); }, { passive: true });
  const loop = () => {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    stage.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
    stage.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
    stage.style.setProperty('--px', `${(x * -14).toFixed(1)}px`);
    stage.style.setProperty('--scroll', scrollK.toFixed(3));
    requestAnimationFrame(loop);
  };
  loop();

  return {
    async start() {
      if (reduceMotion) { stage.classList.add('s-lights', 's-studio', 's-arrived', 's-done'); return; }
      await wait(TIMELINE.lights);
      stage.classList.add('s-lights'); // phares (clignotement CSS)
      await wait(TIMELINE.studio - TIMELINE.lights);
      stage.classList.add('s-studio'); // rampes du plafond
      await wait(TIMELINE.engine - TIMELINE.studio);
      car.classList.add('engine'); // vibration moteur
      await wait(TIMELINE.drive - TIMELINE.engine);
      stage.classList.add('s-drive'); // approche
      await wait(TIMELINE.driveDuration);
      car.classList.remove('engine');
      stage.classList.add('s-arrived'); // plongée au freinage
      await wait(700);
      stage.classList.add('s-done');
    },
  };
}
