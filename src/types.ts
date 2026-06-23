export interface Element {
  id: string;
  type: string;
  name: string;
  desc: string;
  tid: string;
  l1: string;
  l2: string;
  l3: string;
  src: string;
}

export type MeshMap = Record<string, string>; // GlobalId -> data URI
