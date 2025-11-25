
import React from 'react';
import { 
    Trash2, Square, Circle, Database, Cloud, Diamond, Activity, 
    AlignLeft, AlignCenter, AlignRight, MoveUp, MoveDown, BringToFront, SendToBack,
    Minus, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { Node, Edge } from 'reactflow';

interface PropertiesPanelProps {
  selectedElement: Node | Edge;
  type: 'node' | 'edge';
  onChange: (id: string, data: any) => void;
  onLayerChange?: (id: string, action: 'front' | 'back' | 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const SHAPES = [
  { id: 'rectangle', icon: Square, label: 'Box' },
  { id: 'pill', icon: Activity, label: 'Pill' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'cylinder', icon: Database, label: 'Db' },
  { id: 'cloud', icon: Cloud, label: 'Cloud' },
  { id: 'diamond', icon: Diamond, label: 'Diam' },
  { id: 'parallelogram', icon: Square, label: 'Para', className: '-skew-x-12' },
];

const COLORS = [
  { id: 'slate', bg: 'bg-slate-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'green', bg: 'bg-green-500' },
  { id: 'orange', bg: 'bg-orange-500' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'purple', bg: 'bg-purple-500' },
  { id: 'yellow', bg: 'bg-yellow-500' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  type,
  onChange,
  onLayerChange,
  onDelete,
  onClose
}) => {
  const isNode = type === 'node';
  const data = isNode ? selectedElement.data : { ...selectedElement.data, label: selectedElement.label };

  const update = (key: string, value: any) => {
      onChange(selectedElement.id, { [key]: value });
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          {isNode ? <Square size={16} /> : <ArrowRight size={16} />}
          {isNode ? 'Edit Node' : 'Edit Line'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-medium">
          Close
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        
        {/* Common: Label */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Label Text</label>
          <textarea
            value={data.label || ''}
            onChange={(e) => update('label', e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none min-h-[60px]"
            placeholder="Type text here..."
          />
        </div>

        {isNode && (
          <>
            {/* Shape Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shape</label>
              <div className="grid grid-cols-4 gap-2">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update('shape', s.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${
                      data.shape === s.id 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <s.icon size={18} className={`mb-1 ${s.className || ''}`} />
                    <span className="text-[9px] font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color Theme</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update('color', c.id)}
                    className={`w-6 h-6 rounded-full ${c.bg} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-1 ${
                      data.color === c.id ? 'ring-slate-800 scale-110' : 'ring-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Typography</label>
              <div className="flex gap-2">
                 <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button onClick={() => update('textAlign', 'left')} className={`p-1.5 rounded ${data.textAlign === 'left' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignLeft size={14}/></button>
                    <button onClick={() => update('textAlign', 'center')} className={`p-1.5 rounded ${!data.textAlign || data.textAlign === 'center' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignCenter size={14}/></button>
                    <button onClick={() => update('textAlign', 'right')} className={`p-1.5 rounded ${data.textAlign === 'right' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignRight size={14}/></button>
                 </div>
                 <select 
                    value={data.fontSize || 'base'} 
                    onChange={(e) => update('fontSize', e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-2 outline-none"
                 >
                     <option value="sm">Small</option>
                     <option value="base">Medium</option>
                     <option value="lg">Large</option>
                     <option value="xl">Extra Large</option>
                 </select>
              </div>
            </div>

            {/* Appearance (Border & Shadow) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appearance</label>
              <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Border</span>
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button title="Solid" onClick={() => update('borderStyle', 'solid')} className={`flex-1 flex justify-center p-1.5 rounded ${!data.borderStyle || data.borderStyle === 'solid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Minus size={14} /></button>
                        <button title="Dashed" onClick={() => update('borderStyle', 'dashed')} className={`flex-1 flex justify-center p-1.5 rounded ${data.borderStyle === 'dashed' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><MoreHorizontal size={14} /></button>
                        <button title="Dotted" onClick={() => update('borderStyle', 'dotted')} className={`flex-1 flex justify-center p-1.5 rounded ${data.borderStyle === 'dotted' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><MoreHorizontal size={14} className="opacity-50" /></button>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Shadow</span>
                    <select 
                        value={data.shadow || 'sm'} 
                        onChange={(e) => update('shadow', e.target.value)}
                        className="w-full h-[34px] bg-white border border-slate-200 rounded-lg text-xs px-2 outline-none"
                    >
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Huge</option>
                    </select>
                 </div>
              </div>
            </div>

            {/* Layering */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layering</label>
                <div className="flex gap-2">
                    <button onClick={() => onLayerChange?.(selectedElement.id, 'front')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                        <BringToFront size={12} /> Front
                    </button>
                    <button onClick={() => onLayerChange?.(selectedElement.id, 'back')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                        <SendToBack size={12} /> Back
                    </button>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => onLayerChange?.(selectedElement.id, 'up')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                        <MoveUp size={12} /> Up
                    </button>
                    <button onClick={() => onLayerChange?.(selectedElement.id, 'down')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                        <MoveDown size={12} /> Down
                    </button>
                </div>
            </div>
          </>
        )}

        {!isNode && (
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Style</label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Pattern</span>
                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                             <button onClick={() => update('strokeStyle', 'solid')} className={`flex-1 flex justify-center p-1.5 rounded ${!data.strokeStyle || data.strokeStyle === 'solid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Minus size={14} /></button>
                             <button onClick={() => update('strokeStyle', 'dashed')} className={`flex-1 flex justify-center p-1.5 rounded ${data.strokeStyle === 'dashed' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><MoreHorizontal size={14} /></button>
                        </div>
                    </div>
                     <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Animation</span>
                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                             <button onClick={() => update('animated', false)} className={`flex-1 flex justify-center p-1.5 rounded ${!data.animated ? 'bg-white shadow-sm' : 'text-slate-500'}`}><div className="w-3 h-3 border border-slate-400 rounded-sm"></div></button>
                             <button onClick={() => update('animated', true)} className={`flex-1 flex justify-center p-1.5 rounded ${data.animated ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Activity size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={() => onDelete(selectedElement.id)}
          className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Delete {isNode ? 'Node' : 'Connection'}
        </button>
      </div>
    </div>
  );
};
