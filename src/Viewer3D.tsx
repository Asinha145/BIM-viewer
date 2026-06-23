import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
  meshes: Record<string, string>;  // id → data URI
  selectedId: string;
  onMeshCountChange?: (n: number) => void;
}

const MAT_DEFAULT  = new THREE.MeshPhongMaterial({ color: 0x4a90d9, shininess: 60, side: THREE.DoubleSide });
const MAT_SELECTED = new THREE.MeshPhongMaterial({ color: 0xff6b35, shininess: 80, emissive: 0x441100, side: THREE.DoubleSide });
const MAT_DIMMED   = new THREE.MeshPhongMaterial({ color: 0x2a4a6a, shininess: 20, transparent: true, opacity: 0.4, side: THREE.DoubleSide });

type CameraPreset = 'persp' | 'top' | 'front' | 'back' | 'left' | 'right' | 'bottom';

export function Viewer3D({ meshes, selectedId, onMeshCountChange }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const stateRef  = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    perspCam: THREE.PerspectiveCamera;
    orthoCam: THREE.OrthographicCamera;
    controls: OrbitControls;
    group: THREE.Group;
    animId: number;
    center: THREE.Vector3;
    radius: number;
    isOrtho: boolean;
  } | null>(null);

  const [activePreset, setActivePreset] = useState<CameraPreset>('persp');
  const [isOrtho, setIsOrtho] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount]   = useState(0);

  // Init Three.js scene once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x1a1a2e, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xaaccff, 0.4);
    dir2.position.set(-5, -5, -5);
    scene.add(dir2);

    const group = new THREE.Group();
    scene.add(group);

    const perspCam = new THREE.PerspectiveCamera(45, W / H, 0.001, 1e6);
    perspCam.position.set(0, 5, 20);

    const orthoCam = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.001, 1e6);
    orthoCam.position.set(0, 5, 20);

    const controls = new OrbitControls(perspCam, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      const cam = stateRef.current?.isOrtho ? orthoCam : perspCam;
      renderer.render(scene, cam);
    };
    animate();

    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      perspCam.aspect = W2 / H2;
      perspCam.updateProjectionMatrix();
      const s = stateRef.current?.radius ?? 10;
      orthoCam.left   = -W2 / H2 * s;
      orthoCam.right  =  W2 / H2 * s;
      orthoCam.top    =  s;
      orthoCam.bottom = -s;
      orthoCam.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    stateRef.current = { renderer, scene, perspCam, orthoCam, controls, group, animId, center: new THREE.Vector3(), radius: 10, isOrtho: false };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []);

  // Fit camera to current group bounding box
  const fitCamera = useCallback((preset: CameraPreset = 'persp') => {
    const ctx = stateRef.current;
    if (!ctx) return;

    const box = new THREE.Box3().setFromObject(ctx.group);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.75;

    ctx.center.copy(center);
    ctx.radius = radius;

    const dist = radius * 2.2;
    const dirs: Record<CameraPreset, THREE.Vector3> = {
      persp:  new THREE.Vector3(1, 0.6, 1).normalize(),
      top:    new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0),
      front:  new THREE.Vector3(0, 0, 1),
      back:   new THREE.Vector3(0, 0, -1),
      left:   new THREE.Vector3(-1, 0, 0),
      right:  new THREE.Vector3(1, 0, 0),
    };
    const dir = dirs[preset];
    const pos = center.clone().add(dir.clone().multiplyScalar(dist));

    ctx.perspCam.position.copy(pos);
    ctx.perspCam.near = radius * 0.001;
    ctx.perspCam.far  = radius * 200;
    ctx.perspCam.updateProjectionMatrix();

    ctx.orthoCam.position.copy(pos);
    const W = mountRef.current?.clientWidth  ?? 800;
    const H = mountRef.current?.clientHeight ?? 600;
    const aspect = W / H;
    ctx.orthoCam.left   = -aspect * radius;
    ctx.orthoCam.right  =  aspect * radius;
    ctx.orthoCam.top    =  radius;
    ctx.orthoCam.bottom = -radius;
    ctx.orthoCam.near   = -radius * 200;
    ctx.orthoCam.far    =  radius * 200;
    ctx.orthoCam.updateProjectionMatrix();

    ctx.controls.target.copy(center);
    ctx.controls.update();

    console.debug(`[Viewer3D] fit: center=${center.toArray().map(v=>v.toFixed(1))}, radius=${radius.toFixed(1)}, preset=${preset}`);
  }, []);

  // Load/reload meshes when meshes prop changes
  useEffect(() => {
    const ctx = stateRef.current;
    if (!ctx) return;

    // Dispose old group contents
    ctx.group.clear();
    setLoadedCount(0);

    const entries = Object.entries(meshes);
    setTotalCount(entries.length);
    onMeshCountChange?.(entries.length);

    if (entries.length === 0) {
      console.debug('[Viewer3D] no meshes to load');
      return;
    }

    console.debug(`[Viewer3D] loading ${entries.length} meshes…`);
    const loader = new GLTFLoader();
    let loaded = 0;

    entries.forEach(([id, uri]) => {
      loader.loadAsync(uri)
        .then(gltf => {
          const obj = gltf.scene;
          obj.userData.elementId = id;
          obj.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.userData.elementId = id;
              m.material = MAT_DEFAULT.clone();
            }
          });
          ctx.group.add(obj);
          loaded++;
          setLoadedCount(loaded);
          if (loaded === entries.length) {
            console.debug('[Viewer3D] all meshes loaded, fitting camera');
            fitCamera(activePreset as CameraPreset);
          }
        })
        .catch(e => {
          console.warn(`[Viewer3D] failed to load mesh for ${id}:`, e);
          loaded++;
          setLoadedCount(loaded);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshes]);

  // Update highlight when selectedId changes (no mesh reload)
  useEffect(() => {
    const ctx = stateRef.current;
    if (!ctx) return;
    const hasSelection = Boolean(selectedId);
    console.debug(`[Viewer3D] highlight selectedId=${selectedId || '(none)'}`);
    ctx.group.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const id = m.userData.elementId;
        if (!hasSelection) {
          m.material = MAT_DEFAULT.clone();
        } else if (id === selectedId) {
          m.material = MAT_SELECTED.clone();
        } else {
          m.material = MAT_DIMMED.clone();
        }
      }
    });
  }, [selectedId]);

  // Toggle ortho/perspective
  const toggleOrtho = () => {
    const ctx = stateRef.current;
    if (!ctx) return;
    const next = !isOrtho;
    ctx.isOrtho = next;
    // Sync ortho camera position/target from persp
    ctx.orthoCam.position.copy(ctx.perspCam.position);
    ctx.controls.update();
    setIsOrtho(next);
    console.debug(`[Viewer3D] toggled to ${next ? 'ortho' : 'perspective'}`);
  };

  // Camera preset buttons
  const goPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    fitCamera(preset);
  };

  const presets: { key: CameraPreset; label: string }[] = [
    { key: 'persp',  label: '3D'  },
    { key: 'top',    label: 'Top' },
    { key: 'front',  label: 'Frt' },
    { key: 'back',   label: 'Bck' },
    { key: 'left',   label: 'Lft' },
    { key: 'right',  label: 'Rgt' },
    { key: 'bottom', label: 'Bot' },
  ];

  const isLoading = loadedCount < totalCount && totalCount > 0;

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Camera preset toolbar */}
      <div className="cam-toolbar">
        {presets.map(p => (
          <button
            key={p.key}
            className={`cam-btn${activePreset === p.key ? ' active' : ''}`}
            onClick={() => goPreset(p.key)}
            title={p.key}
          >
            {p.label}
          </button>
        ))}
        <div className="cam-divider" />
        <button
          className={`cam-btn${isOrtho ? ' active' : ''}`}
          onClick={toggleOrtho}
          title="Toggle Perspective / Orthographic"
        >
          {isOrtho ? 'Orth' : 'Perp'}
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="load-overlay">
          Loading {loadedCount}/{totalCount} bars…
        </div>
      )}

      {/* No mesh data message */}
      {!isLoading && totalCount === 0 && (
        <div className="no-mesh-msg">
          No 3D mesh data for current filter.<br />
          <span>Mesh is available for source 303020 only.</span>
        </div>
      )}
    </div>
  );
}
