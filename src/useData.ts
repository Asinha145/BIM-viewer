import { useState, useEffect } from 'react';
import type { Element } from './types';

const API = 'https://bim-api.asinha-371.workers.dev';

export function useOptions(level: '1' | '2' | '3', l1: string, l2: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (level === '2' && !l1) { setOptions([]); return; }
    if (level === '3' && (!l1 || !l2)) { setOptions([]); return; }

    setLoading(true);
    const params = new URLSearchParams({ level });
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);

    fetch(`${API}/options?${params}`)
      .then(r => r.json())
      .then((data: string[]) => { setOptions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [level, l1, l2]);

  return { options, loading };
}

export function useElements(l1: string, l2: string, l3: string) {
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setElements([]);
    if (!l1 && !l2 && !l3) return;

    setLoading(true);
    const params = new URLSearchParams();
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);
    if (l3) params.set('l3', l3);

    fetch(`${API}/elements?${params}`)
      .then(r => r.json())
      .then((data: Element[]) => { setElements(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [l1, l2, l3]);

  return { elements, loading };
}

const meshCache: Record<string, string> = {};

export async function loadMesh(id: string): Promise<string | null> {
  if (meshCache[id] !== undefined) return meshCache[id] || null;
  try {
    const res = await fetch(`${API}/mesh/${encodeURIComponent(id)}`);
    if (!res.ok) { meshCache[id] = ''; return null; }
    const data = await res.json() as { mesh: string };
    meshCache[id] = data.mesh;
    return data.mesh || null;
  } catch {
    return null;
  }
}
