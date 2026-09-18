import React from 'react';
import { Frame, Offset } from '../types';
import {
  Play,
  Pause,
  Repeat,
  Plus,
  Copy,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Minimize,
  Maximize,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react';

interface TimelineBarProps {
  frameData: Frame[];
  frameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  playing: boolean;
  onTogglePlay: () => void;
  pingPong: boolean;
  onTogglePingPong: () => void;
  fps: number;
  onChangeFps: (fps: number) => void;
  onSetHold: (hold: number) => void;
  hasSelection: boolean;
  onTransformSelection: (scaleFactor: number, degrees: number, delta: Offset) => void;
  onClearSelection: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  frameData,
  frameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  playing,
  onTogglePlay,
  pingPong,
  onTogglePingPong,
  fps,
  onChangeFps,
  onSetHold,
  hasSelection,
  onTransformSelection,
  onClearSelection,
}) => {
  const currentHold = frameData[frameIndex]?.layers[0]?.hold ?? 1;

  return (
    <div
      id="timeline-bar"
      className="bg-zinc-900 border-t border-zinc-800 text-xs shrink-0 select-none divide-y divide-zinc-800/60"
    >
      {/* Row 1: Selection Transform HUD if strokes are selected */}
      {hasSelection && (
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-950/30 border-b border-blue-900/40 text-blue-200 overflow-x-auto">
          <span className="text-[11px] font-medium mr-1 text-blue-300">Transform:</span>
          <button
            type="button"
            onClick={() => onTransformSelection(1, 0, { x: -10, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Nudge Left"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onTransformSelection(1, 0, { x: 10, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Nudge Right"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onTransformSelection(0.9, 0, { x: 0, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Scale Down"
          >
            <Minimize className="w-3 h-3" /> Scale -
          </button>
          <button
            type="button"
            onClick={() => onTransformSelection(1.1, 0, { x: 0, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Scale Up"
          >
            <Maximize className="w-3 h-3" /> Scale +
          </button>
          <button
            type="button"
            onClick={() => onTransformSelection(1, -15, { x: 0, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Rotate Counter-Clockwise"
          >
            <RotateCcw className="w-3 h-3" /> -15°
          </button>
          <button
            type="button"
            onClick={() => onTransformSelection(1, 15, { x: 0, y: 0 })}
            className="px-2 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 rounded flex items-center gap-1 cursor-pointer"
            title="Rotate Clockwise"
          >
            <RotateCw className="w-3 h-3" /> +15°
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="px-2 py-0.5 ml-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-1 cursor-pointer"
            title="Clear Selection"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* Row 2: Playback & Timing Controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto">
        <button
          type="button"
          id="btn-play-pause"
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            playing
              ? 'bg-amber-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>

        <button
          type="button"
          onClick={onTogglePingPong}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs cursor-pointer ${
            pingPong
              ? 'bg-zinc-700 text-white border border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Ping-Pong</span>
        </button>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <span className="text-zinc-400 text-xs font-mono">FPS {fps}</span>
        <div className="flex items-center gap-1">
          {[8, 12, 24].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChangeFps(rate)}
              className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                fps === rate
                  ? 'bg-zinc-700 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {rate}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSetHold(currentHold + 1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
            title="Increase frame exposure / hold duration"
          >
            Hold+
          </button>
          <button
            type="button"
            onClick={() => onSetHold(1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
            title="Reset hold to 1"
          >
            Hold 1
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            id="btn-add-frame"
            onClick={onAddFrame}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer"
          >
            <Plus className="w-3 h-3 text-blue-400" />
            <span>+ Frame</span>
          </button>
          <button
            type="button"
            id="btn-duplicate-frame"
            onClick={onDuplicateFrame}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer"
          >
            <Copy className="w-3 h-3 text-zinc-400" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            id="btn-delete-frame"
            disabled={frameData.length <= 1}
            onClick={onDeleteFrame}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 rounded cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Row 3: Frames Timeline Strip */}
      <div className="p-2 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
        {frameData.map((frame, idx) => {
          const isActive = idx === frameIndex;
          const hasStrokes = frame.layers.some((l) => (l.strokes?.length || 0) > 0);
          const hold = frame.layers[0]?.hold ?? 1;

          return (
            <button
              key={idx}
              id={`frame-thumb-${idx}`}
              type="button"
              onClick={() => onSelectFrame(idx)}
              className={`w-14 h-13 shrink-0 rounded-lg p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500 shadow-xs ring-1 ring-blue-500/50 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="w-full flex justify-between items-center text-[10px]">
                <span className="font-semibold font-mono">F{idx + 1}</span>
                <span className={hasStrokes ? 'text-blue-400' : 'text-zinc-600'}>
                  {hasStrokes ? '●' : '○'}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">hold {hold}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
