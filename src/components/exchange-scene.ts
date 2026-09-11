import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
export type ExchangeView = "overall" | "section" | "nibi" | "wavescape" | "steam";
export function createExchangeScene(host: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor("#101526");
  host.appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Exchange Facility model. Drag to rotate, scroll to zoom.",
  );
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe7efff, 0x7779a6, 2));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(20, 40, 25);
  scene.add(key);
  const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = false;
  orbit.listenToKeyEvents(renderer.domElement);
  orbit.minZoom = 0.4;
  orbit.maxZoom = 6;
  const decoder = new DRACOLoader().setDecoderPath("/draco/");
  decoder.setWorkerLimit(2);
  const meshes: {
    mesh: THREE.Mesh;
    base: THREE.Vector3;
    zone: string;
    opacity: number;
    seating: boolean;
    edge: THREE.LineSegments;
  }[] = [];
  const boxes: Record<string, THREE.Box3> = {};
  let root: THREE.Group | undefined,
    disposed = false,
    frame = 0,
    span = 25,
    current: ExchangeView = "overall";
  let groundVisible = true;
  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    if (
      renderer.domElement.clientWidth !== Math.round(width) ||
      renderer.domElement.clientHeight !== Math.round(height)
    )
      renderer.setSize(width, height);
    const a = width / height;
    camera.left = -span * Math.max(a, 1);
    camera.right = -camera.left;
    camera.top = span / Math.min(a, 1);
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  orbit.addEventListener("change", render);

  function select(view: ExchangeView, immediate = false) {
    current = view;
    cancelAnimationFrame(frame);
    const isolated = view !== "overall" && view !== "section";
    const box = boxes[isolated ? view : "overall"];
    if (!box || box.isEmpty()) return;
    const offset = isolated ? new THREE.Vector3(10, 0, 0) : new THREE.Vector3();
    const target = box.getCenter(new THREE.Vector3()).add(offset);
    const size = box.getSize(new THREE.Vector3());
    const nextSpan = Math.max(size.x, size.y, size.z) * (isolated ? 0.68 : 0.62);
    const direction =
      view === "section"
        ? new THREE.Vector3(1, 0, 0)
        : view === "nibi"
          ? new THREE.Vector3(1, 0.65, 0.45)
          : view === "wavescape"
            ? new THREE.Vector3(1, 0.3, 0.35)
            : view === "steam"
              ? new THREE.Vector3(1, 0.2, 0.55)
              : new THREE.Vector3(1, 0.45, 0.65);
    const nextCamera = target.clone().add(direction.normalize().multiplyScalar(85));
    const startCam = camera.position.clone(),
      startTarget = orbit.target.clone(),
      startSpan = span;
    orbit.enabled = false;
    const states = meshes.map((item) => ({
      position: item.mesh.position.clone(),
      opacity: (item.mesh.material as THREE.MeshStandardMaterial).opacity,
      edgeOpacity: (item.edge.material as THREE.LineBasicMaterial).opacity,
      end: item.base.clone().add(item.zone === view ? offset : new THREE.Vector3()),
    }));
    const start = performance.now();
    const duration = immediate || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000;
    camera.zoom = 1;
    const tick = () => {
      if (disposed) return;
      const t = duration ? Math.min((performance.now() - start) / duration, 1) : 1;
      const e = t * t * (3 - 2 * t);
      camera.position.lerpVectors(startCam, nextCamera, e);
      orbit.target.lerpVectors(startTarget, target, e);
      span = THREE.MathUtils.lerp(startSpan, nextSpan, e);
      meshes.forEach((item, i) => {
        item.mesh.position.lerpVectors(states[i].position, states[i].end, e);
        const selected = !isolated || item.zone === view;
        const opacity = selected ? item.opacity : 0.025;
        (item.mesh.material as THREE.MeshStandardMaterial).opacity = THREE.MathUtils.lerp(
          states[i].opacity,
          opacity,
          e,
        );
        (item.edge.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
          states[i].edgeOpacity,
          selected ? 0.3 : 0.025,
          e,
        );
        // Opaque seating writes depth; the ghosted vessel cannot erase its silhouette.
        const material = item.mesh.material as THREE.Material;
        const opaque = item.seating && selected && t === 1;
        if (material.transparent === opaque) {
          material.transparent = !opaque;
          material.needsUpdate = true;
        }
        material.depthWrite = opaque;
        item.mesh.visible = item.zone !== "ground" || groundVisible;
      });
      orbit.update();
      resize();
      if (t < 1) frame = requestAnimationFrame(tick);
      else orbit.enabled = true;
    };
    tick();
  }
  return {
    async load() {
      const gltf = await new GLTFLoader().setDRACOLoader(decoder).loadAsync("/models/exchange.glb");
      root = gltf.scene;
      if (disposed) {
        disposeRoot();
        return;
      }
      scene.add(root);
      root.updateMatrixWorld(true);
      boxes.overall = new THREE.Box3();
      const pending: THREE.Mesh[] = [];
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) pending.push(o);
      });
      for (const mesh of pending) {
        const zone = mesh.userData.zone || "infrastructure";
        const shell = mesh.userData.shell;
        const existing = mesh.userData.visual_role === "existing";
        const seating = mesh.userData.visual_role === "seating";
        const color = existing
          ? "#c6c8ce"
          : seating
            ? "#c5b8e8"
            : zone === "ground"
              ? "#7b959d"
              : zone === "infrastructure"
                ? "#99d6dd"
                : zone === "nibi"
                  ? "#7188ff"
                  : zone === "wavescape"
                    ? "#a78aff"
                    : "#df8ddd";
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          mat.dispose();
        const opacity = seating ? 1 : zone === "ground" ? 0.1 : shell ? 0.16 : 0.76;
        mesh.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.8,
          metalness: 0,
          transparent: true,
          opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        // Existing sewage fabric stays neutral regardless of the colored scene lights.
        if (existing) {
          mesh.material.dispose();
          mesh.material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
        }
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 35),
          new THREE.LineBasicMaterial({
            color: existing
              ? "#e1e3e7"
              : seating
                ? "#e6ddff"
                : zone === "ground"
                  ? "#6c8595"
                  : "#c3dcff",
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
          }),
        );
        mesh.add(edge);
        const box = new THREE.Box3().setFromObject(mesh);
        (boxes[zone] ||= new THREE.Box3()).union(box);
        if (["nibi", "wavescape", "steam"].includes(zone)) boxes.overall.union(box);
        meshes.push({ mesh, base: mesh.position.clone(), zone, opacity, seating, edge });
      }
      select("overall", true);
    },
    select,
    ground(show: boolean) {
      groundVisible = show;
      meshes.forEach((i) => {
        if (i.zone === "ground") i.mesh.visible = show;
      });
      render();
    },
    get current() {
      return current;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      orbit.dispose();
      decoder.dispose();
      disposeRoot();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  function disposeRoot() {
    root?.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      }
    });
  }
}
