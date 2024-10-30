declare module 'react-force-graph' {
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