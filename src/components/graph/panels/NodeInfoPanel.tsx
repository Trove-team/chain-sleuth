import { Node } from '@/types/graph';

interface NodeInfoPanelProps {
  node: Node;
}

export function NodeInfoPanel({ node }: NodeInfoPanelProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-md max-h-[300px] overflow-y-auto text-black">
      <h3 className="text-lg font-bold mb-2 flex items-center">
        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: node.color }} />
        {node.label}: {node.id}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(node.properties).map(([key, value]) => (
          <div key={key} className="col-span-2">
            <span className="font-semibold">{key}:</span>{' '}
            <span className="break-all">{value.toString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}