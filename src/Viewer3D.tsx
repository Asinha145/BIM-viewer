import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
  meshUri: string | null;
}

export function Viewer3D({ meshUri }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    mesh: THREE.Object3D | null;
    animId: number;
  } | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x1a1a2e, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.01, 1e8);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(1, 2, 3);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    sceneRef.current = { renderer, scene, camera, controls, mesh: null, animId };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    if (ctx.mesh) {
      ctx.scene.remove(ctx.mesh);
      ctx.mesh = null;
    }

    if (!meshUri) return;

    const loader = new GLTFLoader();
    loader.load(meshUri, (gltf) => {
      const obj = gltf.scene;

      // Apply a steel-blue material
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x4a90d9,
            shininess: 60,
            side: THREE.DoubleSide,
          });
        }
      });

      // Centre and fit camera
      const box = new THREE.Box3().setFromObject(obj);
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      obj.position.sub(centre);

      ctx.scene.add(obj);
      ctx.mesh = obj;

      ctx.camera.position.set(0, 0, size * 1.5);
      ctx.camera.near = size * 0.001;
      ctx.camera.far  = size * 100;
      ctx.camera.updateProjectionMatrix();
      ctx.controls.target.set(0, 0, 0);
      ctx.controls.update();
    });
  }, [meshUri]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!meshUri && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#555', fontSize: 14, pointerEvents: 'none',
        }}>
          Select a UID to render its mesh
        </div>
      )}
    </div>
  );
}
