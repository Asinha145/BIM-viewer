import { useState, useEffect } from 'react';
import { useElements, loadMeshes } from './useData';
import { FilterPanel } from './FilterPanel';
import { Viewer3D } from './Viewer3D';
import './App.css';

export default function App() {
  const { elements, loading } = useElements();

  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [uid, setUid] = useState('');
  const [meshUri, setMeshUri] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setMeshUri(null); return; }
    const el = elements.find(e => e.id === uid);
    if (!el) { setMeshUri(null); return; }

    loadMeshes(el.src).then(map => {
      setMeshUri(map[uid] ?? null);
    });
  }, [uid, elements]);

  return (
    <div className="app">
      <FilterPanel
        elements={elements}
        l1={l1} setL1={setL1}
        l2={l2} setL2={setL2}
        l3={l3} setL3={setL3}
        uid={uid} setUid={setUid}
        loading={loading}
      />
      <div className="viewer-wrap">
        <Viewer3D meshUri={meshUri} />
      </div>
    </div>
  );
}
