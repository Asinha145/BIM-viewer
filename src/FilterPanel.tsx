import { useMemo, useState, useEffect, useRef } from 'react';
import { useOptions, useCount } from './useData';
import type { Element } from './types';

const API = 'https://bim-api.asinha-371.workers.dev';

interface Props {
  l1: string; setL1: (v: string) => void;
  l2: string; setL2: (v: string) => void;
  l3: string; setL3: (v: string) => void;
  uid: string; setUid: (v: string) => void;
  meshCount: number;
  meshLoading: boolean;
  onElementSelected: (el: Element | null) => void;
}

function useUidSearch(query: string, l1: string, l2: string, l3: string) {
  const [results, setResults] = useState<Element[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query && !l1 && !l2 && !l3) { setResults([]); return; }

    timerRef.current = setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({ limit: '200' });
      if (query) params.set('q', query);
      if (l1) params.set('l1', l1);
      if (l2) params.set('l2', l2);
      if (l3) params.set('l3', l3);

      fetch(`${API}/elements?${params}`)
        .then(r => r.json())
        .then((data: Element[]) => {
          console.log(`[uidSearch] "${query}" → ${data.length} results`);
          setResults(data);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 250);
  }, [query, l1, l2, l3]);

  return { results, searching };
}

export function FilterPanel({ l1, setL1, l2, setL2, l3, setL3, uid, setUid, meshCount, meshLoading, onElementSelected }: Props) {
  const { options: l1Opts, loading: l1Load } = useOptions('1', '', l2, l3);
  const { options: l2Opts, loading: l2Load } = useOptions('2', l1, '', l3);
  const { options: l3Opts, loading: l3Load } = useOptions('3', l1, l2, '');
  const totalCount = useCount(l1, l2, l3);

  const [uidQuery, setUidQuery]     = useState('');
  const [showDrop, setShowDrop]     = useState(false);
  const [selected, setSelected]     = useState<Element | null>(null);
  const { results, searching }      = useUidSearch(uidQuery, l1, l2, l3);
  const dropRef                     = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleL1 = (v: string) => { setL1(v); clearUid(); };
  const handleL2 = (v: string) => { setL2(v); clearUid(); };
  const handleL3 = (v: string) => { setL3(v); clearUid(); };
  const clearUid = () => { setUid(''); setSelected(null); setUidQuery(''); onElementSelected(null); };

  const pickElement = (el: Element) => {
    setUid(el.id);
    setSelected(el);
    setUidQuery(el.id);
    setShowDrop(false);
    onElementSelected(el);
    console.log('[FilterPanel] selected element', el.id);
  };

  const anyLoad = l1Load || l2Load;
  const showResults = showDrop && results.length > 0;

  return (
    <div className="filter-panel">
      <h2>BIM Viewer</h2>
      <p className="subtitle">
        {meshLoading ? `Loading ${meshCount} bars…` : `${meshCount} bars in view`}
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

      <label>Search UID / Name
        <div className="uid-search" ref={dropRef}>
          <input
            type="text"
            placeholder={searching ? 'Searching…' : 'Type to search all elements…'}
            value={uidQuery}
            onChange={e => { setUidQuery(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
          />
          {uid && (
            <button className="uid-clear" onClick={clearUid} title="Clear">✕</button>
          )}
          {showResults && (
            <div className="uid-dropdown">
              {results.map(el => (
                <div key={el.id} className="uid-option" onClick={() => pickElement(el)}>
                  <span className="uid-id">{el.id}</span>
                  {el.name && <span className="uid-name">{el.name}</span>}
                </div>
              ))}
              {results.length === 200 && (
                <div className="uid-more">Type more to narrow results…</div>
              )}
            </div>
          )}
        </div>
      </label>

      {useMemo(() => totalCount !== null && (
        <div className="match-count">
          {totalCount.toLocaleString()} matching elements
        </div>
      ), [totalCount])}

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
