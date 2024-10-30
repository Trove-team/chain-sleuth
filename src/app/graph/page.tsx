import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const DynamicNeo4jGraph = dynamic(() => import('@/components/graph/Neo4jGraph'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
});

export default function GraphPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6 bg-transparent">
        <h1 className="text-3xl font-bold text-black">Graph Visualization</h1>
        <div className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-md rounded-lg overflow-hidden">
          <DynamicNeo4jGraph />
        </div>
      </div>
    </ErrorBoundary>
  );
}
