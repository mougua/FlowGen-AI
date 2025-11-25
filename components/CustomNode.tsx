
import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

const CustomNode = ({ data, selected, sourcePosition = Position.Bottom, targetPosition = Position.Top }: NodeProps) => {
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
  
  // Base classes - use w-full h-full to fill the resized container
  let shapeClasses = `w-full h-full px-4 py-2 border-2 flex flex-col justify-center transition-all ${theme.bg}`;
  
  // Selection
  if (selected) {
    shapeClasses += ` ring-2 ring-indigo-500 ring-offset-2 border-indigo-500`;
  } else {
    shapeClasses += ` ${theme.border}`;
  }

  // Border Style
  if (data.borderStyle === 'dashed') shapeClasses += ' border-dashed';
  else if (data.borderStyle === 'dotted') shapeClasses += ' border-dotted';
  else shapeClasses += ' border-solid';

  // Shadow
  switch (data.shadow) {
      case 'sm': shapeClasses += ' shadow-sm'; break;
      case 'md': shapeClasses += ' shadow-md'; break;
      case 'lg': shapeClasses += ' shadow-lg'; break;
      case 'xl': shapeClasses += ' shadow-xl'; break;
      case 'none': default: shapeClasses += ' shadow-none'; break;
  }

  // Text Alignment
  let textClasses = `w-full leading-snug break-words ${theme.text} font-bold`;
  if (data.textAlign === 'left') textClasses += ' text-left';
  else if (data.textAlign === 'right') textClasses += ' text-right';
  else textClasses += ' text-center';

  // Font Size
  if (data.fontSize === 'sm') textClasses += ' text-xs';
  else if (data.fontSize === 'lg') textClasses += ' text-lg';
  else if (data.fontSize === 'xl') textClasses += ' text-xl';
  else textClasses += ' text-sm';

  // Shape Specific Border Radius
  switch (shape) {
    case 'pill':
      shapeClasses += ' rounded-full';
      break;
    case 'circle':
      shapeClasses += ' rounded-full'; 
      break;
    case 'diamond':
      shapeClasses += ' rounded-br-3xl rounded-tl-3xl rounded-tr-sm rounded-bl-sm'; 
      break;
    case 'parallelogram':
      shapeClasses += ' rounded-tr-2xl rounded-bl-2xl';
      break;
    case 'cloud':
      shapeClasses += ' rounded-[2rem]';
      break;
    case 'cylinder':
      shapeClasses += ' rounded-xl border-b-8'; 
      break;
    default:
      shapeClasses += ' rounded-lg';
      break;
  }

  return (
    <>
        <NodeResizer 
            isVisible={selected} 
            minWidth={80} 
            minHeight={40} 
            lineClassName="border-indigo-500" 
            handleClassName="h-2.5 w-2.5 bg-indigo-500 border-2 border-white rounded"
        />
        
        <div className={shapeClasses}>
            <Handle 
                type="target" 
                position={targetPosition} 
                className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity" 
            />
            
            <div className={textClasses}>
                {data.label}
            </div>
            
            <Handle 
                type="source" 
                position={sourcePosition} 
                className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity" 
            />
        </div>
    </>
  );
};

export default memo(CustomNode);
