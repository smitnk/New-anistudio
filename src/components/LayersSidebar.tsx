import React from 'react';
import { ArtLayer, Stroke } from '../types';
import { Eye, EyeOff, Plus, Trash2, Layers as LayersIcon } from 'lucide-react';

interface LayersSidebarProps {
  layers: ArtLayer[];
  selectedLayer: number;
  onSelectLayer: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  onAddLayer: () => void;
  onDeleteLayer: () => void;
  currentStrokes: Stroke[][];
  onUpdateLayerOpacity: (index: number, opacity: number) => void;
}

export const LayersSidebar: React.FC<LayersSidebarProps> = ({
  layers,
  selectedLayer,
  onSelectLayer,
  onToggleVisibility,
  onAddLayer,
  onDeleteLayer,
  currentStrokes,
  onUpdateLayerOpacity,
}) => {
  return (
    <aside
      id="layers-sidebar"
      className="w-44 sm:w-48 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 select-none text-xs"
    >
      <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
          <LayersIcon className="w-3.5 h-3.5 text-blue-400" />
          Layers
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-add-layer"
            onClick={onAddLayer}
            title="Add Layer"
            className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="btn-delete-layer"
            disabled={layers.length <= 1}
            onClick={onDeleteLayer}
            title="Delete Layer"
            className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 disabled:opacity-30 rounded cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
        {layers.map((layer, index) => {
          const isSelected = index === selectedLayer;
          const hasContent = (currentStrokes[index]?.length || 0) > 0;

          return (
            <div
              key={layer.id || index}
              onClick={() => onSelectLayer(index)}
              className={`p-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/15 border-l-2 border-blue-500 text-white'
                  : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(index);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-zinc-300" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{layer.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {hasContent ? 'Content' : 'Empty'}
                    </span>
                  </div>
                  {layer.clipToBelow && (
                    <span className="text-[9px] text-purple-400 block">↳ Clipped to below</span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div
                  className="mt-1.5 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Opacity {Math.round(layer.opacity * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) => onUpdateLayerOpacity(index, parseFloat(e.target.value))}
                    className="w-16 h-1 bg-zinc-700 rounded appearance-none accent-blue-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-2 border-t border-zinc-800 flex items-center justify-around text-zinc-400">
        <span className="text-[11px] text-zinc-500">
          {layers.length} {layers.length === 1 ? 'Layer' : 'Layers'}
        </span>
      </div>
    </aside>
  );
};
