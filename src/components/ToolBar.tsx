import React, { useState } from 'react';
import {
  Tool,
  BrushType,
  GridType,
  SculptTool,
} from '../types';
import {
  Paintbrush,
  Eraser,
  Slash,
  Square,
  Circle,
  Lasso,
  PaintBucket,
  Pipette,
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
} from 'lucide-react';

interface ToolBarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  onOpenColorPicker: () => void;
  brushType: BrushType;
  setBrushType: (t: BrushType) => void;
  onionSkin: boolean;
  setOnionSkin: (v: boolean) => void;
  onionSkinIntensity: number;
  setOnionSkinIntensity: (v: number) => void;
  width: number;
  setWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  shapeFilled: boolean;
  setShapeFilled: (v: boolean) => void;
  symmetry: boolean;
  setSymmetry: (v: boolean) => void;
  radialSymmetry: boolean;
  setRadialSymmetry: (v: boolean) => void;
  alphaLock: boolean;
  setAlphaLock: (v: boolean) => void;
  clippingMask: boolean;
  setClippingMask: (v: boolean) => void;
  canClipBelow: boolean;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  gridType: GridType;
  setGridType: (t: GridType) => void;
  gridSpacing: number;
  setGridSpacing: (s: number) => void;
  perspectivePoints: number;
  setPerspectivePoints: (n: number) => void;
  stabilization: number;
  setStabilization: (v: number) => void;
  streamline: number;
  setStreamline: (v: number) => void;
  deepBrushEngine: boolean;
  setDeepBrushEngine: (v: boolean) => void;
  quickShape: boolean;
  setQuickShape: (v: boolean) => void;
  weightPaintMode: boolean;
  setWeightPaintMode: (v: boolean) => void;
  weightRadius: number;
  setWeightRadius: (v: number) => void;
  weightStrength: number;
  setWeightStrength: (v: number) => void;
  sculptMode: boolean;
  setSculptMode: (v: boolean) => void;
  sculptTool: SculptTool;
  setSculptTool: (s: SculptTool) => void;
  sculptRadius: number;
  setSculptRadius: (v: number) => void;
  sculptStrength: number;
  setSculptStrength: (v: number) => void;
  spacing: number;
  setSpacing: (v: number) => void;
  taper: number;
  setTaper: (v: number) => void;
  pressureEnabled: boolean;
  setPressureEnabled: (v: boolean) => void;
}

const DEFAULT_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#F44336',
  '#FF9800',
  '#FFEB3B',
  '#4CAF50',
  '#00BCD4',
  '#2196F3',
  '#9C27B0',
  '#795548',
];

