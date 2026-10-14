import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
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
  const light = new THREE.DirectionalLight(0xfffaf5, 1.8);
  light.position.set(-110, 190, 140);
  light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -115, right: 115, top: 135, bottom: -100, near: 1, far: 450 });
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0006;
  light.shadow.normalBias = 0.35;
  scene.add(light, new THREE.HemisphereLight(0xf6f5ff, 0x292027, 0.35));
  const fill = new THREE.DirectionalLight(0xe2e5ff, 0.65);
  fill.position.set(100, 90, -40);
  scene.add(fill);
  RectAreaLightUniformsLib.init();
  const softbox = new THREE.RectAreaLight(0xffffff, 0.5, 140, 100);
  softbox.position.set(-25, -25, 170);
  softbox.lookAt(0, 25, 0);
  scene.add(softbox);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.025);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.42;
  let studioEnvironment: THREE.WebGLRenderTarget | undefined;
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
      // Every moment of the scrub is framed on the model's own projected
      // silhouette: scaled to fill the stage (with a small margin) and
      // centred in it. The recorded camera path still drives the angle,
      // the orbit and the disc — but its pull-back no longer shrinks the
      // model or lets it drift low. Framing the reference 1280×720 stage
      // instead (the original approach) reproduced that pull-back exactly,
      // which by the end of the scrub left the model in the middle third
      // of a full-height pinned panel: a tall black band above it and
      // another below, reading as big gaps before and after the section.
      //
      // The silhouette was projected above at the reference 16:9 aspect
      // (NDC × 640 / × 360 = reference px). `scale` maps reference px to
      // screen px; the fov change applies it, and the projection offset
      // places the silhouette (see below).
      const scale = Math.min(width * 0.94 / ((maxX-minX)*640), height * 0.94 / ((maxY-minY)*360));
      const centerX = (minX + maxX) / 2;
      camera.aspect = width / height;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * height / (720 * scale)));
      camera.updateProjectionMatrix();
      // ndc = P·x / −z − P[8] (x) / − P[9] (y): subtracting shifts right/up.
      // Centred across; vertically it rests on the stage's floor (3%
      // margin) rather than being centred, so when a wide pose runs out of
      // width before height, the spare space sits above the model — under
      // the nav, while it's pinned — not below it, where it would read as
      // a gap before the next section.
      camera.projectionMatrix.elements[8] -= -centerX * 1280 * scale / width;
      camera.projectionMatrix.elements[9] -= -0.97 - minY * 720 * scale / height;
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
  context.fillStyle = "#a2a6aa";
  context.fillRect(0, 0, 64, 128);
  for (const [x,y] of [[32,32],[0,96],[64,96]]) {
    context.fillStyle = "#686766";
    context.beginPath();context.ellipse(x,y,26,23,0,0,Math.PI*2);context.fill();
    context.fillStyle = "#080808";
    context.beginPath();context.ellipse(x,y-2,22,17,0,0,Math.PI*2);context.fill();
  }
  const grilleMap = new THREE.CanvasTexture(tile);
  grilleMap.wrapS = grilleMap.wrapT = THREE.RepeatWrapping;
  grilleMap.colorSpace = THREE.SRGBColorSpace;
  grilleMap.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  textures.add(grilleMap);
  const grilleRelief = grilleMap.clone();
  grilleRelief.colorSpace = THREE.NoColorSpace;
  textures.add(grilleRelief);

  // Tangent-space brushing: fine parallel grooves, not low-frequency color noise.
  // Data maps remain linear; mipmaps average grooves as the player gets smaller.
  const brushSize = 256;
  const brushNormals = new Uint8Array(brushSize * brushSize * 4);
  const brushRoughness = new Uint8Array(brushSize * brushSize * 4);
  for (let y = 0; y < brushSize; y++) {
    const phase = y / brushSize * Math.PI * 2;
    const slope = 0.32 * Math.sin(phase * 37) + 0.14 * Math.sin(phase * 61);
    const n = new THREE.Vector3(0, slope, 1).normalize();
    const rough = Math.round(238 + 12 * Math.sin(phase * 37));
    for (let x = 0; x < brushSize; x++) {
      const i = (y * brushSize + x) * 4;
      brushNormals.set([128, Math.round((n.y * 0.5 + 0.5) * 255), Math.round((n.z * 0.5 + 0.5) * 255), 255], i);
      brushRoughness.set([rough, rough, rough, 255], i);
    }
  }
  const brushMap = (data: Uint8Array) => {
    const map = new THREE.DataTexture(data, brushSize, brushSize);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    textures.add(map);
    return map;
  };
  const brushedNormal = brushMap(brushNormals);
  const brushedRoughness = brushMap(brushRoughness);

  function finish(kind: string, maps: { disc: THREE.Texture; button: THREE.Texture }) {
    const props: THREE.MeshPhysicalMaterialParameters = { color: "#c5c6c8", roughness: 0.52, metalness: 0.08, side: THREE.DoubleSide };
    // Neutral concrete stays below white under the key light; no metallic reflection.
    // Both deck sheets and the lower platform share this finish and grain scale.
    if (["deck", "concrete"].includes(kind)) Object.assign(props, { color: "#a9a7a3", roughness: 0.9, metalness: 0 });
    if (kind === "structure") Object.assign(props, { color: "#bfc1c4", roughness: 0.48, metalness: 0.85 });
    if (kind === "housing") Object.assign(props, { color: "#e00091", roughness: 0.3, metalness: 0.92 });
    if (kind === "metal") Object.assign(props, { color: "#d0d2d5", roughness: 0.16, metalness: 1 });
    if (kind === "brushed") Object.assign(props, { color: "#d0d2d5", roughness: 0.3, metalness: 1, anisotropy: 0.55, anisotropyRotation: Math.PI / 2, normalMap: brushedNormal, normalScale: new THREE.Vector2(0.12, 0.12), roughnessMap: brushedRoughness });
    if (kind === "sculpture") Object.assign(props, { color: "#c7c4bc", roughness: 0.18, metalness: 0.95 });
    if (kind === "dark") Object.assign(props, { color: "#171617", roughness: 0.9 });
    if (kind === "grille") Object.assign(props, { color: "#d0d2d5", map: grilleMap, bumpMap: grilleRelief, bumpScale: 0.035, roughness: 0.28, metalness: 1 });
    if (kind === "speaker-top") Object.assign(props, { color: "#777571", roughness: 0.8, metalness: 0.35 });
    if (kind === "button") Object.assign(props, { color: "#ffffff", map: maps.button, roughness: 0.48, metalness: 0.25 });
    if (kind === "disc") Object.assign(props, { color: "#ffffff", map: maps.disc, emissive: "#ffffff", emissiveMap: maps.disc, emissiveIntensity: 0.3, metalness: 0, roughness: 0.52, specularIntensity: 0.18 });
    if (kind === "rim") Object.assign(props, { color: "#ff21a3", emissive: "#ff159b", emissiveIntensity: 1.2, roughness: 0.36 });
    if (kind === "moon") Object.assign(props, { color: "#ed009b", emissive: "#e60091", emissiveIntensity: 0.24, roughness: 0.54, metalness: 0.1, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.FrontSide });
    // The exported assembly has two scrim sheets enclosing a real crescent.
    // Uniform, filled-in tinted sheets; the real crescent remains visible behind.
    if (kind === "scrim") Object.assign(props, { color: "#a51478", emissive: "#b00078", emissiveIntensity: 0.08, roughness: 0.86, metalness: 0, transparent: true, opacity: 0.58, depthWrite: false });
    const mat = ["brushed", "disc"].includes(kind) ? new THREE.MeshPhysicalMaterial(props) : new THREE.MeshStandardMaterial(props);
    // Studio HDR drives reflective surfaces. Keep approved matte caps and artwork
    // on their previous environment so changing the studio cannot wash them out.
    const studioFinish = ["housing", "structure", "metal", "brushed", "sculpture", "grille"].includes(kind);
    mat.envMap = studioFinish ? studioEnvironment!.texture : environment.texture;
    mat.envMapIntensity = studioFinish ? (kind === "housing" ? 0.5 : kind === "structure" ? 0.35 : kind === "sculpture" ? 0.5 : 1.15) : kind === "disc" ? 0.12 : ["speaker-top", "deck", "concrete"].includes(kind) ? 0.3 : 0.42;
    if (studioFinish) mat.envMapRotation.y = -Math.PI * 0.1;
    // Present a broad studio reflection to the control face instead of its
    // black sector. Other metals retain their approved reflection orientation.
    if (kind === "housing") mat.envMapRotation.y = Math.PI * 0.65;
    if (kind === "grille") { mat.envMapIntensity = 1.0; mat.envMapRotation.y = Math.PI * 1.2; }
    // Subpixel grain fades to its average instead of sparkling on small screens.
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.capColor = { value: new THREE.Color("#777571") };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vRecordPosition;\nvarying vec3 vRecordNormal;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRecordPosition = position;\nvRecordNormal = normal;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vRecordPosition;
        varying vec3 vRecordNormal;
        uniform vec3 capColor;
        float grain(vec3 p) { return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
        float filteredGrain(vec3 p) {
          float footprint = max(max(fwidth(p.x), fwidth(p.y)), fwidth(p.z));
          return mix(grain(floor(p)), 0.5, smoothstep(0.4, 1.5, footprint));
        }
        float surfaceNoise(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(mix(grain(i),grain(i+vec3(1,0,0)),f.x),mix(grain(i+vec3(0,1,0)),grain(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(grain(i+vec3(0,0,1)),grain(i+vec3(1,0,1)),f.x),mix(grain(i+vec3(0,1,1)),grain(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
      `);
      let detail = "";
      if (["deck", "concrete"].includes(kind)) detail += `diffuseColor.rgb *= 0.98 + 0.04 * filteredGrain(vRecordPosition * 3.0);`;
      if (kind === "speaker-top") detail += `diffuseColor.rgb *= 0.97 + 0.06 * filteredGrain(vRecordPosition * 8.0);
        diffuseColor.rgb *= 0.92 + 0.16 * filteredGrain(vRecordPosition * 3.0);`;
      if (kind === "speaker-top") detail += `
        diffuseColor.rgb *= 0.9 + 0.2 * filteredGrain(vRecordPosition * 2.2);
        float capEdge = 1.0-smoothstep(0.2,0.7,abs(normalize(vRecordNormal).y));
        diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.62),capEdge);`;
      // SCRIM_33 and its underlying RECORDPLAYER_40 sheet form the deck.
      // The CAD aperture is ~38.25 inches from the platter centre. Only the
      // inner annulus matches the aluminum caps; the outer band stays concrete.
      if (kind === "deck") detail += `
        float capMask = (1.0-smoothstep(38.15,38.35,length(vRecordPosition.xz))) * smoothstep(0.7,0.95,abs(normalize(vRecordNormal).y));
        vec3 ringColor = capColor * (0.97 + 0.06 * filteredGrain(vRecordPosition * 8.0))
          * (0.92 + 0.16 * filteredGrain(vRecordPosition * 3.0))
          * (0.9 + 0.2 * filteredGrain(vRecordPosition * 2.2));
        diffuseColor.rgb = mix(diffuseColor.rgb,ringColor,capMask);`;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n" + detail);
      if (kind === "speaker-top") shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor *= 0.9 + 0.2 * filteredGrain(vRecordPosition * vec3(2.0, 65.0, 2.0));`);
      if (kind === "deck") {
        shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor,0.8*(0.9+0.2*filteredGrain(vRecordPosition*vec3(2.0,65.0,2.0))),capMask);`)
          .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor,0.35,capMask);");
      }
      // Fine surface relief changes the response to light, not just the paint.
      // Derivative filtering removes subpixel detail at distant scroll poses.
      if (["deck", "concrete", "speaker-top"].includes(kind)) shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec3 grainP = vRecordPosition * 2.0;
        float fade = 1.0-smoothstep(0.5,2.0,max(max(fwidth(grainP.x),fwidth(grainP.y)),fwidth(grainP.z)));
        float relief = surfaceNoise(grainP) * fade * ${kind === "deck" ? "mix(0.012,0.025,capMask)" : kind === "concrete" ? "0.012" : "0.025"};
        vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
        vec3 rx = cross(sy,normal), ry = cross(normal,sx);
        float det = dot(sx,rx);
        normal = normalize(abs(det)*normal - sign(det)*(dFdx(relief)*rx+dFdy(relief)*ry));`);
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
      const loadStudio = async () => {
        const hdr = await new HDRLoader().loadAsync(ASSETS + "studio_small_03_2k.hdr");
        if (disposed) { hdr.dispose(); return; }
        const generator = new THREE.PMREMGenerator(renderer);
        try { studioEnvironment = generator.fromEquirectangular(hdr); }
        finally { hdr.dispose(); generator.dispose(); }
      };
      const results = await Promise.allSettled([loader.loadAsync(ASSETS + "record-player.glb"), texture("disc"), texture("button"), loadStudio()]);
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
        const kind = obj.name.startsWith("scultures_") || obj.name.startsWith("sunsetshapes_") ? "sculpture" : obj.name === "Speakers_30" ? "housing" : ["RECORDPLAYER_16", "RECORDPLAYER_36", "RECORDPLAYER_37", "TVWALLS_38", "TVWALLS_39"].includes(obj.name) ? "concrete" : obj.name === "RECORDPLAYER_40" ? "deck" : obj.name === "RECORDPLAYER_46" ? "brushed" : obj.userData.finish || old[0].name;
        if (!finishes.has(kind)) finishes.set(kind, finish(kind, maps));
        obj.material = finishes.get(kind)!;
        if (kind === "brushed") {
          // Cylindrical UVs anchor brushing to the existing platter sidewall.
          // Only texture coordinates change; vertices, pivot and motion do not.
          const positions = obj.geometry.getAttribute("position");
          const uv = new Float32Array(positions.count * 2);
          for (let i = 0; i < positions.count; i++) {
            uv[i * 2] = Math.atan2(positions.getZ(i), positions.getX(i)) / (2 * Math.PI) + 0.5;
            uv[i * 2 + 1] = positions.getY(i) / 6;
          }
          obj.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        }
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
      studioEnvironment?.dispose();
      light.shadow.map?.dispose();
      decoder.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
