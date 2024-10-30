'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ForceGraph2D, ForceGraphMethods } from 'react-force-graph';
import { runQuery } from '@/utils/neo4j';
import { Node, Link, GraphData, GraphRef, Neo4jNode, Neo4jRelationship, GraphRecord, NodeType, GraphNode } from '@/types/graph';
import { NODE_R, NODE_COLORS } from './constants';
import { ZoomControls } from './controls/ZoomControls';
import { SearchBar } from './controls/SearchBar';
import { StatsPanel } from './controls/StatsPanel';
import { Legend } from './controls/Legend';
import { NodeInfoPanel } from './panels/NodeInfoPanel';
import debounce from 'lodash/debounce';

const NODE_LABEL_DISTANCE = 12;

function Neo4jGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const fgRef = useRef<ForceGraphMethods>(null);
  const [nodeTypes, setNodeTypes] = useState<Set<string>>(new Set());
  const [linkTypes, setLinkTypes] = useState<Set<string>>(new Set());

  // Stats calculation
  const stats = useMemo(() => ({
    nodeCount: graphData.nodes.length,
    edgeCount: graphData.links.length,
    nodeTypes: Array.from(nodeTypes),
    relationshipTypes: Array.from(linkTypes)
  }), [graphData, nodeTypes, linkTypes]);

  // Fetch data logic
  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const query = `
        MATCH (a:Account)-[r]-(b:Account)
        WHERE a.id CONTAINS $searchTerm OR b.id CONTAINS $searchTerm
        RETURN a, r, b
        LIMIT 100
      `;
      const result = await runQuery(query, { searchTerm });

      const nodes = new Map<string, Node>();
      const links: Link[] = [];
      const newNodeTypes = new Set<string>();
      const newLinkTypes = new Set<string>();

      result.forEach((record: GraphRecord) => {
        const a = record.get('a') as Neo4jNode;
        const b = record.get('b') as Neo4jNode;
        const relationship = record.get('r') as Neo4jRelationship;

        [a, b].forEach(node => {
          if (!nodes.has(node.identity.toString())) {
            const nodeType = node.labels[0] as NodeType;
            newNodeTypes.add(nodeType);
            nodes.set(node.identity.toString(), {
              id: node.properties.id,
              label: nodeType,
              properties: node.properties,
              color: NODE_COLORS[nodeType as NodeType] || '#999',
              type: nodeType
            });
          }
        });

        newLinkTypes.add(relationship.type);
        links.push({
          source: a.properties.id,
          target: b.properties.id,
          label: relationship.type,
          type: relationship.type
        });
      });

      setNodeTypes(newNodeTypes);
      setLinkTypes(newLinkTypes);
      setGraphData({
        nodes: Array.from(nodes.values()),
        links: links
      });
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 500),
    []
  );

  return (
    <div className="relative h-[800px] w-full bg-transparent-grey backdrop-filter backdrop-custom rounded-lg">
      <ZoomControls fgRef={fgRef} />
      <div className="absolute top-4 left-4 z-20 space-y-4">
        <SearchBar onSearch={debouncedSearch} />
        <StatsPanel nodeCount={stats.nodeCount} edgeCount={stats.edgeCount} />
      </div>
      <Legend nodeTypes={nodeTypes} nodeColors={NODE_COLORS} />
      
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel="label"
        linkLabel="label"
        nodeColor={(node) => (node as Node).color || '#999'}
        nodeRelSize={NODE_R}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        width={window.innerWidth - 100}
        height={750}
        backgroundColor="rgba(0,0,0,0)"
        onNodeClick={(node) => setSelectedNode(node as Node)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const graphNode = node as unknown as GraphNode;
          if (typeof graphNode.x !== 'number' || typeof graphNode.y !== 'number') return;

        // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI);
          ctx.fillStyle = node.color || '#999';
          ctx.fill();

          // Draw node border
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

            // Draw node label with proper scaling
          const label = node.properties?.id || node.label;
          if (!label) return;

          const fontSize = Math.max(12 / globalScale, 8); // Minimum font size of 8px
          ctx.font = `${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000';
          ctx.fillText(
            label.toString().slice(0, 10), // Truncate long labels
            node.x,
            node.y + NODE_R + (NODE_LABEL_DISTANCE / globalScale)
          );
        }}
      />
      {selectedNode && <NodeInfoPanel node={selectedNode} />}
    </div>
  );
}

export default Neo4jGraph;