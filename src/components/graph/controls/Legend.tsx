import { NodeType } from '@/types/graph';

interface LegendProps {
  nodeTypes: Set<string>;
  nodeColors: Record<NodeType, string>;
}

export function Legend({ nodeTypes, nodeColors }: LegendProps) {
  return (
    <div className="absolute top-4 right-20 z-10 bg-white/80 p-2 rounded-lg">
      <div className="text-sm font-semibold mb-1">Node Types</div>
      {Array.from(nodeTypes).map(type => (
        <div key={type} className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors[type as NodeType] }} />
          <span className="text-sm">{type}</span>
        </div>
      ))}
    </div>
  );
}