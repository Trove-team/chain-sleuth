declare module 'react-force-graph' {
  import { ForceLink, ForceManyBody, ForceCenter } from 'd3-force';

  export interface ForceGraphNodeObject {
    id: string;
    label?: string;
    color?: string;
    properties?: Record<string, any>;
    type?: string;
    [key: string]: any;
  }

  export interface ForceGraphProps {
    graphData: {
      nodes: ForceGraphNodeObject[];
      links: Array<{
        source: string | ForceGraphNodeObject;
        target: string | ForceGraphNodeObject;
        [key: string]: any;
      }>;
    };
    nodeId?: string;
    nodeLabel?: string;
    linkLabel?: string;
    nodeColor?: string | ((node: ForceGraphNodeObject) => string);
    nodeRelSize?: number;
    linkDirectionalParticles?: number;
    linkDirectionalParticleSpeed?: number;
    backgroundColor?: string;
    onNodeClick?: (node: ForceGraphNodeObject) => void;
    width?: number;
    height?: number;
    nodeCanvasObject?: (
      node: ForceGraphNodeObject,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => void;
    d3Force?: (forceName: string, force: ForceLink<any, any> | ForceManyBody<any> | ForceCenter<any>) => void;
    d3VelocityDecay?: number;
  }

  export interface ForceGraphMethods {
    zoomToFit: (duration?: number) => void;
    zoom: (zoom?: number) => number;
    centerAt: (x?: number, y?: number) => void;
    d3Force: (name: string, force?: any) => void;
  }

  export const ForceGraph2D: React.ForwardRefExoticComponent<
    ForceGraphProps & React.RefAttributes<ForceGraphMethods>
  >;
}