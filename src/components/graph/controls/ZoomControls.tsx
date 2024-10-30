import { FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi';
import { ForceGraphMethods } from 'react-force-graph';

interface ZoomControlsProps {
  fgRef: React.MutableRefObject<ForceGraphMethods | null>;
}

export function ZoomControls({ fgRef }: ZoomControlsProps) {
  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      if (typeof currentZoom === 'number') {
        fgRef.current.zoom(currentZoom * 1.5);
      }
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      if (typeof currentZoom === 'number') {
        fgRef.current.zoom(currentZoom / 1.5);
      }
    }
  };

  const handleReset = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
      fgRef.current.centerAt(0, 0);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex space-x-2">
      <button
        onClick={handleZoomIn}
        className="p-2 bg-white/80 rounded-lg hover:bg-white/90 transition-colors"
      >
        <FiZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={handleZoomOut}
        className="p-2 bg-white/80 rounded-lg hover:bg-white/90 transition-colors"
      >
        <FiZoomOut className="w-5 h-5" />
      </button>
      <button
        onClick={handleReset}
        className="p-2 bg-white/80 rounded-lg hover:bg-white/90 transition-colors"
      >
        <FiRefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}