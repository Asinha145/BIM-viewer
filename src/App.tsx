import { useState } from 'react';
import { useMeshes } from './useData';
import { FilterPanel } from './FilterPanel';
import { Viewer3D } from './Viewer3D';
import type { Element } from './types';
import './App.css';

export default function App() {
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [uid, setUid] = useState('');
  const [meshCount, setMeshCount] = useState(0);

  // Load all meshes matching current filter (initially: all 303020 meshes)
  const { meshes, loading: meshLoading } = useMeshes(l1, l2, l3);

  const handleElementSelected = (el: Element | null) => {
    setUid(el?.id ?? '');
  };

  return (
    <div className="app">
      <FilterPanel
        l1={l1} setL1={setL1}
        l2={l2} setL2={setL2}
        l3={l3} setL3={setL3}
        uid={uid} setUid={setUid}
        meshCount={meshCount}
        meshLoading={meshLoading}
        onElementSelected={handleElementSelected}
      />
      <div className="viewer-wrap">
        <Viewer3D
          meshes={meshes}
          selectedId={uid}
          onMeshCountChange={setMeshCount}
        />
      </div>
    </div>
  );
}
