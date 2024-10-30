// Instead of importing from react-force-graph, define the interfaces we need
interface BaseNode {
  id: string;
  label: string;
  properties: Record<string, any>;
  color?: string;
  type?: string;
}

interface BaseLink {
  source: string | BaseNode;
  target: string | BaseNode;
  label: string;
  type?: string;
}

export interface Node extends BaseNode {
  [key: string]: any;
}

export interface Link extends BaseLink {
  [key: string]: any;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export type NodeType = 'Account' | 'Transaction' | 'Contract';

export interface Neo4jNode {
  identity: { toString: () => string };
  labels: string[];
  properties: Record<string, any>;
}

export interface Neo4jRelationship {
  type: string;
  properties: Record<string, any>;
}

export interface GraphRecord {
  get: (key: string) => Neo4jNode | Neo4jRelationship;
}

export interface GraphRef {
  zoom: (value?: number) => number;
  centerAt: (x?: number, y?: number, duration?: number) => void;
  zoomToFit: (duration?: number, padding?: number) => void;
  d3Force: (name: string, force?: any) => void;
}