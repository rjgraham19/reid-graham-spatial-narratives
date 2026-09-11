import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// View labels use model axes: +X east, -Rhino Y front/south. GLB uses Y up.
export const CAMERAS = {
  Hero: { position: [17, 26, 48], target: [0, 2.5, 0] },
  SE: { position: [32, 34.5, 32], target: [0, 2.5, 0] },
  SW: { position: [-32, 34.5, 32], target: [0, 2.5, 0] },
  NE: { position: [32, 34.5, -32], target: [0, 2.5, 0] },
  NW: { position: [-32, 34.5, -32], target: [0, 2.5, 0] }
};

// Isolated trigger: replace this function when integrating Lenis/ScrollTrigger.
// It resets a partial wait on exit and never repeats a completed trigger.
export function observeReveal(element, onReveal, onVisibility, delay = 2500) {
  let timer, fired = false, visible = false;
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const observer = new IntersectionObserver(([entry]) => {
    const next = !document.hidden && entry.isIntersecting && entry.intersectionRatio >= 0.5;
    if (next === visible) return;
    visible = next;
    onVisibility(visible);
    clear();
    if (visible && !fired) timer = setTimeout(() => {
      if (visible && !fired) { fired = true; onReveal(); }
    }, delay);
  }, { threshold: [0, 0.5, 1] });
  observer.observe(element);
  const onPageVisibility = () => {
    clear();
    visible = false;
    onVisibility(false);
    observer.unobserve(element);
    if (!document.hidden) observer.observe(element);
  };
  document.addEventListener('visibilitychange', onPageVisibility);
  return () => {
    clear(); observer.disconnect();
    document.removeEventListener('visibilitychange', onPageVisibility);
  };
}

