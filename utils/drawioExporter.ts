
import { Node, Edge } from 'reactflow';

// Helper to sanitize XML strings
const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Maps for maintaining visual consistency between Tailwind and Draw.io
const getColorStyle = (colorName: string = 'slate') => {
  const map: Record<string, { fill: string, stroke: string, font: string }> = {
     blue:   { fill: '#eff6ff', stroke: '#60a5fa', font: '#1e3a8a' }, // blue-50, blue-400, blue-900
     green:  { fill: '#f0fdf4', stroke: '#4ade80', font: '#14532d' }, // green-50, green-400, green-900
     orange: { fill: '#fff7ed', stroke: '#fb923c', font: '#7c2d12' },
     red:    { fill: '#fef2f2', stroke: '#f87171', font: '#7f1d1d' },
     purple: { fill: '#faf5ff', stroke: '#c084fc', font: '#581c87' },
     yellow: { fill: '#fefce8', stroke: '#facc15', font: '#713f12' },
     slate:  { fill: '#f8fafc', stroke: '#94a3b8', font: '#0f172a' },
  };
  return map[colorName] || map['slate'];
};

const getShapeStyle = (data: any) => {
    const shape = data.shape || 'rectangle';
    
    // Base style for all nodes
    let base = "whiteSpace=wrap;html=1;";
    
    // Shadow
    if (data.shadow && data.shadow !== 'none') {
        base += "shadow=1;";
    } else {
        base += "shadow=0;";
    }
    
    // Border Style
    if (data.borderStyle === 'dashed') {
        base += "dashed=1;";
    } else if (data.borderStyle === 'dotted') {
        base += "dashed=1;dashPattern=1 2;";
    }

    // Text Alignment
    if (data.textAlign === 'left') base += "align=left;";
    else if (data.textAlign === 'right') base += "align=right;";
    else base += "align=center;";

    // Font Size Mapping
    if (data.fontSize === 'sm') base += "fontSize=10;";
    else if (data.fontSize === 'lg') base += "fontSize=14;";
    else if (data.fontSize === 'xl') base += "fontSize=16;";
    else base += "fontSize=12;";

    switch (shape) {
        case 'pill':
            return base + "rounded=1;absoluteArcSize=1;arcSize=50;";
        case 'circle':
            return base + "ellipse;aspect=fixed;";
        case 'diamond':
            return base + "rhombus;";
        case 'parallelogram':
            return base + "shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;";
        case 'cloud':
            return base + "ellipse;shape=cloud;";
        case 'cylinder':
            return base + "shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;";
        case 'rectangle':
        default:
            return base + "rounded=1;absoluteArcSize=1;arcSize=10;";
    }
};

export const generateDrawioXml = (nodes: Node[], edges: Edge[]) => {
  const date = new Date().toISOString();
  
  let xml = `<mxfile host="FlowGenAI" modified="${date}" agent="Gemini" etag="flowgen" version="21.0.0">
  <diagram id="flowgen-diagram" name="Page-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`;

  // Add Nodes
  if (Array.isArray(nodes)) {
    nodes.forEach((node) => {
      const { x, y } = node.position;
      
      // Use explicit styles from resizing if available, else defaults
      const width = node.style?.width || (node.data.shape === 'circle' ? 128 : 160);
      const height = node.style?.height || (node.data.shape === 'circle' ? 128 : 70);

      const label = escapeXml(node.data.label || "");
      const color = node.data.color || 'slate';

      const colorStyle = getColorStyle(color);
      const shapeStyle = getShapeStyle(node.data);

      // Compose the full style string
      const fullStyle = `${shapeStyle}fillColor=${colorStyle.fill};strokeColor=${colorStyle.stroke};fontColor=${colorStyle.font};strokeWidth=2;fontStyle=1;`;
  
      xml += `
          <mxCell id="${node.id}" value="${label}" style="${fullStyle}" vertex="1" parent="1">
            <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />
          </mxCell>`;
    });
  }

  // Add Edges
  if (Array.isArray(edges)) {
    edges.forEach((edge) => {
      const label = edge.label ? escapeXml(edge.label as string) : '';
      
      // Determine style based on edge properties or defaults
      let style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;endArrow=block;endFill=1;fontSize=11;fontColor=#475569;labelBackgroundColor=#ffffff;";
      
      // Check custom styles
      if (edge.style?.strokeDasharray === '5,5') {
          style += "dashed=1;";
      }

      style += "strokeColor=#64748b;";
      
      xml += `
          <mxCell id="${edge.id}" value="${label}" style="${style}" edge="1" parent="1" source="${edge.source}" target="${edge.target}">
            <mxGeometry relative="1" as="geometry" />
          </mxCell>`;
    });
  }

  xml += `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
};

export const downloadDrawioFile = (nodes: Node[], edges: Edge[], filename = 'diagram.drawio') => {
  const xmlContent = generateDrawioXml(nodes, edges);
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
