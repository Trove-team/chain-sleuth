'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { runQuery } from '@/utils/neo4j';

interface Node {
  id: string;
  label: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  color?: string;
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

const NODE_R = 20; // Increased radius to fit text

function Neo4jGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const fgRef = useRef();

  const fetchGraphData = useCallback(async () => {
    try {
      console.log('Fetching graph data with searchTerm:', searchTerm);
      const query = `
        MATCH (a:Account)-[r]-(b:Account)
        WHERE a <> b
        AND (a.name CONTAINS $searchTerm OR b.name CONTAINS $searchTerm)
        RETURN a, r, b
        LIMIT 100
      `;
      const result = await runQuery(query, { searchTerm });
      console.log('Query result:', result);
      
      const nodes = new Map<string, Node>();
      const links: Link[] = [];
  
      result.forEach(record => {
        const a = record.get('a');
        const b = record.get('b');
        const relationship = record.get('r');
  
        [a, b].forEach(node => {
          if (!nodes.has(node.identity.toString())) {
            nodes.set(node.identity.toString(), {
              id: node.identity.toString(),
              label: 'Account',
              properties: node.properties
            });
          }
        });
  
        links.push({
          source: a.identity.toString(),
          target: b.identity.toString(),
          label: relationship.type
        });
      });
  
      console.log('Processed nodes:', nodes);
      console.log('Processed links:', links);
  
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

  const graph = useMemo(() => {
    return (
      <ForceGraph2D 
        ref={fgRef}
        graphData={graphData}
        nodeLabel={node => `${node.label}: ${node.properties.title || node.properties.name}`}
        linkLabel="label"
        nodeAutoColorBy="label"
        linkAutoColorBy="label"
        nodeRelSize={NODE_R}
        linkWidth={1}
        backgroundColor="rgba(255, 255, 255, 0.1)"
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.properties.title || node.properties.name;
          ctx.fillStyle = node.color || 'white'; // Provide a default color if node.color is undefined
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, NODE_R, 0, 2 * Math.PI, false);
          ctx.fill();
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          
          // Truncate text if too long
          const maxLength = NODE_R * 2 / (fontSize / 2);
          let truncatedLabel = label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
          ctx.fillText(truncatedLabel, node.x!, node.y!);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, NODE_R, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />
    );
  }, [graphData, handleNodeClick, handleBackgroundClick]);

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
      {graph}
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