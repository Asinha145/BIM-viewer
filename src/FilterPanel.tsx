import { useMemo } from 'react';
import { useOptions, useElements } from './useData';
import type { Element } from './types';

interface Props {
  l1: string; setL1: (v: string) => void;
  l2: string; setL2: (v: string) => void;
  l3: string; setL3: (v: string) => void;
  uid: string; setUid: (v: string) => void;
  onElementSelected: (el: Element | null) => void;
}

export function FilterPanel({ l1, setL1, l2, setL2, l3, setL3, uid, setUid, onElementSelected }: Props) {
  const { options: l1Options, loading: l1Loading } = useOptions('1', '', '');
  const { options: l2Options, loading: l2Loading } = useOptions('2', l1, '');
  const { options: l3Options, loading: l3Loading } = useOptions('3', l1, l2);
  const { elements, loading: elLoading } = useElements(l1, l2, l3);

  const uidOptions = useMemo(() => elements.map(e => e.id), [elements]);
  const selected   = useMemo(() => elements.find(e => e.id === uid) ?? null, [elements, uid]);

  const handleL1 = (v: string) => { setL1(v); setL2(''); setL3(''); setUid(''); onElementSelected(null); };
  const handleL2 = (v: string) => { setL2(v); setL3(''); setUid(''); onElementSelected(null); };
  const handleL3 = (v: string) => { setL3(v); setUid(''); onElementSelected(null); };
  const handleUid = (v: string) => {
    setUid(v);
    onElementSelected(elements.find(e => e.id === v) ?? null);
  };

  const anyLoading = l1Loading || l2Loading || l3Loading || elLoading;

  return (
    <div className="filter-panel">
      <h2>BIM Viewer</h2>
      <p className="subtitle">
        {anyLoading ? 'Loading…' : l3 ? `${elements.length.toLocaleString()} elements` : 'Select filters below'}
      </p>

      <label>Assembly Level 1
        <select value={l1} onChange={e => handleL1(e.target.value)} disabled={l1Loading}>
          <option value="">— Select —</option>
          {l1Options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>Assembly Level 2
        <select value={l2} onChange={e => handleL2(e.target.value)} disabled={!l1 || l2Loading}>
          <option value="">— Select —</option>
          {l2Options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>Assembly Level 3
        <select value={l3} onChange={e => handleL3(e.target.value)} disabled={!l2 || l3Loading}>
          <option value="">— Select —</option>
          {l3Options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>UID (GlobalId)
        <select value={uid} onChange={e => handleUid(e.target.value)} disabled={!l3 || elLoading}>
          <option value="">— Select —</option>
          {uidOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      {l3 && !elLoading && (
        <div className="match-count">{elements.length.toLocaleString()} matching elements</div>
      )}

      {selected && (
        <div className="element-card">
          <div className="card-row"><span>Type</span><span>{selected.type}</span></div>
          <div className="card-row"><span>Name</span><span>{selected.name || '—'}</span></div>
          <div className="card-row"><span>Source</span><span>{selected.src}</span></div>
          <div className="card-row"><span>TracerID</span><span className="mono">{selected.tid.slice(0, 20)}…</span></div>
        </div>
      )}
    </div>
  );
}
