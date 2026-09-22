import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import keys from "./record-player-motion.json";

const ASSETS = "/models/record-player/";
export interface RecordPlayerScene {
  load(): Promise<void>;
  seek(progress: number): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

// Captured annular texture phase: clockwise, one eased turn. Late frames are
// nearly edge-on, so the full-turn endpoint is inferred from the visible arc.
export function discAngle(progress: number) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  return THREE.MathUtils.degToRad(-22.5) - Math.PI * 2 * p * p * (3 - 2 * p);
}

export function createRecordPlayerScene(host: HTMLDivElement, onFailure: () => void, referenceFraming = false): RecordPlayerScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x0a0908, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.68;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 2000);
  const light = new THREE.DirectionalLight(0xfff6ed, 1.8);
  light.position.set(-110, 190, 140);
  light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -115, right: 115, top: 135, bottom: -100, near: 1, far: 450 });
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0003;
  light.shadow.normalBias = 0.1;
  scene.add(light, new THREE.HemisphereLight(0xfff5ea, 0x292027, 0.45));
  const fill = new THREE.DirectionalLight(0xe2e5ff, 0.65);
  fill.position.set(100, 90, -40);
  scene.add(fill);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.05);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.42;
  const decoder = new DRACOLoader().setDecoderPath("/draco/").setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  let root: THREE.Object3D | undefined;
  let disc: THREE.Object3D | undefined;
  let disposed = false;
  let visible = false;
  let progress = 0;
  let width = 0, height = 0;
  let frame = 0;
  const boundsPoints: THREE.Vector3[] = [];

  const draw = () => {
    frame = 0;
    if (disposed || !visible || !root || !width || !height || document.hidden) return;
    renderer.render(scene, camera);
  };
  const requestDraw = () => {
    if (!frame && !disposed && visible) frame = requestAnimationFrame(draw);
  };

  function pose() {
    let index = keys.findIndex((key) => key.p >= progress);
    if (index < 1) index = 1;
    const a = keys[index - 1], b = keys[index];
    const t = THREE.MathUtils.clamp((progress - a.p) / (b.p - a.p), 0, 1);
    camera.position.fromArray(a.eye).lerp(new THREE.Vector3().fromArray(b.eye), t);
    const target = new THREE.Vector3().fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target), t);
    camera.fov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    // Preserve the reference perspective, then fit its full projected
    // silhouette into the reserved model column. No CSS crop/scale hacks.
    camera.aspect = 16 / 9;
    camera.zoom = 1;
    camera.clearViewOffset();
    camera.lookAt(target);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    if (disc) disc.rotation.y = discAngle(progress);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const point of boundsPoints) {
      const projected = point.clone().project(camera);
      minX = Math.min(minX, projected.x); maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y); maxY = Math.max(maxY, projected.y);
    }
    if (!referenceFraming && boundsPoints.length && width && height) {
      // A constant reference stage preserves the original shrink and camera
      // pacing. `Math.max`, not `Math.min` — the stage column's aspect ratio
      // varies a lot more than the reference box's does (a thin phone
      // viewport is much taller/narrower than 660x720), and `min` always
      // locked the scale to whichever dimension was more constrained. On a
      // narrow column that's the width, so the model shrank to fit it and
      // left the rest of the (much taller) column empty above and below.
      // `max` lets the model grow to fill the more generous dimension
      // instead; `fitScale` below — a real safety check against the
      // model's actual projected silhouette, not a fixed reference box —
      // still catches it before it overflows the column's edges.
      const referenceScale = Math.max(width / 660, height / 720);
      const fitScale = Math.min(width * 0.92 / ((maxX-minX)*640), height * 0.94 / ((maxY-minY)*360));
      const scale = Math.min(referenceScale, fitScale);
      camera.aspect = width / height;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * height / (720 * scale)));
      camera.updateProjectionMatrix();
      // Center the reference stage, not each changing bounding box. The
      // camera's deliberate descent and lateral move survive resizing.
      camera.projectionMatrix.elements[8] -= (640-615) * 2 * scale / width;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
    requestDraw();
  }

  const resize = () => {
    const box = host.getBoundingClientRect();
    width = box.width; height = box.height;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    pose();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const lost = (event: Event) => { event.preventDefault(); onFailure(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", requestDraw);

  // A mipmapped tile retains the perforation pattern without the moiré of
  // an unfiltered procedural grid at the small phone display size.
  const tile = document.createElement("canvas");
  tile.width = 64; tile.height = 128;
  const context = tile.getContext("2d")!;
  context.fillStyle = "#92908c";
  context.fillRect(0, 0, 64, 128);
  for (const [x,y] of [[32,32],[0,96],[64,96]]) {
    context.fillStyle = "#343332";
    context.beginPath();context.ellipse(x,y,26,23,0,0,Math.PI*2);context.fill();
    context.fillStyle = "#080808";
    context.beginPath();context.ellipse(x,y-2,22,17,0,0,Math.PI*2);context.fill();
  }
  const grilleMap = new THREE.CanvasTexture(tile);
  grilleMap.wrapS = grilleMap.wrapT = THREE.RepeatWrapping;
  grilleMap.colorSpace = THREE.SRGBColorSpace;
  grilleMap.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  textures.add(grilleMap);

  function finish(kind: string, maps: { disc: THREE.Texture; button: THREE.Texture }) {
    const props: THREE.MeshStandardMaterialParameters = { color: "#b9b4a9", roughness: 0.78, metalness: 0.08, side: THREE.DoubleSide };
    if (kind === "housing") Object.assign(props, { color: "#b00071", roughness: 0.58, metalness: 0.2 });
    if (kind === "metal") Object.assign(props, { color: "#cbc9c4", roughness: 0.3, metalness: 0.9 });
    if (kind === "sculpture") Object.assign(props, { color: "#c7c4bc", roughness: 0.38, metalness: 0.55 });
    if (kind === "dark") Object.assign(props, { color: "#171617", roughness: 0.9 });
    if (kind === "grille") Object.assign(props, { color: "#a6a29b", map: grilleMap, roughness: 0.52, metalness: 0.35 });
    if (kind === "speaker-top") Object.assign(props, { color: "#8b8582", roughness: 0.86 });
    if (kind === "button") Object.assign(props, { color: "#ffffff", map: maps.button, roughness: 0.48, metalness: 0.25 });
    if (kind === "disc") Object.assign(props, { color: "#ffffff", map: maps.disc, emissive: "#ffffff", emissiveMap: maps.disc, emissiveIntensity: 0.36, metalness: 0.2, roughness: 0.42 });
    if (kind === "rim") Object.assign(props, { color: "#ff21a3", emissive: "#ff159b", emissiveIntensity: 1.2, roughness: 0.36 });
    if (kind === "moon" || kind === "scrim") Object.assign(props, { color: "#940062", emissive: "#ae0078", emissiveIntensity: 0.16, roughness: 0.9 });
    const mat = new THREE.MeshStandardMaterial(props);
    // Object-space details stay attached to the CAD surfaces. fwidth keeps
    // perforations from shimmering when the camera pulls back on a phone.
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vRecordPosition;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRecordPosition = position;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vRecordPosition;
        float grain(vec3 p) { return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      `);
      let detail = "";
      if (["housing", "structure", "speaker-top", "deck", "metal"].includes(kind)) detail += `diffuseColor.rgb *= 0.975 + 0.05 * grain(floor(vRecordPosition * 35.0));`;
      if (kind === "deck") detail += `float ring = length(vRecordPosition.xz); diffuseColor.rgb *= mix(0.74,1.0,smoothstep(41.3,41.8,ring));`;
      if (kind === "scrim") detail += `
        vec2 uv = vec2((vRecordPosition.x+46.0)/92.0,(vRecordPosition.y-13.151635)/92.0);
        float inset = smoothstep(0.425,0.432,length(uv-vec2(0.59,0.58)));
        diffuseColor.rgb *= mix(0.53,1.13,inset);
        diffuseColor.rgb *= 0.96 + 0.08*grain(floor(vRecordPosition*50.0));
        diffuseColor.rgb *= 0.98 + 0.02*sin(vRecordPosition.x*19.0);
      `;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n" + detail);
      if (kind === "metal") shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor *= 0.9 + 0.2*grain(vec3(floor(vRecordPosition.y*160.0))); ");
    };
    mat.customProgramCacheKey = () => `record-player-${kind}`;
    materials.add(mat);
    return mat;
  }

  function releaseModel(node: THREE.Object3D) {
    node.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.geometry.dispose();
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) material.dispose();
    });
  }

  return {
    async load() {
      const textureLoader = new THREE.TextureLoader();
      const texture = async (name: string) => {
        const map = await textureLoader.loadAsync(ASSETS + name + ".webp");
        if (disposed) { map.dispose(); return map; }
        map.colorSpace = THREE.SRGBColorSpace;
        map.flipY = false;
        map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        textures.add(map);
        return map;
      };
      const results = await Promise.allSettled([loader.loadAsync(ASSETS + "record-player.glb"), texture("disc"), texture("button")]);
      const model = results[0];
      if (disposed || results.some((r) => r.status === "rejected")) {
        if (model.status === "fulfilled") releaseModel(model.value.scene);
        if (!disposed) throw new Error("Record-player assets could not load");
        return;
      }
      if (model.status !== "fulfilled" || results[1].status !== "fulfilled" || results[2].status !== "fulfilled") return;
      root = model.value.scene;
      const maps = { disc: results[1].value, button: results[2].value };
      const finishes = new Map<string, THREE.Material>();
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const old = Array.isArray(obj.material) ? obj.material : [obj.material];
        const kind = obj.name.startsWith("scultures_") || obj.name.startsWith("sunsetshapes_") ? "sculpture" : obj.name === "Speakers_30" ? "housing" : obj.name === "RECORDPLAYER_16" ? "structure" : obj.userData.finish || old[0].name;
        if (!finishes.has(kind)) finishes.set(kind, finish(kind, maps));
        obj.material = finishes.get(kind)!;
        if (kind === "grille") {
          const positions = obj.geometry.getAttribute("position");
          const uv = new Float32Array(positions.count * 2);
          for (let i=0; i<positions.count; i++) {
            uv[i*2] = (positions.getX(i)-positions.getZ(i))*0.75;
            uv[i*2+1] = positions.getY(i)*0.65;
          }
          obj.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        }
        obj.castShadow = !["scrim", "rim", "disc", "moon"].includes(kind);
        obj.receiveShadow = !["scrim", "rim", "disc", "moon"].includes(kind);
        old.forEach((mat) => mat.dispose());
      });
      disc = root.getObjectByName("CD_SPINS");
      if (!disc) throw new Error("Missing independently animated CD_SPINS node");
      scene.add(root);
      renderer.shadowMap.needsUpdate = true;
      root.updateMatrixWorld(true);
      // Actual vertices avoid the empty corners of the upright's bounding box.
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const vertices = obj.geometry.getAttribute("position");
        for (let i = 0; i < vertices.count; i += Math.max(1, Math.floor(vertices.count / 240))) {
          boundsPoints.push(new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(obj.matrixWorld));
        }
      });
      resize();
      // Produce the first frame before the still disappears, even if the
      // observer has not delivered its visibility callback yet.
      if (width && height) renderer.render(scene, camera);
    },
    seek(value) { progress = THREE.MathUtils.clamp(value, 0, 1); pose(); },
    setVisible(value) { visible = value; if (value) requestDraw(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener("visibilitychange", requestDraw);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      if (root) releaseModel(root);
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      environment.dispose();
      light.shadow.map?.dispose();
      decoder.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
