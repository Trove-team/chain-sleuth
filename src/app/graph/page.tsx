import Layout from '../../components/Layout';
import dynamic from 'next/dynamic';

const ForceGraph = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph2D), { ssr: false });

export default function Graph() {
  const graphData = {
    nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
    links: [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
    ],
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-4">Graph Visualization</h1>
      <div style={{ height: '600px' }}>
        <ForceGraph graphData={graphData} />
      </div>
    </Layout>
  );
}
