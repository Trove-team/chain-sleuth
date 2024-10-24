import dynamic from 'next/dynamic';

const DynamicGraph = dynamic(() => import('@/components/graph/Graph'), { ssr: false });

export default function GraphPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Graph Visualization</h1>
      <DynamicGraph />
    </>
  );
}