export const ToolBar: React.FC<ToolBarProps> = ({
  tool,
  setTool,
  brushColor,
  setBrushColor,
  onOpenColorPicker,
  brushType,
  setBrushType,
  onionSkin,
  setOnionSkin,
  onionSkinIntensity,
  setOnionSkinIntensity,
  width,
  setWidth,
  opacity,
  setOpacity,
  shapeFilled,
  setShapeFilled,
  symmetry,
  setSymmetry,
  radialSymmetry,
  setRadialSymmetry,
  alphaLock,
  setAlphaLock,
  clippingMask,
  setClippingMask,
  canClipBelow,
  showGrid,
  setShowGrid,
  gridType,
  setGridType,
  gridSpacing,
  setGridSpacing,
  perspectivePoints,
  setPerspectivePoints,
  stabilization,
  setStabilization,
  streamline,
  setStreamline,
  deepBrushEngine,
  setDeepBrushEngine,
  quickShape,
  setQuickShape,
  weightPaintMode,
  setWeightPaintMode,
  weightRadius,
  setWeightRadius,
  weightStrength,
  setWeightStrength,
  sculptMode,
  setSculptMode,
  sculptTool,
  setSculptTool,
  sculptRadius,
  setSculptRadius,
  sculptStrength,
  setSculptStrength,
  spacing,
  setSpacing,
  taper,
  setTaper,
  pressureEnabled,
  setPressureEnabled,
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'BRUSH', label: 'Brush', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'ERASER', label: 'Eraser', icon: <Eraser className="w-3.5 h-3.5" /> },
    { id: 'LINE', label: 'Line', icon: <Slash className="w-3.5 h-3.5" /> },
    { id: 'RECTANGLE', label: 'Rect', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'ELLIPSE', label: 'Ellipse', icon: <Circle className="w-3.5 h-3.5" /> },
    { id: 'SELECT', label: 'Lasso', icon: <Lasso className="w-3.5 h-3.5" /> },
    { id: 'FILL', label: 'Fill', icon: <PaintBucket className="w-3.5 h-3.5" /> },
    { id: 'EYEDROPPER', label: 'Eyedropper', icon: <Pipette className="w-3.5 h-3.5" /> },
  ];

  const brushTypes: BrushType[] = ['Pencil', 'Pen', 'Marker', 'Airbrush'];

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 select-none divide-y divide-zinc-800/60">
      {/* Row 1: Primary Tools, Color Picker trigger, Brush Types, Onion Skin */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 bg-zinc-950/60 p-0.5 rounded-lg border border-zinc-800 shrink-0">
          {tools.map((t) => {
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                id={`tool-${t.id.toLowerCase()}`}
                type="button"
                onClick={() => setTool(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          id="btn-open-color-picker"
          type="button"
          onClick={onOpenColorPicker}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md shrink-0 cursor-pointer"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-zinc-500 shrink-0"
            style={{ backgroundColor: brushColor }}
          />
          <span>Color Picker</span>
        </button>

        <div className="w-px h-5 bg-zinc-800 shrink-0 mx-0.5" />

        {/* Brush Type Chips */}
        <div className="flex items-center gap-1 shrink-0">
          {brushTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setBrushType(type)}
              className={`px-2 py-1 rounded-md text-xs cursor-pointer ${
                brushType === type
                  ? 'bg-zinc-700 text-white font-medium border border-zinc-600'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-800 shrink-0 mx-0.5" />

        {/* Onion Skin & Onion Skin Intensity Slider */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-onion-skin"
            type="button"
            onClick={() => setOnionSkin(!onionSkin)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 cursor-pointer transition-colors ${
              onionSkin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Onion Skinning Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Onion</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
              onionSkin
                ? 'bg-zinc-950/60 border-amber-500/30 text-amber-200'
                : 'bg-zinc-950/30 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <label
              htmlFor="slider-onion-skin-intensity"
              className="text-[11px] whitespace-nowrap cursor-pointer select-none font-medium"
            >
              Onion Skin Intensity: {Math.round(onionSkinIntensity * 100)}%
            </label>
            <input
              id="slider-onion-skin-intensity"
              aria-label="Onion Skin Intensity"
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={onionSkinIntensity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setOnionSkinIntensity(val);
                if (!onionSkin) setOnionSkin(true);
              }}
              className="w-20 sm:w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title={`Onion Skin Intensity: ${Math.round(onionSkinIntensity * 100)}%`}
            />
          </div>

          {onionSkin && (
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-zinc-400 pl-0.5 select-none">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span className="text-zinc-400">Prev</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-zinc-400">Next</span>
              </span>
            </div>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md ml-auto shrink-0 cursor-pointer ${
            showAdvanced
              ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Simple Controls' : 'Fine Tune'}</span>
        </button>
      </div>

      {/* Row 2: Sliders & Palette swatches */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 text-zinc-300">
        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 w-12 shrink-0">Size {Math.round(width)}</span>
          <input
            id="slider-brush-width"
            type="range"
            min="1"
            max="80"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
            className="w-24 sm:w-28 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 w-16 shrink-0">
            Opacity {Math.round(opacity * 100)}%
          </span>
          <input
            id="slider-brush-opacity"
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-24 sm:w-28 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1 hidden sm:block" />

        {/* Palette Swatches */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {DEFAULT_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBrushColor(c)}
              className={`w-5 h-5 rounded-full border cursor-pointer hover:scale-110 transition-transform ${
                brushColor.toLowerCase() === c.toLowerCase()
                  ? 'border-blue-400 scale-110 ring-2 ring-blue-500/40'
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1 hidden sm:block" />

        {/* Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setShapeFilled(!shapeFilled)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              shapeFilled
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Shape Fill
          </button>

          <button
            type="button"
            onClick={() => setSymmetry(!symmetry)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              symmetry
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mirror
          </button>

          <button
            type="button"
            onClick={() => setRadialSymmetry(!radialSymmetry)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              radialSymmetry
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Radial
          </button>

          <button
            type="button"
            onClick={() => setAlphaLock(!alphaLock)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              alphaLock
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alpha Lock
          </button>

          <button
            type="button"
            disabled={!canClipBelow}
            onClick={() => setClippingMask(!clippingMask)}
            className={`px-2 py-0.5 rounded text-xs disabled:opacity-30 cursor-pointer ${
              clippingMask
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Clip Below
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              showGrid
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Grid
          </button>

          <button
            type="button"
            onClick={() => setPressureEnabled(!pressureEnabled)}
            className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
              pressureEnabled
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pressure
          </button>
        </div>
      </div>

      {/* Grid Sub-row if Grid enabled */}
      {showGrid && (
        <div className="flex items-center gap-3 px-3 py-1 bg-zinc-950/40 text-xs overflow-x-auto">
          <span className="text-zinc-500 font-medium">Grid:</span>
          {(['2D', 'ISO', 'PERSPECTIVE'] as GridType[]).map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGridType(gt)}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                gridType === gt
                  ? 'bg-zinc-700 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {gt === 'PERSPECTIVE' ? 'Perspective' : gt === 'ISO' ? 'Isometric' : '2D'}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-zinc-400">Spacing {Math.round(gridSpacing)}</span>
            <input
              type="range"
              min="40"
              max="240"
              value={gridSpacing}
              onChange={(e) => setGridSpacing(parseFloat(e.target.value))}
              className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {gridType === 'PERSPECTIVE' && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-zinc-500">Points:</span>
              {[1, 2, 3].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setPerspectivePoints(pts)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    perspectivePoints === pts
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pts}P
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advanced Drawer: Smoothing, Sculpting, Rigging & Weight Paint */}
      {showAdvanced && (
        <div className="p-3 bg-zinc-950/70 border-t border-zinc-800/80 space-y-2.5">
          {/* Row A: Stabilizer & Streamline & Spacing & Taper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Stabilizer</span>
              <span className="text-zinc-200">{Math.round(stabilization * 100)}%</span>
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.01"
                value={stabilization}
                onChange={(e) => setStabilization(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded appearance-none accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Streamline</span>
              <span className="text-zinc-200">{Math.round(streamline * 100)}%</span>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.01"
                value={streamline}
                onChange={(e) => setStreamline(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded appearance-none accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Spacing</span>
              <span className="text-zinc-200">{Math.round(spacing * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.01"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded appearance-none accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Taper</span>
              <span className="text-zinc-200">{Math.round(taper * 100)}%</span>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.01"
                value={taper}
                onChange={(e) => setTaper(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded appearance-none accent-blue-500"
              />
            </div>
          </div>

          {/* Row B: Engine Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40">
            <button
              type="button"
              onClick={() => setDeepBrushEngine(!deepBrushEngine)}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                deepBrushEngine
                  ? 'bg-zinc-700 text-white font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Deep Brush Engine
            </button>

            <button
              type="button"
              onClick={() => setQuickShape(!quickShape)}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                quickShape
                  ? 'bg-zinc-700 text-white font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Quick Shape (Auto-straighten)
            </button>

            <button
              type="button"
              onClick={() => setWeightPaintMode(!weightPaintMode)}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                weightPaintMode
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Weight Paint Mode
            </button>

            <button
              type="button"
              onClick={() => setSculptMode(!sculptMode)}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                sculptMode
                  ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sculpt Mode
            </button>

            {sculptMode && (
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {(['Grab', 'Push', 'Smooth', 'Pinch', 'Thickness'] as SculptTool[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSculptTool(mode)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      sculptTool === mode
                        ? 'bg-pink-600 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row C: Weight & Sculpt Sliders if active */}
          {(weightPaintMode || sculptMode) && (
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
              {weightPaintMode && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Weight Radius: {Math.round(weightRadius)}</span>
                    <input
                      type="range"
                      min="40"
                      max="420"
                      value={weightRadius}
                      onChange={(e) => setWeightRadius(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-zinc-700 rounded appearance-none accent-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Strength: {Math.round(weightStrength * 100)}%</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={weightStrength}
                      onChange={(e) => setWeightStrength(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-zinc-700 rounded appearance-none accent-amber-500"
                    />
                  </div>
                </>
              )}

              {sculptMode && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Sculpt Radius: {Math.round(sculptRadius)}</span>
                    <input
                      type="range"
                      min="30"
                      max="360"
                      value={sculptRadius}
                      onChange={(e) => setSculptRadius(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-zinc-700 rounded appearance-none accent-pink-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Sculpt Strength: {Math.round(sculptStrength * 100)}%</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={sculptStrength}
                      onChange={(e) => setSculptStrength(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-zinc-700 rounded appearance-none accent-pink-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
