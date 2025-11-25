
export interface FlowNode {
  id: string;
  label: string;
  shape?: 'rectangle' | 'diamond' | 'circle' | 'cylinder' | 'cloud' | 'parallelogram' | 'pill';
  color?: string; 
  // New Visual Properties
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  textAlign?: 'left' | 'center' | 'right';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface FlowEdge {
  source: string;
  target: string;
  label?: string;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  layoutDirection?: 'TB' | 'LR' | 'RL' | 'BT'; 
}

export interface GenerationStatus {
  step: 'idle' | 'analyzing' | 'layout' | 'complete' | 'error';
  message: string;
  progress?: number;
}

export interface NodePosition {
  x: number;
  y: number;
}
