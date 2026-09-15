import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
export type ExchangeView = "overall" | "nibi" | "wavescape" | "steam";
export function createExchangeScene(host: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor("#000000");
  host.appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Exchange Facility model. Drag to rotate, scroll to zoom.",
  );
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = false;
  orbit.listenToKeyEvents(renderer.domElement);
  orbit.minZoom = 0.4;
  orbit.maxZoom = 6;
  // Scroll must keep scrolling the page, not zoom the model — with
  // enableZoom off, OrbitControls' wheel handler returns before calling
  // preventDefault, so the wheel event passes straight through to the page.
  orbit.enableZoom = false;
  // Touch needs the equivalent treatment for the equivalent reason. Three.js
  // sets touch-action:none on the canvas the moment OrbitControls connects
  // (so it can capture a one-finger drag as orbit), which blocks the
  // browser's native touch-scroll over the whole element regardless of what
  // touches.ONE is mapped to. On a phone this canvas runs nearly full-screen
  // (see the `85vh` stage height), so that made a one-finger swipe anywhere
  // over the model orbit the camera instead of scrolling the page — with no
  // way to keep scrolling without lifting off and retrying outside its
  // bounds. Disabling one-finger rotate and handing touch-action back to the
  // browser makes an ordinary swipe scroll the page again, like it does
  // everywhere else on the site; two-finger drag still dollies/pans.
  if (window.matchMedia("(pointer: coarse)").matches) {
    orbit.touches.ONE = null;
    renderer.domElement.style.touchAction = "pan-y";
  }
  const decoder = new DRACOLoader().setDecoderPath("/draco/");
  decoder.setWorkerLimit(2);
  const meshes: {
    mesh: THREE.Mesh;
    base: THREE.Vector3;
    zone: string;
    opacity: number;
    edgeOpacity: number;
    edge: THREE.LineSegments;
  }[] = [];
  const boxes: Record<string, THREE.Box3> = {};
  let root: THREE.Group | undefined,
    disposed = false,
    frame = 0,
    span = 25,
    current: ExchangeView = "overall";
  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  // A render-on-demand canvas (redrawing only in response to a select() or
  // a drag) turns out to go blank between those events in this embed —
  // the on-demand model that TownhouseViewer/LollaViewer both use is fine
  // for a canvas the browser keeps actively compositing, but this one loads
  // and frames itself before ever entering the viewport, and nothing then
  // forces a second paint until the visitor interacts. renderer.setAnimationLoop
  // (rather than a bare requestAnimationFrame loop) is three.js's own
  // continuous-rendering driver — it keeps the canvas continuously fresh
  // the same way any live three.js viewer would.
  const renderLoop = () => {
    renderer.setAnimationLoop(disposed ? null : render);
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
    const isolated = view !== "overall";
    const box = boxes[isolated ? view : "overall"];
    if (!box || box.isEmpty()) return;
    const offset = isolated ? new THREE.Vector3(10, 0, 0) : new THREE.Vector3();
    const target = box.getCenter(new THREE.Vector3()).add(offset);
    const size = box.getSize(new THREE.Vector3());
    const nextSpan = Math.max(size.x, size.y, size.z) * (isolated ? 0.68 : 0.62);
    const direction =
      view === "nibi"
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
      opacity: (item.mesh.material as THREE.MeshBasicMaterial).opacity,
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
        const opacity = selected ? item.opacity : 0.006;
        (item.mesh.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
          states[i].opacity,
          opacity,
          e,
        );
        (item.edge.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
          states[i].edgeOpacity,
          selected ? item.edgeOpacity : 0.035,
          e,
        );
        item.mesh.visible = true;
      });
      orbit.update();
      resize();
      if (t < 1) frame = requestAnimationFrame(tick);
      else orbit.enabled = true;
    };
    tick();
  }
  function zoomBy(factor: number) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, orbit.minZoom, orbit.maxZoom);
    camera.updateProjectionMatrix();
    render();
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
          ? "#e4e8f0"
          : seating
            ? "#f1f4fc"
            : zone === "ground"
              ? "#7788aa"
              : "#84a8ed";
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          mat.dispose();
        const opacity = zone === "ground" ? 0.018 : shell ? 0.1 : seating ? 0.32 : 0.24;
        const edgeOpacity = zone === "ground" ? 0.12 : existing ? 0.32 : shell ? 0.42 : 0.72;
        mesh.material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        // Grazing surfaces glow like a radiograph; face-on surfaces remain ghosted.
        // The camera is orthographic, so its view direction is constant in view space.
        mesh.material.onBeforeCompile = (shader) => {
          shader.vertexShader = `varying vec3 vExchangeNormal;\n${shader.vertexShader}`.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvExchangeNormal = normalize(normalMatrix * normal);",
          );
          shader.fragmentShader = `varying vec3 vExchangeNormal;\n${shader.fragmentShader}`.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
            float rim = pow(1.0 - abs(normalize(vExchangeNormal).z), 2.2);
            diffuseColor.a *= 0.16 + 0.84 * rim;`,
          );
        };
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 35),
          new THREE.LineBasicMaterial({
            color: existing
              ? "#edf0f7"
              : seating
                ? "#ffffff"
                : zone === "ground"
                  ? "#7788aa"
                  : color,
            transparent: true,
            opacity: edgeOpacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        mesh.add(edge);
        const box = new THREE.Box3().setFromObject(mesh);
        (boxes[zone] ||= new THREE.Box3()).union(box);
        if (["nibi", "wavescape", "steam"].includes(zone)) boxes.overall.union(box);
        meshes.push({ mesh, base: mesh.position.clone(), zone, opacity, edgeOpacity, edge });
      }
      // Every mesh gets its own MeshBasicMaterial instance (each with its
      // own onBeforeCompile closure), so the very first render() has to
      // lazily compile well over a hundred separate GL programs — with no
      // click to gate on, that first render can otherwise land mid-compile
      // and paint nothing. renderer.compile() forces all of that ahead of
      // time, before the facility is ever asked to actually draw.
      renderer.compile(scene, camera);
      select("overall", true);
      renderLoop();
    },
    select,
    zoomIn() {
      zoomBy(1.35);
    },
    zoomOut() {
      zoomBy(1 / 1.35);
    },
    resetView() {
      camera.zoom = 1;
      select(current, true);
    },
    get current() {
      return current;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer.setAnimationLoop(null);
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
