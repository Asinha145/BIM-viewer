import { useMemo } from 'react';
import { useOptions, useElements } from './useData';
import type { Element } from './types';

interface Props {
  l1: string; setL1: (v: string) => void;
  l2: string; setL2: (v: string) => void;
  l3: string; setL3: (v: string) => void;
  uid: string; setUid: (v: string) => void;
  meshCount: number;
  meshLoading: boolean;
  onElementSelected: (el: Element | null) => void;
}

export function FilterPanel({ l1, setL1, l2, setL2, l3, setL3, uid, setUid, meshCount, meshLoading, onElementSelected }: Props) {
  // Each filter cross-filtered by the OTHER two — all always enabled
  const { options: l1Opts, loading: l1Load } = useOptions('1', '', l2, l3);
  const { options: l2Opts, loading: l2Load } = useOptions('2', l1, '', l3);
  const { options: l3Opts, loading: l3Load } = useOptions('3', l1, l2, '');
  const { elements, loading: elLoad } = useElements(l1, l2, l3);

  const selected = useMemo(() => elements.find(e => e.id === uid) ?? null, [elements, uid]);

  const handleL1 = (v: string) => { setL1(v); onElementSelected(null); };
  const handleL2 = (v: string) => { setL2(v); onElementSelected(null); };
  const handleL3 = (v: string) => { setL3(v); onElementSelected(null); };
  const handleUid = (v: string) => {
    setUid(v);
    onElementSelected(v ? elements.find(e => e.id === v) ?? null : null);
  };

  const anyLoad = l1Load || l2Load || l3Load;

  return (
    <div className="filter-panel">
      <h2>BIM Viewer</h2>
      <p className="subtitle">
        {meshLoading ? 'Loading meshes…' : `${meshCount} bars in view`}
        {anyLoad ? ' · updating…' : ''}
      </p>

      <label>Assembly Level 1
        <select value={l1} onChange={e => handleL1(e.target.value)} disabled={l1Load}>
          <option value="">— All —</option>
          {l1Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>Assembly Level 2
        <select value={l2} onChange={e => handleL2(e.target.value)} disabled={l2Load}>
          <option value="">— All —</option>
          {l2Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>Assembly Level 3
        <select value={l3} onChange={e => handleL3(e.target.value)} disabled={l3Load}>
          <option value="">— All —</option>
          {l3Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>UID (GlobalId)
        <select value={uid} onChange={e => handleUid(e.target.value)} disabled={elLoad}>
          <option value="">— All —</option>
          {elements.map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
        </select>
      </label>

      {elements.length > 0 && (
        <div className="match-count">{elements.length.toLocaleString()} matching elements</div>
      )}

      {selected && (
        <div className="element-card">
          <div className="card-row"><span>Type</span><span>{selected.type}</span></div>
          <div className="card-row"><span>Name</span><span>{selected.name || '—'}</span></div>
          <div className="card-row"><span>Source</span><span>{selected.src}</span></div>
          <div className="card-row"><span>L1</span><span>{selected.l1}</span></div>
          <div className="card-row"><span>L2</span><span>{selected.l2}</span></div>
          <div className="card-row"><span>L3</span><span>{selected.l3}</span></div>
          <div className="card-row"><span>TracerID</span><span className="mono">{selected.tid.slice(0, 20)}…</span></div>
        </div>
      )}
    </div>
  );
}
