
import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge,
  useNodesState, 
  useEdgesState, 
  ConnectionLineType,
  ReactFlowProvider,
  MarkerType,
  addEdge,
  Connection,
  Panel,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { 
  Wand2, 
  Loader2, 
  Layout,
  Film,
  FileCode,
  Zap,
  Plus,
  RefreshCw,
  Trash2,
  Sparkles
} from 'lucide-react';
import { toCanvas } from 'html-to-image';
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

import { generateFlowchartStructure, updateFlowchartStructure } from './services/geminiService';
import { getLayoutedElements } from './utils/layout';
import { downloadDrawioFile } from './utils/drawioExporter';
import { GenerationStatus, FlowData } from './types';
import CustomNode from './components/CustomNode';
import { PropertiesPanel } from './components/PropertiesPanel';

const nodeTypes = {
  custom: CustomNode,
};

// Internal component to access React Flow instance for exporting
const FlowCanvas = ({ 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onNodeClick, 
    onEdgeClick, 
    onPaneClick,
    onConnect,
    status,
    onAddNode
}: any) => {
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            attributionPosition="bottom-right"
            className="bg-slate-50/50"
            minZoom={0.1}
            defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#64748b', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 11 },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
                labelBgPadding: [8, 4],
                labelBgBorderRadius: 4,
            }}
        >
            <Background color="#cbd5e1" gap={24} size={1} />
            <Controls className="bg-white border border-slate-200 shadow-sm text-slate-600" />
            
            <Panel position="top-center" className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex gap-1">
                <button 
                    onClick={onAddNode}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md text-slate-600 text-xs font-semibold transition-colors"
                    title="Add a new node"
                >
                    <Plus size={14} />
                    Add Node
                </button>
            </Panel>

            {nodes.length === 0 && status.step === 'idle' && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center max-w-md p-8">
                       <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                           <Layout className="text-slate-300" size={32} />
                       </div>
                       <h3 className="text-lg font-semibold text-slate-700 mb-2">FlowGen AI</h3>
                       <p className="text-slate-500">
                         Describe any process, system, mind map, or org chart. I will build the layout and structure for you.
                       </p>
                   </div>
               </div>
           )}
        </ReactFlow>
    );
};