export async function createPavilion(stage, navigation, status) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  stage.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 250);
  camera.position.fromArray(CAMERAS.Hero.position);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.fromArray(CAMERAS.Hero.target);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.minZoom = 0.65;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.4));
  const key = new THREE.DirectionalLight(0xffffff, Math.PI * 0.7);
  key.position.set(-15, 35, -20);
  key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 100 });
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 2.5;
  key.shadow.blurSamples = 8;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.012;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe5edff, Math.PI * 0.12);
  fill.position.set(18, 12, 24);
  scene.add(fill);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environment;
  try {
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    room.dispose();
  } catch (error) {
    console.warn('Using cool silver fallback for chrome.', error);
  } finally { pmrem.dispose(); }

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    const aspect = width / Math.max(height, 1);
    const halfHeight = Math.max(9.5, 16.5 / aspect);
    Object.assign(camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight });
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const sizes = new ResizeObserver(resize);
  sizes.observe(stage);
  resize();
  const decoder = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/gltf/');
  decoder.setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  let gltf;
  try { gltf = await loader.loadAsync(new URL('./lolla.glb', import.meta.url).href); }
  catch (error) {
    sizes.disconnect(); controls.dispose(); decoder.dispose();
    environment?.dispose(); renderer.dispose(); renderer.domElement.remove();
    throw error;
  }
  const palette = {
    TENT_ANIMATED: '#E20074', MAGENTA_ANIMATED: '#B5005D',
    GRASS_ANIMATED: '#B5B5B8', RAILING_ANIMATED: '#87878E',
    FURNITURE_ANIMATED: '#F2F2F2', ANIMATED_CHROME: '#D6D6DA'
  };
  gltf.scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    const name = mesh.name;
    const old = mesh.material;
    mesh.material = name === 'ANIMATED_CHROME' && environment
      ? new THREE.MeshStandardMaterial({ color: palette[name], metalness: 1, roughness: 0.16, envMap: environment.texture, envMapIntensity: 1.2 })
      : new THREE.MeshLambertMaterial({ color: palette[name] || '#B5B5B8', side: THREE.DoubleSide });
    if (Array.isArray(old)) old.forEach(m => m.dispose()); else old.dispose();
    mesh.castShadow = name !== 'GRASS_ANIMATED';
    mesh.receiveShadow = true;
  });
  scene.add(gltf.scene);
  const roof = gltf.scene.getObjectByName('TENT_ANIMATED');
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'RoofRise');
  if (!roof || !clip) throw new Error('Required TENT_ANIMATED node or RoofRise clip missing.');
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  const roofHome = roof.position.clone();
  const roofMaterials = [];
  roof.traverse(node => { if (node.isMesh) roofMaterials.push(node.material); });
  let phase = 'waiting', inView = false, cameraTween = null, roofTween = null;
  let gableShown = false, roofFlight = false, frame = 0, disposed = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gable = navigation.querySelector('#gable');
  const viewButtons = [...navigation.querySelectorAll('[data-view]')];
  const ease = t => t * t * (3 - 2 * t);
  function hideRoof() {
    action.stop();
    roof.position.copy(roofHome);
    roof.visible = false;
    roofFlight = false;
    gable.disabled = false;
    renderer.shadowMap.needsUpdate = true;
  }
  function finishReveal() {
    if (phase === 'revealed') return;
    hideRoof();
    phase = 'revealed';
    controls.enabled = true;
    stage.classList.add('revealed');
    renderer.shadowMap.needsUpdate = true;
    roofMaterials.forEach(material => { material.opacity = 0; });
    renderer.domElement.tabIndex = 0;
    controls.listenToKeyEvents(renderer.domElement);
    stage.setAttribute('aria-label', 'Interactive pavilion. Drag to orbit; scroll to zoom.');
    navigation.hidden = false;
    requestAnimationFrame(() => navigation.classList.add('visible'));
    status.textContent = 'Pavilion revealed. Camera views and gable control are available.';
  }
  let revealFinished = false;
  mixer.addEventListener('finished', () => { revealFinished = true; });
  const stopObserving = observeReveal(stage, () => {
    phase = 'rising';
    action.reset().play();
    if (reducedMotion) finishReveal();
  }, visible => { inView = visible; });

  function selectView(event) {
    const name = event.currentTarget.dataset.view;
    cameraTween = {
      time: performance.now(), position: camera.position.clone(),
      target: controls.target.clone(), zoom: camera.zoom,
      look: new THREE.Vector3(...CAMERAS[name].target),
      startOrbit: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),
      endOrbit: new THREE.Spherical().setFromVector3(new THREE.Vector3(...CAMERAS[name].position).sub(new THREE.Vector3(...CAMERAS[name].target)))
    };
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  }
  function interruptCamera() {
    cameraTween = null;
    viewButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
  }
  controls.addEventListener('start', interruptCamera);
  viewButtons.forEach(button => button.addEventListener('click', selectView));
  function toggleGable() {
    if (gable.disabled) return;
    gableShown = !gableShown;
    gable.disabled = true;
    gable.setAttribute('aria-pressed', String(gableShown));
    gable.textContent = gableShown ? 'Hide gable' : 'Show gable';
    if (!gableShown) {
      // Reuse the complete baked upward flight, without fading it away.
      roofTween = null;
      roofMaterials.forEach(material => {
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
        material.needsUpdate = true;
      });
      roofFlight = true;
      action.reset().play();
      if (reducedMotion) hideRoof();
      return;
    }
    roof.visible = true;
    roofTween = {
      time: performance.now(), y: roofHome.y + 1.2,
      opacity: 0, show: true
    };
    roofMaterials.forEach(material => {
      material.transparent = true;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  }
  gable.addEventListener('click', toggleGable);
  let previous = performance.now();
  function tick(now) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (((phase === 'rising' && inView) || roofFlight) && !document.hidden) {
      mixer.update(dt);
      renderer.shadowMap.needsUpdate = true;
    }
    if (revealFinished) {
      revealFinished = false;
      if (phase === 'rising') finishReveal();
      else if (roofFlight) hideRoof();
    }
    if (cameraTween) {
      const t = ease(Math.min(1, (now - cameraTween.time) / (reducedMotion ? 1 : 1000)));
      controls.target.lerpVectors(cameraTween.target, cameraTween.look, t);
      const a = cameraTween.startOrbit, b = cameraTween.endOrbit;
      const angle = THREE.MathUtils.euclideanModulo(b.theta - a.theta + Math.PI, Math.PI * 2) - Math.PI;
      camera.position.setFromSpherical(new THREE.Spherical(
        THREE.MathUtils.lerp(a.radius, b.radius, t),
        THREE.MathUtils.lerp(a.phi, b.phi, t),
        a.theta + angle * t
      )).add(controls.target);
      camera.zoom = THREE.MathUtils.lerp(cameraTween.zoom, 1, t);
      camera.updateProjectionMatrix();
      if (t === 1) cameraTween = null;
    }
    if (roofTween) {
      renderer.shadowMap.needsUpdate = true;
      const t = ease(Math.min(1, (now - roofTween.time) / (reducedMotion ? 1 : 350)));
      roof.position.y = THREE.MathUtils.lerp(roofTween.y, roofHome.y + (roofTween.show ? 0 : 1.2), t);
      roofMaterials.forEach(material => {
        material.opacity = THREE.MathUtils.lerp(roofTween.opacity, roofTween.show ? 1 : 0, t);
        if (t === 1) { material.transparent = false; material.depthWrite = true; material.needsUpdate = true; }
      });
      if (t === 1) { roof.visible = roofTween.show; roofTween = null; gable.disabled = false; }
    }
    controls.update();
    if (!document.hidden) renderer.render(scene, camera);
  }
  renderer.render(scene, camera);
  renderer.shadowMap.autoUpdate = false;
  stage.querySelector('#poster')?.remove();
  frame = requestAnimationFrame(tick);
  return () => {
    disposed = true; cancelAnimationFrame(frame); stopObserving(); sizes.disconnect();
    viewButtons.forEach(button => button.removeEventListener('click', selectView));
    gable.removeEventListener('click', toggleGable);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
    controls.dispose(); decoder.dispose(); environment?.dispose();
    gltf.scene.traverse(node => { if (node.isMesh) { node.geometry.dispose(); node.material.dispose(); } });
    renderer.dispose(); renderer.domElement.remove();
  };
}

const status = document.querySelector('#status');
createPavilion(document.querySelector('#stage'), document.querySelector('#navigation'), status)
  .then(dispose => window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true }))
  .catch(error => { status.textContent = 'The model could not load. The reference image remains available.'; console.error(error); });

