import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type LollaView = "SE" | "SW" | "NE" | "NW";

// View labels use model axes, matching the standalone study this was ported
// from: +X east, GLB Y up. Home is the resting three-quarter view the roof
// rises into on load; the four corners are the camera presets.
const HOME = { position: new THREE.Vector3(17, 26, 48), target: new THREE.Vector3(0, 2.5, 0) };
const CORNERS: Record<LollaView, THREE.Vector3> = {
  SE: new THREE.Vector3(32, 34.5, 32),
  SW: new THREE.Vector3(-32, 34.5, 32),
  NE: new THREE.Vector3(32, 34.5, -32),
  NW: new THREE.Vector3(-32, 34.5, -32),
};

const PALETTE: Record<string, string> = {
  TENT_ANIMATED: "#CD007F",
  MAGENTA_ANIMATED: "#CD007F",
  GRASS_ANIMATED: "#B5B5B8",
  RAILING_ANIMATED: "#87878E",
  FURNITURE_ANIMATED: "#F2F2F2",
  ANIMATED_CHROME: "#D6D6DA",
};

export interface LollaControls {
  load(): Promise<void>;
  /** Plays the roof-rise clip once, then hides the roof and hands orbit
   *  control to the viewer. Separate from `load()` so the caller can gate
   *  it on its own scroll-reveal timing rather than firing the moment the
   *  model is ready. Safe to call more than once — later calls are no-ops. */
  reveal(): void;
  view(name: LollaView): void;
  toggleGable(): boolean;
  dispose(): void;
}

const ease = (t: number) => t * t * (3 - 2 * t);

