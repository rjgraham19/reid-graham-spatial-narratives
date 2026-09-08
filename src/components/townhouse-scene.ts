import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface TownhouseControls {
  load(): Promise<void>;
  view(name: 'Front right' | 'Front left' | 'Rear right' | 'Rear left'): void;
  dispose(): void;
}
export function createTownhouseScene(host: HTMLDivElement): TownhouseControls {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Rotatable Townhouse model. Drag to orbit, scroll to zoom, or use view buttons.');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050507');
  const draco=new DRACOLoader();draco.setDecoderPath('/draco/');draco.setWorkerLimit(2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); const environment = pmrem.fromScene(room); room.dispose();
  scene.environment = environment.texture; scene.environmentIntensity = .5;
  scene.add(new THREE.HemisphereLight(0xc6b7ff, 0x786398, 1.15));
  const sun = new THREE.DirectionalLight(0xfffaf5, 2.3); sun.position.set(12,24,18);scene.add(sun);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,far:100});sun.shadow.normalBias=.025;
  const fill=new THREE.DirectionalLight(0x9e84ef,.8);fill.position.set(-18,10,-12);scene.add(fill);
  const camera = new THREE.OrthographicCamera(-20,20,20,-20,.1,500);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = false;orbit.maxPolarAngle = Math.PI*.49;orbit.minZoom=.45;orbit.maxZoom=5;
  orbit.listenToKeyEvents(renderer.domElement);
  let model: THREE.Group | undefined; let disposed=false; let span=18; let aspect=1; const homeTarget=new THREE.Vector3();
  const render = () => {if (!disposed) renderer.render(scene,camera);};
  orbit.addEventListener('change',render);
  const resize = () => {const {width,height}=host.getBoundingClientRect();if (!width || !height)return; renderer.setSize(width,height);aspect=width/height;camera.left=-span*.8*Math.max(aspect,1);camera.right=-camera.left;camera.top=span*.8/Math.min(aspect,1);camera.bottom=-camera.top;camera.updateProjectionMatrix();render();};
  const observer = new ResizeObserver(resize);observer.observe(host);
  // Small tiled ripple normals keep the water reflective without an animation loop.
  const ripplePixels=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const nx=.24*Math.cos(x/128*Math.PI*8+y/128*Math.PI*4)+.1*Math.cos(x/128*Math.PI*14-y/128*Math.PI*6);
    const ny=.16*Math.cos(y/128*Math.PI*10+x/128*Math.PI*4);
    const n=new THREE.Vector3(nx,ny,1).normalize();const i=(y*128+x)*4;
    ripplePixels[i]=(n.x*.5+.5)*255;ripplePixels[i+1]=(n.y*.5+.5)*255;ripplePixels[i+2]=(n.z*.5+.5)*255;ripplePixels[i+3]=255;
  }
  const ripple=new THREE.DataTexture(ripplePixels,128,128);ripple.wrapS=ripple.wrapT=THREE.RepeatWrapping;ripple.magFilter=THREE.LinearFilter;ripple.minFilter=THREE.LinearMipmapLinearFilter;ripple.generateMipmaps=true;ripple.needsUpdate=true;
  const disposeModel = (root: THREE.Object3D) => root.traverse(obj => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {obj.geometry.dispose();for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){for(const value of Object.values(m)){if(value instanceof THREE.Texture)value.dispose();}m.dispose();}}
  });
  const view = (name:'Front right'|'Front left'|'Rear right'|'Rear left') => {
    orbit.target.copy(homeTarget);
    const directions = {'Front right':[1,1,1], 'Front left':[-1,1,1], 'Rear right':[1,1,-1], 'Rear left':[-1,1,-1]};
    camera.position.copy(orbit.target).add(new THREE.Vector3(...directions[name]).normalize().multiplyScalar(60));
    camera.zoom=1;camera.updateProjectionMatrix();orbit.update();render();
  };
  resize();
  return {
    async load() {
      const gltf=await new GLTFLoader().setDRACOLoader(draco).loadAsync('/models/townhouse.glb');
      if(disposed){disposeModel(gltf.scene);return;}
      model=gltf.scene;scene.add(model);
      const bounds=new THREE.Box3();
      model.traverse(obj=>{
        if(!(obj instanceof THREE.Mesh))return;
        obj.material=Array.isArray(obj.material)?obj.material.map(material=>material.clone()):obj.material.clone();
        if(obj.userData.baked_studio_lighting){
          const baked=(material: THREE.Material) => {
            if(!(material instanceof THREE.MeshStandardMaterial))return material;
            const unlit=new THREE.MeshBasicMaterial({map:material.emissiveMap,color:material.emissive,side:material.side});
            material.dispose();return unlit;
          };
          obj.material=Array.isArray(obj.material)?obj.material.map(baked):baked(obj.material);
        }
        const layer=obj.userData.source_layer;
        const context=['Ground','Default'].includes(layer);
        if(layer==='glassblockclean'){
          const joints=new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry,25),new THREE.LineBasicMaterial({color:0x417b7b,transparent:true,opacity:.38,depthWrite:false}));
          joints.name='Glass block joints';obj.add(joints);
        }
        if(layer==='WATER'){
          const position=obj.geometry.attributes.position;const uv=new Float32Array(position.count*2);
          for(let i=0;i<position.count;i++){uv[i*2]=position.getX(i)*.7;uv[i*2+1]=position.getZ(i)*.7;}
          obj.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        }
        obj.castShadow=!context && layer!=='Railing glass';obj.receiveShadow=!context;
        if(!context)bounds.union(new THREE.Box3().setFromObject(obj));
        for(const material of Array.isArray(obj.material)?obj.material:[obj.material]) {
          if(!(material instanceof THREE.MeshStandardMaterial))continue;
          if(context){material.color.set('#c9cbd3');material.transparent=true;material.opacity=.2;material.depthWrite=false;material.roughness=1;material.metalness=0;obj.renderOrder=1;}
          else if(layer==='glassmetalframe'){material.color.set('#9893ac');material.metalness=.25;material.roughness=.42;}
          else if(layer==='glassblockclean'){material.color.set('#54aaa9');material.roughness=.16;material.envMapIntensity=1.2;if(material instanceof THREE.MeshPhysicalMaterial){material.transmission=.5;material.thickness=.12;material.ior=1.48;material.clearcoat=.6;material.clearcoatRoughness=.12;}}
          else if(layer==='Railing glass'){material.color.set('#b4bedf');material.transparent=true;material.opacity=.3;material.depthWrite=false;material.side=THREE.DoubleSide;material.roughness=.18;material.metalness=.1;if(material instanceof THREE.MeshPhysicalMaterial)material.transmission=0;}
          else if(layer==='WATER'){material.color.set('#369baf');material.roughness=.075;material.metalness=0;material.normalMap=ripple;material.normalScale.set(.25,.25);material.envMapIntensity=1.5;if(material instanceof THREE.MeshPhysicalMaterial){material.transmission=.5;material.thickness=.55;material.ior=1.333;material.clearcoat=1;material.clearcoatRoughness=.05;}}
          else if(['cleanfurniture','Furntiture'].includes(layer)){material.color.set('#c2c3c7');material.roughness=.65;material.metalness=0;}
          else if(!obj.userData.baked_studio_lighting){material.color.set('#e2dfe8');material.roughness=.78;material.metalness=0;}
        }
      });
      const size=bounds.getSize(new THREE.Vector3());span=Math.max(size.x,size.y,size.z);bounds.getCenter(homeTarget);resize();view('Front right');
    }, view,
    dispose() {disposed=true;observer.disconnect();orbit.dispose();if(model)disposeModel(model);draco.dispose();ripple.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