export function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle', message: '' });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  
  // Selection State
  const [selectedElement, setSelectedElement] = useState<{ id: string, type: 'node' | 'edge' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Standard React Flow change handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Helper to re-run layout
  const applyLayout = useCallback((direction: 'TB' | 'LR', currentNodes: Node[], currentEdges: any[]) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          currentNodes, 
          currentEdges, 
          direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setLayoutDirection(direction);
  }, [setNodes, setEdges]);

  // Handler for manual layout direction toggle
  const toggleLayoutDirection = () => {
      const newDirection = layoutDirection === 'TB' ? 'LR' : 'TB';
      applyLayout(newDirection, nodes, edges);
  };

  // Connection Handler
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
        ...params, 
        type: 'smoothstep', 
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
    }, eds));
  }, [setEdges]);

  // Add Node Handler
  const handleAddNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
        id: newNodeId,
        type: 'custom',
        position: { x: 100, y: 100 }, 
        style: { width: 160, height: 70 }, 
        data: { 
            id: newNodeId,
            label: 'New Node', 
            shape: 'rectangle', 
            color: 'slate',
            shadow: 'sm',
            textAlign: 'center'
        },
    };
    
    setNodes((nds) => {
        const lastNode = nds[nds.length - 1];
        if (lastNode) {
             newNode.position = { x: lastNode.position.x + 40, y: lastNode.position.y + 40 };
        }
        return [...nds, newNode];
    });
    setSelectedElement({ id: newNodeId, type: 'node' });
  }, [setNodes]);

  // Update Handlers
  const handleUpdateNode = (id: string, newData: any) => {
      setNodes((nds) => nds.map((node) => {
          if (node.id === id) {
              return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
      }));
  };

  const handleUpdateEdge = (id: string, newData: any) => {
      setEdges((eds) => eds.map((edge) => {
          if (edge.id === id) {
              const updatedEdge = { ...edge, data: { ...edge.data, ...newData } };
              if (newData.label !== undefined) updatedEdge.label = newData.label;
              if (newData.strokeStyle) {
                  updatedEdge.style = {
                      ...updatedEdge.style,
                      strokeDasharray: newData.strokeStyle === 'dashed' ? '5,5' : '0'
                  };
              }
              if (newData.animated !== undefined) {
                  updatedEdge.animated = newData.animated;
              }
              return updatedEdge;
          }
          return edge;
      }));
  };

  const handleLayerChange = (id: string, action: 'front' | 'back' | 'up' | 'down') => {
      setNodes((nds) => {
          const index = nds.findIndex((n) => n.id === id);
          if (index === -1) return nds;
          
          const newNodes = [...nds];
          const node = newNodes.splice(index, 1)[0];
          
          if (action === 'front') newNodes.push(node);
          else if (action === 'back') newNodes.unshift(node);
          else if (action === 'up') {
              if (index < newNodes.length) newNodes.splice(index + 1, 0, node);
              else newNodes.push(node);
          } else if (action === 'down') {
              if (index > 0) newNodes.splice(index - 1, 0, node);
              else newNodes.unshift(node);
          }
          return newNodes;
      });
  };

  const handleDeleteElement = (id: string) => {
      if (selectedElement?.type === 'node') {
          setNodes((nds) => nds.filter((n) => n.id !== id));
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      } else {
          setEdges((eds) => eds.filter((e) => e.id !== id));
      }
      setSelectedElement(null);
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedElement(null);
    setPrompt('');
    setStatus({ step: 'idle', message: '' });
  };

  const handleGenerateOrUpdate = async () => {
    if (!prompt.trim()) return;

    setSelectedElement(null);
    setStatus({ step: 'analyzing', message: nodes.length > 0 ? 'Updating diagram...' : 'Structuring diagram...' });

    try {
      let flowData: FlowData;

      if (nodes.length > 0) {
          // UPDATE MODE
          const currentData: FlowData = {
              nodes: nodes.map(n => ({
                  id: n.id,
                  label: n.data.label,
                  shape: n.data.shape,
                  color: n.data.color,
                  shadow: n.data.shadow,
                  borderStyle: n.data.borderStyle,
                  fontSize: n.data.fontSize,
                  textAlign: n.data.textAlign
              })),
              edges: edges.map(e => ({
                  source: e.source,
                  target: e.target,
                  label: e.label as string,
                  animated: e.animated,
                  style: e.style
              })),
              layoutDirection: layoutDirection
          };
          flowData = await updateFlowchartStructure(currentData, prompt);
      } else {
          // CREATE MODE
          flowData = await generateFlowchartStructure(prompt);
      }
      
      const newDirection = flowData.layoutDirection === 'LR' ? 'LR' : 'TB';
      
      const rfEdges = flowData.edges.map((edge) => ({
        id: `e${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep', 
        animated: edge.animated !== false, // Default to true if undefined
        style: { 
            stroke: '#64748b', 
            strokeWidth: 2,
            strokeDasharray: edge.style?.strokeDasharray
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
        },
        labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 11 }, 
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 }, 
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
      }));

      const rfNodes = flowData.nodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: { x: 0, y: 0 }, 
          // Default size logic
          style: { width: n.shape === 'circle' ? 128 : 160, height: n.shape === 'circle' ? 128 : 70 }, 
          data: { ...n, shadow: n.shadow || 'sm', textAlign: n.textAlign || 'center' }
      }));

      // Only run auto-layout if it's a new generation or major structure change
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          rfNodes, 
          rfEdges, 
          newDirection
      );
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setLayoutDirection(newDirection);

      setStatus({ step: 'complete', message: 'Diagram updated!' });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Unknown error occurred';
      setStatus({ step: 'error', message: `Error: ${errorMessage}` });
    }
  };

  const handleExportDrawio = () => {
      downloadDrawioFile(nodes, edges, `flowgen-diagram-${Date.now()}.drawio`);
  };

  const handleExportGif = async () => {
      setIsExporting(true);
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewport) {
          setIsExporting(false);
          return;
      }

      const originalEdges = [...edges];
      
      try {
          const encoder = new GIFEncoder();
          const frames = 15; 
          
          for (let i = 0; i < frames; i++) {
              setStatus({ step: 'complete', message: `Recording GIF frame ${i + 1}/${frames}...` });
              
              const offset = 20 - ((i / frames) * 20); 

              setEdges(eds => eds.map(e => ({
                  ...e,
                  animated: false, 
                  style: { 
                      ...e.style, 
                      strokeDasharray: '5',
                      strokeDashoffset: offset 
                  }
              })));

              await new Promise(r => setTimeout(r, 100));

              const canvas = await toCanvas(viewport, {
                  backgroundColor: '#f8fafc',
                  pixelRatio: 2.5, 
                  fontEmbedCSS: '', 
                  skipFonts: true, 
                  filter: (node) => {
                      if (node.tagName === 'LINK') return false;
                      return true;
                  }
              });

              const ctx = canvas.getContext('2d');
              if (ctx) {
                  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const palette = quantize(data, 256);
                  const index = applyPalette(data, palette);
                  encoder.writeFrame(index, width, height, { palette, delay: 100 });
              }
          }

          encoder.finish();
          const buffer = encoder.bytes();
          
          const blob = new Blob([buffer], { type: 'image/gif' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `flowgen-animated-${Date.now()}.gif`;
          a.click();
          
          setStatus({ step: 'complete', message: 'GIF Downloaded!' });

      } catch (err: any) {
          console.error("GIF Export failed", err);
          setStatus({ step: 'error', message: `GIF Error: ${err.message}` });
      } finally {
          setEdges(originalEdges);
          setIsExporting(false);
      }
  };

  const onNodeClick = useCallback((e: React.MouseEvent, node: Node) => {
      e.stopPropagation(); 
      setSelectedElement({ id: node.id, type: 'node' });
  }, []);

  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
      e.stopPropagation();
      setSelectedElement({ id: edge.id, type: 'edge' });
  }, []);

  const onPaneClick = useCallback(() => {
      setSelectedElement(null);
  }, []);

  const getSelectedItem = () => {
      if (!selectedElement) return null;
      if (selectedElement.type === 'node') {
          return nodes.find(n => n.id === selectedElement.id);
      }
      return edges.find(e => e.id === selectedElement.id);
  };

  const selectedItem = getSelectedItem();

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">FlowGen AI</h1>
            <p className="text-xs text-slate-500 font-medium">Smart Diagram Generator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {nodes.length > 0 && (
               <>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <button
                    onClick={toggleLayoutDirection}
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors text-sm font-medium"
                    title="Rotate Layout"
                >
                    <Layout size={16} />
                    {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
                </button>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={handleExportDrawio}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 hover:text-indigo-600 transition-all text-xs font-semibold disabled:opacity-50"
                    >
                        <FileCode size={14} />
                        XML
                    </button>
                    <div className="w-px bg-slate-300 my-1 mx-1"></div>
                    <button 
                        onClick={handleExportGif}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 hover:text-indigo-600 transition-all text-xs font-semibold disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                        GIF
                    </button>
                </div>
               </>
           )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-96 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-6 flex flex-col h-full gap-6">
                
                {selectedElement && selectedItem ? (
                    <PropertiesPanel 
                        selectedElement={selectedItem}
                        type={selectedElement.type}
                        onChange={selectedElement.type === 'node' ? handleUpdateNode : handleUpdateEdge}
                        onLayerChange={handleLayerChange}
                        onDelete={handleDeleteElement}
                        onClose={() => setSelectedElement(null)}
                    />
                ) : (
                    <>
                         {nodes.length > 0 && (
                            <button 
                                onClick={handleClearCanvas}
                                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors mb-2 border border-slate-200"
                            >
                                <RefreshCw size={14} />
                                Start New Diagram
                            </button>
                        )}

                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
                                <span>{nodes.length > 0 ? "Edit your diagram" : "Describe your diagram"}</span>
                                {nodes.length > 0 && <span className="text-xs text-indigo-500 font-normal">Editing Mode Active</span>}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={nodes.length > 0 
                                    ? "e.g., Change all blue nodes to red, or Add a 'Cache' node between Client and Server..."
                                    : "e.g., A system architecture with Client, API Gateway, and Microservices..."
                                }
                                className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-50 outline-none resize-none text-sm leading-relaxed"
                            />
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-start gap-3">
                                <Zap className="text-indigo-600 mt-1 shrink-0" size={18} />
                                <div className="space-y-1">
                                    <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
                                        AI Capabilities:
                                    </p>
                                    <ul className="text-xs text-indigo-800/80 list-disc pl-3 space-y-0.5">
                                        <li>Creates Flowcharts, Mind Maps, Org Charts.</li>
                                        <li>Edit Mode: "Make it a mind map", "Add step".</li>
                                        <li>Styles: "Make critical path red".</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateOrUpdate}
                            disabled={status.step === 'analyzing' || !prompt.trim()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {status.step === 'analyzing' ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                {nodes.length > 0 ? 'Updating...' : 'Generating...'}
                            </>
                            ) : (
                            <>
                                {nodes.length > 0 ? <Sparkles size={18} /> : <Wand2 size={18} />}
                                {nodes.length > 0 ? 'Update Diagram' : 'Generate Diagram'}
                            </>
                            )}
                        </button>

                        {status.step !== 'idle' && (
                            <div className="mt-auto pt-4">
                                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                                    <span>Status</span>
                                    <span>{status.step === 'complete' ? '100%' : '50%'}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className={`h-full bg-indigo-500 transition-all duration-500 ease-out ${status.step === 'error' ? 'bg-red-500' : ''}`}
                                        style={{ width: status.step === 'complete' ? '100%' : status.step === 'analyzing' ? '50%' : '0%' }}
                                    />
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-2 h-5 truncate">
                                    {status.message}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative bg-slate-50/50">
           <ReactFlowProvider>
                <FlowCanvas 
                    nodes={nodes} 
                    edges={edges} 
                    onNodesChange={onNodesChange} 
                    onEdgesChange={onEdgesChange} 
                    onNodeClick={onNodeClick} 
                    onEdgeClick={onEdgeClick} 
                    onPaneClick={onPaneClick}
                    onConnect={onConnect}
                    status={status}
                    onAddNode={handleAddNode}
                />
           </ReactFlowProvider>
        </main>
      </div>
    </div>
  );
}