export function createLollaScene(host: HTMLDivElement): LollaControls {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor("#050507");
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Lolla pavilion model. Drag to orbit, scroll to zoom, or use the view buttons.",
  );
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 250);
  camera.position.copy(HOME.position);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.copy(HOME.target);
  orbit.enableDamping = false;
  orbit.minZoom = 0.65;
  orbit.maxZoom = 3;
  orbit.maxPolarAngle = Math.PI * 0.49;
  orbit.listenToKeyEvents(renderer.domElement);
  // Held off until reveal() hands control over — before that the roof is
  // still sitting at its bind pose, unrevealed, and there's nothing to gain
  // from letting a stray drag or wheel nudge the camera this early.
  orbit.enabled = false;
  orbit.update();

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
  let environment: THREE.WebGLRenderTarget | undefined;
  try {
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    room.dispose();
  } catch (error) {
    console.warn("Lolla: falling back without a chrome environment map.", error);
  } finally {
    pmrem.dispose();
  }

  const decoder = new DRACOLoader().setDecoderPath("/draco/");
  decoder.setWorkerLimit(2);

  let disposed = false;
  let frame = 0;
  let root: THREE.Group | undefined;
  let mixer: THREE.AnimationMixer | undefined;
  let roofAction: THREE.AnimationAction | undefined;
  let roof: THREE.Object3D | undefined;
  let roofHome = new THREE.Vector3();
  let roofMaterials: THREE.Material[] = [];
  let gableShown = false;
  let revealed = false;

  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  orbit.addEventListener("change", render);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = Math.max(9.5, 16.5 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Self-cancelling tween helper — matches this site's other scene modules
  // (see exchange-scene.ts `select`): a short-lived rAF loop that runs only
  // while something is actually moving, rather than the standalone study's
  // permanent per-frame loop.
  function animate(durationMs: number, onFrame: (t: number) => void, onDone?: () => void) {
    cancelAnimationFrame(frame);
    const duration = reducedMotion ? 0 : durationMs;
    const start = performance.now();
    const tick = () => {
      if (disposed) return;
      const t = duration ? Math.min((performance.now() - start) / duration, 1) : 1;
      onFrame(ease(t));
      render();
      if (t < 1) frame = requestAnimationFrame(tick);
      else onDone?.();
    };
    tick();
  }

  function reveal() {
    if (revealed || !mixer || !roofAction || !roof) return;
    revealed = true;
    renderer.shadowMap.autoUpdate = true;
    roofAction.reset().play();
    let last = performance.now();
    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      mixer!.update(reducedMotion ? 1 : dt);
      render();
      if (roofAction!.isRunning()) {
        frame = requestAnimationFrame(tick);
      } else {
        finishRise();
      }
    };
    // The rise plays once to show the roof settling into place, then hides
    // it again — "gable hidden" is the resting state the standalone study
    // shipped with, and this is what the Show/Hide gable toggle fades from.
    // Pre-seeding opacity to 0 here (rather than only on first toggle) is
    // what lets that first fade-in start from actually-invisible instead of
    // snapping in at full opacity for one frame.
    const finishRise = () => {
      roofAction!.stop();
      roof!.position.copy(roofHome);
      roof!.visible = false;
      roofMaterials.forEach((material) => {
        (material as THREE.MeshLambertMaterial).opacity = 0;
      });
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      orbit.enabled = true;
      render();
    };
    if (reducedMotion) {
      mixer.update(roofAction.getClip().duration);
      finishRise();
    } else {
      tick();
    }
  }

  function view(name: LollaView) {
    const from = { position: camera.position.clone(), target: orbit.target.clone(), zoom: camera.zoom };
    const to = { position: CORNERS[name], target: HOME.target };
    animate(700, (t) => {
      camera.position.lerpVectors(from.position, to.position, t);
      orbit.target.lerpVectors(from.target, to.target, t);
      camera.zoom = THREE.MathUtils.lerp(from.zoom, 1, t);
      camera.updateProjectionMatrix();
      orbit.update();
    });
  }

  function toggleGable(): boolean {
    if (!roof || roofMaterials.length === 0) return gableShown;
    gableShown = !gableShown;
    const show = gableShown;
    const wasHidden = !roof.visible;
    roof.visible = true;
    roofMaterials.forEach((material) => {
      material.transparent = true;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
    const fromY = wasHidden && show ? roofHome.y + 1.2 : roof.position.y;
    const fromOpacity = wasHidden && show ? 0 : (roofMaterials[0] as THREE.MeshLambertMaterial).opacity;
    renderer.shadowMap.autoUpdate = true;
    animate(
      350,
      (t) => {
        roof!.position.y = THREE.MathUtils.lerp(fromY, roofHome.y + (show ? 0 : 1.2), t);
        roofMaterials.forEach((material) => {
          (material as THREE.MeshLambertMaterial).opacity = THREE.MathUtils.lerp(
            fromOpacity,
            show ? 1 : 0,
            t,
          );
        });
      },
      () => {
        roofMaterials.forEach((material) => {
          material.transparent = false;
          material.depthWrite = true;
          material.needsUpdate = true;
        });
        roof!.visible = show;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
        render();
      },
    );
    return gableShown;
  }

  function disposeModel(node: THREE.Object3D) {
    node.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
          material.dispose();
        }
      }
    });
  }

  return {
    async load() {
      const gltf = await new GLTFLoader().setDRACOLoader(decoder).loadAsync("/models/lolla.glb");
      if (disposed) {
        disposeModel(gltf.scene);
        return;
      }
      root = gltf.scene;
      root.traverse((mesh) => {
        if (!(mesh instanceof THREE.Mesh)) return;
        const name = mesh.name;
        const old = mesh.material;
        mesh.material =
          name === "ANIMATED_CHROME" && environment
            ? new THREE.MeshStandardMaterial({
                color: PALETTE[name],
                metalness: 1,
                roughness: 0.16,
                envMap: environment.texture,
                envMapIntensity: 1.2,
              })
            : new THREE.MeshLambertMaterial({ color: PALETTE[name] || "#B5B5B8", side: THREE.DoubleSide });
        for (const material of Array.isArray(old) ? old : [old]) material.dispose();
        mesh.castShadow = name !== "GRASS_ANIMATED";
        mesh.receiveShadow = true;
      });
      scene.add(root);

      roof = root.getObjectByName("TENT_ANIMATED");
      const clip = THREE.AnimationClip.findByName(gltf.animations, "RoofRise");
      if (!roof || !clip) {
        throw new Error("Lolla model is missing the TENT_ANIMATED node or the RoofRise clip.");
      }
      roofHome = roof.position.clone();
      roofMaterials = [];
      roof.traverse((node) => {
        if (node instanceof THREE.Mesh) roofMaterials.push(node.material as THREE.Material);
      });
      mixer = new THREE.AnimationMixer(root);
      roofAction = mixer.clipAction(clip);
      roofAction.setLoop(THREE.LoopOnce, 1);
      roofAction.clampWhenFinished = true;

      render();
    },
    reveal,
    view,
    toggleGable,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      orbit.dispose();
      decoder.dispose();
      mixer?.stopAllAction();
      if (root) {
        mixer?.uncacheRoot(root);
        disposeModel(root);
      }
      environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
