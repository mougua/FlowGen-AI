
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const CustomNode = ({ data, sourcePosition = Position.Bottom, targetPosition = Position.Top }: NodeProps) => {
  // 1. Resolve Color Theme
  const colorMap: Record<string, { border: string, bg: string, text: string }> = {
    blue: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-900' },
    green: { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-900' },
    orange: { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900' },
    red: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-900' },
    purple: { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-900' },
    yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-900' },
    slate: { border: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-900' },
  };
  
  const theme = colorMap[data.color || 'slate'] || colorMap['slate'];

  // 2. Resolve Shape Styles
  const shape = data.shape || 'rectangle';
  let shapeClasses = `px-4 py-3 shadow-md border-2 min-w-[150px] min-h-[60px] flex flex-col items-center justify-center transition-transform hover:scale-105 ${theme.border} ${theme.bg}`;
  
  switch (shape) {
    case 'pill':
      shapeClasses += ' rounded-full';
      break;
    case 'circle':
      shapeClasses = `w-32 h-32 shadow-md border-2 flex flex-col items-center justify-center rounded-full aspect-square p-2 text-center hover:scale-105 ${theme.border} ${theme.bg}`;
      break;
    case 'diamond':
      // Using CSS trick for diamond or just specific styling
      shapeClasses += ' rounded-br-3xl rounded-tl-3xl rounded-tr-sm rounded-bl-sm'; 
      break;
    case 'parallelogram':
      shapeClasses += ' rounded-tr-2xl rounded-bl-2xl';
      break;
    case 'cloud':
      shapeClasses += ' rounded-[2rem] border-dashed';
      break;
    case 'cylinder':
      shapeClasses += ' rounded-xl border-b-4';
      break;
    default:
      shapeClasses += ' rounded-lg';
      break;
  }

  return (
    <div className={shapeClasses}>
      {/* Dynamic Target Handle (Input) */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" 
      />
      
      <div className={`text-sm font-bold text-center leading-snug break-words w-full px-1 ${theme.text}`}>
        {data.label}
      </div>
      
      {/* Dynamic Source Handle (Output) */}
      <Handle 
        type="source" 
        position={sourcePosition} 
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" 
      />
    </div>
  );
};

export default memo(CustomNode);
