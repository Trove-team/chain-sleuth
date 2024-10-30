interface StatsPanelProps {
  nodeCount: number;
  edgeCount: number;
}

export function StatsPanel({ nodeCount, edgeCount }: StatsPanelProps) {
  return (
    <div className="bg-white/80 p-2 rounded-lg text-sm text-black">
      <div>Nodes: {nodeCount}</div>
      <div>Edges: {edgeCount}</div>
    </div>
  );
}