import { useState, useEffect } from 'react';
import type { Element, MeshMap } from './types';

export function useElements() {
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/elements.json')
      .then(r => r.json())
      .then((data: Element[]) => { setElements(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { elements, loading };
}

const meshCache: Record<string, MeshMap> = {};

export async function loadMeshes(src: string): Promise<MeshMap> {
  if (meshCache[src]) return meshCache[src];
  const res = await fetch(`/data/meshes-${src}.json`);
  if (!res.ok) return {};
  const data: MeshMap = await res.json();
  meshCache[src] = data;
  return data;
}
