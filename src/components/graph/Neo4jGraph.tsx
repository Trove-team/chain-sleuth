import { useEffect, useState, useCallback, useRef } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { runQuery } from '@/utils/neo4j';

interface Node {
  id: string;
  label: string;
  properties: Record<string, any>;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

function Neo4jGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const fgRef = useRef();

  const fetchGraphData = useCallback(async () => {
    try {
      const query = `
        MATCH (m:Movie)<-[r:ACTED_IN]-(a:Person)
        WHERE m.title CONTAINS $searchTerm OR a.name CONTAINS $searchTerm
        RETURN m, a, r
        LIMIT 100
      `;
      const result = await runQuery(query, { searchTerm });
      
      const nodes = new Map<string, Node>();
      const links: Link[] = [];

      result.forEach(record => {
        const movie = record.get('m');
        const actor = record.get('a');
        const relationship = record.get('r');

        if (!nodes.has(movie.identity.toString())) {
          nodes.set(movie.identity.toString(), {
            id: movie.identity.toString(),
            label: 'Movie',
            properties: movie.properties
          });
        }
        if (!nodes.has(actor.identity.toString())) {
          nodes.set(actor.identity.toString(), {
            id: actor.identity.toString(),
            label: 'Person',
            properties: actor.properties
          });
        }

        links.push({
          source: actor.identity.toString(),
          target: movie.identity.toString(),
          label: relationship.type
        });
      });

      setGraphData({
        nodes: Array.from(nodes.values()),
        links: links
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full bg-white bg-opacity-30 backdrop-filter backdrop-custom rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <input
          type="text"
          placeholder="Search movies or actors..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <ForceGraph2D 
        ref={fgRef}
        graphData={graphData}
        nodeLabel={node => `${node.label}: ${node.properties.title || node.properties.name}`}
        linkLabel="label"
        nodeAutoColorBy="label"
        linkAutoColorBy="label"
        nodeRelSize={6}
        linkWidth={1}
        backgroundColor="rgba(255, 255, 255, 0.1)"
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">{selectedNode.label}</h3>
          <ul>
            {Object.entries(selectedNode.properties).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value.toString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Neo4jGraph;