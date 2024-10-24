import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const DynamicGraph = dynamic(() => import('@/components/graph/Graph'), { 
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Graph Visualization</h1>
        <DynamicGraph />
      </div>
    </ErrorBoundary>
  );
}