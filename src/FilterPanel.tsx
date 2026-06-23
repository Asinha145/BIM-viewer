import { useMemo } from 'react';
import type { Element } from './types';

interface Props {
  elements: Element[];
  l1: string; setL1: (v: string) => void;
  l2: string; setL2: (v: string) => void;
  l3: string; setL3: (v: string) => void;
  uid: string; setUid: (v: string) => void;
  loading: boolean;
}

function unique(arr: string[]) {
  return ['', ...Array.from(new Set(arr.filter(Boolean))).sort()];
}

export function FilterPanel({ elements, l1, setL1, l2, setL2, l3, setL3, uid, setUid, loading }: Props) {
  const l1Options = useMemo(() => unique(elements.map(e => e.l1)), [elements]);

  const afterL1 = useMemo(
    () => l1 ? elements.filter(e => e.l1 === l1) : elements,
    [elements, l1]
  );
  const l2Options = useMemo(() => unique(afterL1.map(e => e.l2)), [afterL1]);

  const afterL2 = useMemo(
    () => l2 ? afterL1.filter(e => e.l2 === l2) : afterL1,
    [afterL1, l2]
  );
  const l3Options = useMemo(() => unique(afterL2.map(e => e.l3)), [afterL2]);

  const afterL3 = useMemo(
    () => l3 ? afterL2.filter(e => e.l3 === l3) : afterL2,
    [afterL2, l3]
  );
  const uidOptions = useMemo(() => unique(afterL3.map(e => e.id)), [afterL3]);

  const selected = useMemo(() => afterL3.find(e => e.id === uid) ?? null, [afterL3, uid]);

  const handleL1 = (v: string) => { setL1(v); setL2(''); setL3(''); setUid(''); };
  const handleL2 = (v: string) => { setL2(v); setL3(''); setUid(''); };
  const handleL3 = (v: string) => { setL3(v); setUid(''); };

  return (
    <div className="filter-panel">
      <h2>BIM Viewer</h2>
      <p className="subtitle">{loading ? 'Loading…' : `${elements.length.toLocaleString()} elements`}</p>

      <label>Assembly Level 1
        <select value={l1} onChange={e => handleL1(e.target.value)} disabled={loading}>
          {l1Options.map(o => <option key={o} value={o}>{o || '— All —'}</option>)}
        </select>
      </label>

      <label>Assembly Level 2
        <select value={l2} onChange={e => handleL2(e.target.value)} disabled={loading || !l1Options.length}>
          {l2Options.map(o => <option key={o} value={o}>{o || '— All —'}</option>)}
        </select>
      </label>

      <label>Assembly Level 3
        <select value={l3} onChange={e => handleL3(e.target.value)} disabled={loading}>
          {l3Options.map(o => <option key={o} value={o}>{o || '— All —'}</option>)}
        </select>
      </label>

      <label>UID (GlobalId)
        <select value={uid} onChange={e => setUid(e.target.value)} disabled={loading}>
          {uidOptions.map(o => <option key={o} value={o}>{o || '— All —'}</option>)}
        </select>
      </label>

      <div className="match-count">
        {afterL3.length.toLocaleString()} matching elements
      </div>

      {selected && (
        <div className="element-card">
          <div className="card-row"><span>Type</span><span>{selected.type}</span></div>
          <div className="card-row"><span>Name</span><span>{selected.name || '—'}</span></div>
          <div className="card-row"><span>Source</span><span>{selected.src}</span></div>
          <div className="card-row"><span>TracerID</span><span className="mono">{selected.tid.slice(0, 20)}…</span></div>
          {selected.src !== '303020' && (
            <div className="mesh-note">3D mesh available for source 303020 only</div>
          )}
        </div>
      )}
    </div>
  );
}
