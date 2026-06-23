import { useState, useEffect } from 'react';

const API = 'https://bim-api.asinha-371.workers.dev';

// Cross-filtered options: each level is filtered by the OTHER two selected values
export function useOptions(level: '1' | '2' | '3', l1: string, l2: string, l3: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ level });
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);
    if (l3) params.set('l3', l3);

    console.log(`[useOptions] level=${level}`, { l1, l2, l3 });
    fetch(`${API}/options?${params}`)
      .then(r => r.json())
      .then((data: string[]) => {
        console.log(`[useOptions] level=${level} → ${data.length} options`);
        setOptions(data);
        setLoading(false);
      })
      .catch(e => { console.error('[useOptions] error', e); setLoading(false); });
  }, [level, l1, l2, l3]);

  return { options, loading };
}

// Returns the exact total count for the current filter combination
export function useCount(l1: string, l2: string, l3: string) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);
    if (l3) params.set('l3', l3);

    fetch(`${API}/count?${params}`)
      .then(r => r.json())
      .then((data: { total: number }) => {
        console.log(`[useCount] → ${data.total} total`);
        setTotal(data.total);
      })
      .catch(e => console.error('[useCount] error', e));
  }, [l1, l2, l3]);

  return total;
}

// Returns all mesh data URIs for filtered elements (only 303020 has meshes)
export function useMeshes(l1: string, l2: string, l3: string) {
  const [meshes, setMeshes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '5000' });
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);
    if (l3) params.set('l3', l3);

    console.log('[useMeshes] fetching', { l1, l2, l3 });
    fetch(`${API}/meshes?${params}`)
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        console.log(`[useMeshes] → ${Object.keys(data).length} meshes`);
        setMeshes(data);
        setLoading(false);
      })
      .catch(e => { console.error('[useMeshes] error', e); setLoading(false); });
  }, [l1, l2, l3]);

  return { meshes, loading };
}
