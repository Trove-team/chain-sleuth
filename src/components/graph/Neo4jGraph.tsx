'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ForceGraph2D, ForceGraphMethods } from 'react-force-graph';
import { runQuery } from '@/utils/neo4j';
import { Node, Link, GraphData, GraphRef, Neo4jNode, Neo4jRelationship, GraphRecord, NodeType, GraphNode } from '@/types/graph';
import { NODE_R, NODE_COLORS, NODE_BORDER_COLOR } from './constants';
import { ZoomControls } from './controls/ZoomControls';
import { SearchBar } from './controls/SearchBar';
import { StatsPanel } from './controls/StatsPanel';
import { Legend } from './controls/Legend';
import { NodeInfoPanel } from './panels/NodeInfoPanel';
import debounce from 'lodash/debounce';
import { ForceLink, ForceManyBody, ForceCenter } from 'd3-force';

const NODE_LABEL_DISTANCE = 0;
const FORCE_STRENGTH = -3500;
const LINK_DISTANCE = 300;
const CENTER_STRENGTH = 0.02;

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
        MATCH (start:Account {id: 'nf-payments1.near'})-[r*1..2]-(connected:Account)
        RETURN start, r, connected
        LIMIT 200
      `;
      const result = await runQuery(query, { searchTerm });

      const nodes = new Map<string, Node>();
      const links: Link[] = [];
      const newNodeTypes = new Set<string>();
      const newLinkTypes = new Set<string>();

      result.forEach((record: GraphRecord) => {
        const start = record.get('start') as Neo4jNode;
        const connected = record.get('connected') as Neo4jNode;
        const relationship = record.get('r') as Neo4jRelationship;

        [start, connected].forEach(node => {
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
          source: start.properties.id,
          target: connected.properties.id,
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
        d3VelocityDecay={0.1}
        d3Force={(forceName, force: any) => {
          switch (forceName) {
            case 'charge':
              (force as ForceManyBody<any>)
                .strength(FORCE_STRENGTH)
                .distanceMin(200)
                .distanceMax(600);
              break;
            case 'link':
              (force as ForceLink<any, any>)
                .distance(LINK_DISTANCE);
              break;
            case 'center':
              (force as ForceCenter<any>)
                .strength(CENTER_STRENGTH);
              break;
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const graphNode = node as unknown as GraphNode;
          if (typeof graphNode.x !== 'number' || typeof graphNode.y !== 'number') return;

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI);
          ctx.fillStyle = node.color || '#999';
          ctx.fill();

          // Draw darker blue border
          ctx.strokeStyle = NODE_BORDER_COLOR;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw node label with smaller font
          const label = node.properties?.id || node.label;
          if (!label) return;

          const fontSize = Math.min(NODE_R * 0.6, 10); // Adjusted for smaller nodes
          ctx.font = `${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000';
          
          // Adjusted text truncation for smaller nodes
          const maxLength = Math.floor(NODE_R * 2.5 / (fontSize * 0.6));
          const truncatedLabel = label.toString().length > maxLength 
            ? `${label.toString().slice(0, maxLength)}...`
            : label.toString();

          ctx.fillText(
            truncatedLabel,
            node.x,
            node.y
          );
        }}
      />
      {selectedNode && <NodeInfoPanel node={selectedNode} />}
    </div>
  );
}

export default Neo4jGraph;