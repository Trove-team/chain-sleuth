import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// Dynamically import the Graph component with ssr disabled
const DynamicGraph = dynamic(() => import('../../components/Graph'), { ssr: false });

export default function GraphPage() {
  return (
    <PageLayout>
      <h1 className="text-3xl font-bold mb-4">Graph Visualization</h1>
      <DynamicGraph />
    </PageLayout>
  );
}
