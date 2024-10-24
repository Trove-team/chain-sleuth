'use client';

import { ForceGraph2D } from 'react-force-graph';

export default function Graph() {
  const graphData = {
    nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
    links: [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
    ],
  };

  return (
    <div style={{ height: '600px' }}>
      <ForceGraph2D graphData={graphData} />
    </div>
  );
}