import type { Definition, FlowEdge, FlowNode } from '../types/workflow';

export function normalizeDefinition(raw: Definition): Definition {
  const structure = (raw.Structure || raw.structure || {}) as any;
  const normalizedNodes: FlowNode[] = (structure.nodes || []).map((node: any, idx: number) => ({
    ...node,
    x: typeof node.x === 'number' ? node.x : 160 + idx * 180,
    y: typeof node.y === 'number' ? node.y : 120,
  }));
  const normalizedEdges: FlowEdge[] = (structure.edges || [])
    .map((edge: any) => ({
      ...edge,
      source: edge.source ?? edge.source_node,
      target: edge.target ?? edge.target_node,
    }))
    .filter((edge: FlowEdge) => !!edge.source && !!edge.target);

  return {
    ...raw,
    Structure: {
      ...structure,
      nodes: normalizedNodes,
      edges: normalizedEdges,
      viewport: structure.viewport || { x: 0, y: 0, zoom: 1 },
    },
  };
}
