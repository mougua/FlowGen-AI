
import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';
import { FlowData } from '../types';

const nodeWidth = 240; // Wider to prevent text wrapping issues
const nodeHeight = 160; 

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR' || direction === 'RL';
  
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ 
    rankdir: direction, 
    align: 'DL', // Keep Down-Left alignment
    nodesep: isHorizontal ? 80 : 100, // Horizontal separation between adjacent nodes
    ranksep: isHorizontal ? 150 : 120, // Vertical separation between ranks (layers)
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Calculate dynamic handle positions to ensure straight lines
    let targetPosition = isHorizontal ? Position.Left : Position.Top;
    let sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Adjust for Reverse directions if needed
    if (direction === 'RL') {
      targetPosition = Position.Right;
      sourcePosition = Position.Left;
    } else if (direction === 'BT') {
      targetPosition = Position.Bottom;
      sourcePosition = Position.Top;
    }

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
