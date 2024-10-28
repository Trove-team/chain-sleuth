// components/graph/Graph.tsx
'use client';

import { useEffect, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import ErrorBoundary from '../common/ErrorBoundary';

function GraphComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const graphData = {
    nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
    links: [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
    ],
  };

  if (!mounted) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full">
      <ForceGraph2D 
        graphData={graphData}
        nodeRelSize={6}
        linkWidth={1}
        backgroundColor="rgba(255, 255, 255, 0.1)"
      />
    </div>
  );
}

export default function Graph() {
  return (
    <ErrorBoundary>
      <GraphComponent />
    </ErrorBoundary>
  );
}