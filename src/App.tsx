import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Offset,
  Tool,
  BrushType,
  GridType,
  SculptTool,
  ArtLayer,
  Frame,
  Stroke,
  PerspectiveGuideState,
} from './types';
import { TopBar } from './components/TopBar';
import { ToolBar } from './components/ToolBar';
import { LayersSidebar } from './components/LayersSidebar';
import { TimelineBar } from './components/TimelineBar';
import { CanvasStage } from './components/CanvasStage';
import { EditHud } from './components/EditHud';
import { ColorPickerModal } from './components/ColorPickerModal';
import { RasterBrushEngine } from './engines/RasterBrushEngine';
import { TransformGeometry } from './engines/TransformGeometry';
import { GifEncoder } from './utils/gifEncoder';

const RASTER_WIDTH = 1600;
const RASTER_HEIGHT = 1200;

interface Snapshot {
  layers: ArtLayer[];
  frameData: Frame[];
  frameIndex: number;
  rasterImageData: (ImageData | null)[];
}

export function App() {
  // --- LAYERS STATE ---
  const [layers, setLayers] = useState<ArtLayer[]>([
    { id: '1', name: 'Layer 1', visible: true, opacity: 1, clipToBelow: false },
    { id: '2', name: 'Layer 2', visible: true, opacity: 1, clipToBelow: false },
  ]);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);

  // Raster canvases for each layer
  const [rasterCanvases, setRasterCanvases] = useState<HTMLCanvasElement[]>(() => {
    return [createLayerCanvas(), createLayerCanvas()];
  });

  // --- ANIMATION & FRAMES STATE ---
  const [frameData, setFrameData] = useState<Frame[]>([
    {
      layers: [
        { hold: 1, strokes: [] },
        { hold: 1, strokes: [] },
      ],
    },
  ]);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [pingPong, setPingPong] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(12);
  const playDirection = useRef<number>(1);
  const holdCounter = useRef<number>(0);

  // --- TOOL & BRUSH STATE ---
  const [tool, setTool] = useState<Tool>('BRUSH');
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#000000',
    '#FFFFFF',
    '#F44336',
    '#2196F3',
    '#4CAF50',
  ]);
  const [brushType, setBrushType] = useState<BrushType>('Pen');
  const [onionSkin, setOnionSkin] = useState<boolean>(false);
  const [onionSkinIntensity, setOnionSkinIntensity] = useState<number>(0.35);
  const [width, setWidth] = useState<number>(12);
  const [opacity, setOpacity] = useState<number>(1);
  const [shapeFilled, setShapeFilled] = useState<boolean>(false);
  const [symmetry, setSymmetry] = useState<boolean>(false);
  const [radialSymmetry, setRadialSymmetry] = useState<boolean>(false);
  const [alphaLock, setAlphaLock] = useState<boolean>(false);
  const [clippingMask, setClippingMask] = useState<boolean>(false);
  const [pressureEnabled, setPressureEnabled] = useState<boolean>(true);

  // --- GRID & GUIDES ---
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [gridType, setGridType] = useState<GridType>('2D');
  const [gridSpacing, setGridSpacing] = useState<number>(80);
  const [perspectiveGuide, setPerspectiveGuide] = useState<PerspectiveGuideState>({
    horizonY: 600,
    vanishingPoints: [{ x: 800, y: -500 }],
    snapEnabled: false,
    perspectivePoints: 1,
  });

  // --- BRUSH ENGINES ---
  const [stabilization, setStabilization] = useState<number>(0);
  const [streamline, setStreamline] = useState<number>(0);
  const [spacing, setSpacing] = useState<number>(0);
  const [taper, setTaper] = useState<number>(0);
  const [deepBrushEngine, setDeepBrushEngine] = useState<boolean>(true);
  const [quickShape, setQuickShape] = useState<boolean>(true);

  // --- WEIGHT PAINT & SCULPT & RIG ---
  const [weightPaintMode, setWeightPaintMode] = useState<boolean>(false);
  const [weightJoints, setWeightJoints] = useState<Offset[]>([
    { x: 700, y: 600 },
    { x: 900, y: 600 },
  ]);
  const [weightJoint, setWeightJoint] = useState<number>(0);
  const [weightRadius, setWeightRadius] = useState<number>(140);
  const [weightStrength, setWeightStrength] = useState<number>(0.5);

  const [sculptMode, setSculptMode] = useState<boolean>(false);
  const [sculptTool, setSculptTool] = useState<SculptTool>('Push');
  const [sculptRadius, setSculptRadius] = useState<number>(120);
  const [sculptStrength, setSculptStrength] = useState<number>(0.35);

  const [rigMode, setRigMode] = useState<boolean>(false);
  const [rigJoints, setRigJoints] = useState<Offset[]>([
    { x: 800, y: 400 },
    { x: 800, y: 600 },
    { x: 800, y: 800 },
  ]);
  const [rigParents, setRigParents] = useState<number[]>([-1, 0, 1]);
  const [rigSelected, setRigSelected] = useState<number>(0);

  // --- SELECTION & NODE EDITING ---
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<number>>(new Set());
  const [editStrokeIndex, setEditStrokeIndex] = useState<number | null>(null);
  const [editNodeIndex, setEditNodeIndex] = useState<number>(0);
  const [nodeEditorMode, setNodeEditorMode] = useState<boolean>(false);
  const [bezierHandleMode, setBezierHandleMode] = useState<boolean>(false);

  // --- HISTORY (UNDO/REDO) ---
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);

  // --- UI DIALOGS & MESSAGES ---
  const [colorPickerOpen, setColorPickerOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Helper: push snapshot to undo
  const saveSnapshot = useCallback(() => {
    const rasterData = rasterCanvases.map((c) => {
      const ctx = c.getContext('2d');
      return ctx ? ctx.getImageData(0, 0, RASTER_WIDTH, RASTER_HEIGHT) : null;
    });

    const snapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      frameData: JSON.parse(JSON.stringify(frameData)),
      frameIndex,
      rasterImageData: rasterData,
    };

    setUndoStack((prev) => [...prev.slice(-30), snapshot]);
    setRedoStack([]);
  }, [layers, frameData, frameIndex, rasterCanvases]);

  // Handle Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];

    // Current state snapshot for redo
    const currentRaster = rasterCanvases.map((c) => {
      const ctx = c.getContext('2d');
      return ctx ? ctx.getImageData(0, 0, RASTER_WIDTH, RASTER_HEIGHT) : null;
    });
    const currentSnapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      frameData: JSON.parse(JSON.stringify(frameData)),
      frameIndex,
      rasterImageData: currentRaster,
    };
    setRedoStack((prev) => [...prev, currentSnapshot]);

    // Restore previous
    setLayers(previous.layers);
    setFrameData(previous.frameData);
    setFrameIndex(previous.frameIndex);

    // Restore raster canvases
    previous.rasterImageData.forEach((data, idx) => {
      const canvas = rasterCanvases[idx];
      if (canvas && data) {
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(data, 0, 0);
      }
    });

    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    showStatus('Undo');
  };

  // Handle Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];

    // Current state snapshot for undo
    const currentRaster = rasterCanvases.map((c) => {
      const ctx = c.getContext('2d');
      return ctx ? ctx.getImageData(0, 0, RASTER_WIDTH, RASTER_HEIGHT) : null;
    });
    const currentSnapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      frameData: JSON.parse(JSON.stringify(frameData)),
      frameIndex,
      rasterImageData: currentRaster,
    };
    setUndoStack((prev) => [...prev, currentSnapshot]);

    // Restore next
    setLayers(next.layers);
    setFrameData(next.frameData);
    setFrameIndex(next.frameIndex);

    next.rasterImageData.forEach((data, idx) => {
      const canvas = rasterCanvases[idx];
      if (canvas && data) {
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(data, 0, 0);
      }
    });

    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    showStatus('Redo');
  };

  // Animation Playback Loop
  useEffect(() => {
    if (!playing || frameData.length <= 1) return;

    const interval = setInterval(() => {
      const currentHold = frameData[frameIndex]?.layers[0]?.hold ?? 1;
      holdCounter.current += 1;

      if (holdCounter.current >= currentHold) {
        holdCounter.current = 0;
        setFrameIndex((current) => {
          let next = current + playDirection.current;
          if (pingPong) {
            if (next >= frameData.length) {
              playDirection.current = -1;
              next = Math.max(0, frameData.length - 2);
            } else if (next < 0) {
              playDirection.current = 1;
              next = Math.min(1, frameData.length - 1);
            }
          } else {
            if (next >= frameData.length) {
              next = 0;
            }
          }
          return next;
        });
      }
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [playing, frameData, frameIndex, fps, pingPong]);

  // Extract strokes for the active frame
  const currentStrokes = frameData[frameIndex]?.layers.map((l) => l.strokes || []) || [];

  // Add Stroke commit
  const handleCommitStroke = (stroke: Stroke, rasterUpdated: boolean) => {
    saveSnapshot();

    // Symmetry / Radial Symmetry strokes
    const strokesToAdd: Stroke[] = [stroke];

    if (symmetry && stroke.points.length > 0) {
      const flipped = TransformGeometry.flipHorizontal(stroke.points, RASTER_WIDTH / 2);
      strokesToAdd.push({ ...stroke, points: flipped });
    }

    if (radialSymmetry && stroke.points.length > 0) {
      const center = { x: RASTER_WIDTH / 2, y: RASTER_HEIGHT / 2 };
      for (let angle = 90; angle < 360; angle += 90) {
        strokesToAdd.push({
          ...stroke,
          points: TransformGeometry.rotate(stroke.points, center, angle),
        });
      }
    }

    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const layerStrokes = [...(curLayers[selectedLayer]?.strokes || [])];

      // If stroke is vector or shape
      if (tool !== 'BRUSH' && tool !== 'ERASER') {
        layerStrokes.push(...strokesToAdd);
      }

      curLayers[selectedLayer] = {
        ...curLayers[selectedLayer],
        strokes: layerStrokes,
      };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });

    // Make newly drawn shape editable immediately if Line, Rect, or Ellipse
    if (tool === 'LINE' || tool === 'RECTANGLE' || tool === 'ELLIPSE') {
      const layerStrokes = frameData[frameIndex]?.layers[selectedLayer]?.strokes || [];
      setEditStrokeIndex(layerStrokes.length);
      setSelectedStrokeIds(new Set([layerStrokes.length]));
    }
  };

  // Color picker color apply
  const handleApplyColor = (color: string) => {
    setBrushColor(color);
    if (!recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev.slice(0, 9)]);
    }
  };

  // Eyedropper color sampling
  const handleSampleColor = (point: Offset) => {
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    if (x < 0 || x >= RASTER_WIDTH || y < 0 || y >= RASTER_HEIGHT) return;

    // Sample from active raster layer
    const canvas = rasterCanvases[selectedLayer];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] > 0) {
          const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1]
            .toString(16)
            .padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
          handleApplyColor(hex);
          showStatus(`Sampled ${hex}`);
          setTool('BRUSH');
          return;
        }
      }
    }

    // Otherwise sample from vector strokes
    const strokes = currentStrokes[selectedLayer] || [];
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      for (const p of s.points) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy <= (s.width * s.width) / 4) {
          handleApplyColor(s.color);
          showStatus(`Sampled ${s.color}`);
          setTool('BRUSH');
          return;
        }
      }
    }
  };

  // Flood fill
  const handleFloodFill = (point: Offset) => {
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    const canvas = rasterCanvases[selectedLayer];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveSnapshot();

    // Parse hex to rgba
    const num = parseInt(brushColor.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const a = Math.round(opacity * 255);

    RasterBrushEngine.floodFill(ctx, RASTER_WIDTH, RASTER_HEIGHT, x, y, [r, g, b, a], 16);
    showStatus('Flood filled');
  };

  // Lasso selection
  const handleSelectLasso = (polygon: Offset[]) => {
    const strokes = currentStrokes[selectedLayer] || [];
    const selected = new Set<number>();

    strokes.forEach((s, idx) => {
      if (s.points.some((p) => RasterBrushEngine.pointInPolygon(p, polygon))) {
        selected.add(idx);
      }
    });

    setSelectedStrokeIds(selected);
    if (selected.size > 0) {
      const firstSelected = Array.from(selected)[0];
      setEditStrokeIndex(firstSelected);
      showStatus(`Selected ${selected.size} strokes`);
    } else {
      setEditStrokeIndex(null);
    }
  };

  // Transform selection (Nudge, Scale, Rotate)
  const handleTransformSelection = (scaleFactor: number, degrees: number, delta: Offset) => {
    if (selectedStrokeIds.size === 0) return;
    saveSnapshot();

    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];

      // Calculate center of selection
      const allSelectedPoints: Offset[] = [];
      selectedStrokeIds.forEach((id) => {
        if (strokes[id]) allSelectedPoints.push(...strokes[id].points);
      });
      const bounds = TransformGeometry.bounds(allSelectedPoints);
      const center = bounds ? bounds.center : { x: RASTER_WIDTH / 2, y: RASTER_HEIGHT / 2 };

      selectedStrokeIds.forEach((id) => {
        const s = strokes[id];
        if (!s) return;
        let pts = s.points;
        if (delta.x !== 0 || delta.y !== 0) {
          pts = TransformGeometry.move(pts, delta);
        }
        if (scaleFactor !== 1) {
          pts = TransformGeometry.scale(pts, center, scaleFactor, scaleFactor);
        }
        if (degrees !== 0) {
          pts = TransformGeometry.rotate(pts, center, degrees);
        }
        strokes[id] = { ...s, points: pts };
      });

      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
  };

  // Node & Bezier editing operations
  const handleMoveNode = (nodeIdx: number, newPoint: Offset) => {
    if (editStrokeIndex === null) return;
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke) return prev;

      const pts = [...stroke.points];
      pts[nodeIdx] = newPoint;
      strokes[editStrokeIndex] = { ...stroke, points: pts };

      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
  };

  const handleMoveBezierHandle = (point: Offset, side: 'in' | 'out') => {
    if (editStrokeIndex === null) return;
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke) return prev;

      const base = stroke.points[editNodeIndex];
      if (!base) return prev;
      const delta = { x: point.x - base.x, y: point.y - base.y };

      const inHandles = stroke.inHandles ? [...stroke.inHandles] : stroke.points.map(() => ({ x: 0, y: 0 }));
      const outHandles = stroke.outHandles ? [...stroke.outHandles] : stroke.points.map(() => ({ x: 0, y: 0 }));

      if (side === 'out') {
        outHandles[editNodeIndex] = delta;
        inHandles[editNodeIndex] = { x: -delta.x, y: -delta.y };
      } else {
        inHandles[editNodeIndex] = delta;
        outHandles[editNodeIndex] = { x: -delta.x, y: -delta.y };
      }

      strokes[editStrokeIndex] = { ...stroke, inHandles, outHandles };
      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
  };

  const handleAddNode = () => {
    if (editStrokeIndex === null) return;
    saveSnapshot();
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke || stroke.points.length < 2) return prev;

      const pts = [...stroke.points];
      const n1 = pts[editNodeIndex];
      const n2 = pts[(editNodeIndex + 1) % pts.length];
      const mid = { x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 };
      pts.splice(editNodeIndex + 1, 0, mid);

      strokes[editStrokeIndex] = { ...stroke, points: pts };
      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
    showStatus('Added node');
  };

  const handleDeleteNode = () => {
    if (editStrokeIndex === null) return;
    saveSnapshot();
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke || stroke.points.length <= 2) return prev;

      const pts = stroke.points.filter((_, idx) => idx !== editNodeIndex);
      strokes[editStrokeIndex] = { ...stroke, points: pts };

      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
    setEditNodeIndex(0);
    showStatus('Deleted node');
  };

  const handleRespaceNodes = () => {
    if (editStrokeIndex === null) return;
    saveSnapshot();
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke || stroke.points.length < 3) return prev;

      // Respace along polyline
      const pts = stroke.points;
      const count = pts.length;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const respaced: Offset[] = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        respaced.push({
          x: first.x + (last.x - first.x) * t,
          y: first.y + (last.y - first.y) * t,
        });
      }

      strokes[editStrokeIndex] = { ...stroke, points: respaced };
      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
    showStatus('Respaced nodes');
  };

  // Weight paint pose
  const handlePoseWeightJoint = (point: Offset) => {
    if (editStrokeIndex === null) return;
    const stroke = currentStrokes[selectedLayer]?.[editStrokeIndex];
    if (!stroke) return;

    setWeightJoints((prev) => {
      const next = [...prev];
      next[weightJoint] = point;
      return next;
    });

    const targetJoint = weightJoints[weightJoint];
    const dx = point.x - targetJoint.x;
    const dy = point.y - targetJoint.y;

    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const curStroke = strokes[editStrokeIndex];
      if (!curStroke) return prev;

      const pts = curStroke.points.map((p) => {
        const dist = Math.sqrt((p.x - targetJoint.x) ** 2 + (p.y - targetJoint.y) ** 2);
        const influence = Math.max(0, 1 - dist / weightRadius) * weightStrength;
        return {
          x: p.x + dx * influence,
          y: p.y + dy * influence,
        };
      });

      strokes[editStrokeIndex] = { ...curStroke, points: pts };
      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
  };

  // Sculpt mode drag
  const handleSculptStroke = (point: Offset, delta: Offset) => {
    if (editStrokeIndex === null) return;
    setFrameData((prev) => {
      const next = [...prev];
      const curFrame = { ...next[frameIndex] };
      const curLayers = [...curFrame.layers];
      const strokes = [...(curLayers[selectedLayer]?.strokes || [])];
      const stroke = strokes[editStrokeIndex];
      if (!stroke) return prev;

      const pts = stroke.points.map((p) => {
        const dist = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
        if (dist > sculptRadius) return p;
        const influence = (1 - dist / sculptRadius) * sculptStrength;

        switch (sculptTool) {
          case 'Grab':
          case 'Push':
            return { x: p.x + delta.x * influence, y: p.y + delta.y * influence };
          case 'Pinch': {
            const dirX = point.x - p.x;
            const dirY = point.y - p.y;
            return { x: p.x + dirX * influence * 0.3, y: p.y + dirY * influence * 0.3 };
          }
          case 'Smooth': {
            const mid = { x: (p.x + point.x) / 2, y: (p.y + point.y) / 2 };
            return { x: p.x + (mid.x - p.x) * influence, y: p.y + (mid.y - p.y) * influence };
          }
          default:
            return p;
        }
      });

      strokes[editStrokeIndex] = { ...stroke, points: pts };
      curLayers[selectedLayer] = { ...curLayers[selectedLayer], strokes };
      curFrame.layers = curLayers;
      next[frameIndex] = curFrame;
      return next;
    });
  };

  // Rigging joint move
  const handleMoveRigJoint = (jointIndex: number, point: Offset) => {
    setRigJoints((prev) => {
      const next = [...prev];
      next[jointIndex] = point;
      return next;
    });
    setRigSelected(jointIndex);
  };

  // --- FRAME ACTIONS ---
  const handleAddFrame = () => {
    saveSnapshot();
    const newFrame: Frame = {
      layers: layers.map(() => ({ hold: 1, strokes: [] })),
    };
    setFrameData((prev) => [...prev, newFrame]);
    setFrameIndex(frameData.length);
    showStatus(`Frame ${frameData.length + 1} added`);
  };

  const handleDuplicateFrame = () => {
    saveSnapshot();
    const current = frameData[frameIndex];
    const dup: Frame = JSON.parse(JSON.stringify(current));
    setFrameData((prev) => [
      ...prev.slice(0, frameIndex + 1),
      dup,
      ...prev.slice(frameIndex + 1),
    ]);
    setFrameIndex(frameIndex + 1);
    showStatus(`Frame ${frameIndex + 1} duplicated`);
  };

  const handleDeleteFrame = () => {
    if (frameData.length <= 1) return;
    saveSnapshot();
    setFrameData((prev) => prev.filter((_, idx) => idx !== frameIndex));
    setFrameIndex((current) => Math.max(0, current - 1));
    showStatus('Frame deleted');
  };

  const handleSetHold = (hold: number) => {
    setFrameData((prev) => {
      const next = [...prev];
      const cur = { ...next[frameIndex] };
      cur.layers = cur.layers.map((l) => ({ ...l, hold: Math.max(1, hold) }));
      next[frameIndex] = cur;
      return next;
    });
    showStatus(`Hold set to ${hold}`);
  };

  // --- LAYER ACTIONS ---
  const handleAddLayer = () => {
    saveSnapshot();
    const newId = layers.length + 1;
    const newLayer: ArtLayer = {
      id: String(newId),
      name: `Layer ${newId}`,
      visible: true,
      opacity: 1,
      clipToBelow: false,
    };
    setLayers((prev) => [...prev, newLayer]);
    setRasterCanvases((prev) => [...prev, createLayerCanvas()]);
    setFrameData((prev) =>
      prev.map((f) => ({
        ...f,
        layers: [...f.layers, { hold: 1, strokes: [] }],
      }))
    );
    setSelectedLayer(layers.length);
    showStatus(`Layer ${newId} created`);
  };

  const handleDeleteLayer = () => {
    if (layers.length <= 1) return;
    saveSnapshot();
    const target = selectedLayer;
    setLayers((prev) => prev.filter((_, idx) => idx !== target));
    setRasterCanvases((prev) => prev.filter((_, idx) => idx !== target));
    setFrameData((prev) =>
      prev.map((f) => ({
        ...f,
        layers: f.layers.filter((_, idx) => idx !== target),
      }))
    );
    setSelectedLayer((cur) => Math.max(0, cur - 1));
    showStatus('Layer deleted');
  };

  const handleToggleLayerVisibility = (index: number) => {
    setLayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], visible: !next[index].visible };
      return next;
    });
  };

  const handleUpdateLayerOpacity = (index: number, op: number) => {
    setLayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], opacity: op };
      return next;
    });
  };

  // --- EXPORT & SAVE ---
  const handleExportPng = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = RASTER_WIDTH;
    exportCanvas.height = RASTER_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Background white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, RASTER_WIDTH, RASTER_HEIGHT);

    // Draw visible raster layers
    layers.forEach((l, idx) => {
      if (!l.visible) return;
      const c = rasterCanvases[idx];
      if (c) {
        ctx.globalAlpha = l.opacity;
        ctx.drawImage(c, 0, 0);
      }
    });

    // Draw vector strokes
    currentStrokes.forEach((strokes, lIdx) => {
      const l = layers[lIdx];
      if (!l?.visible) return;
      ctx.globalAlpha = l.opacity;
      strokes.forEach((s) => {
        renderVectorStroke(ctx, s);
      });
    });

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `motioncanvas_frame_${frameIndex + 1}.png`);
      showStatus('PNG exported!');
    }, 'image/png');
  };

  const handleExportGif = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showStatus('Encoding GIF frames...');

    try {
      // Create offscreen canvas for rendering frames
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = RASTER_WIDTH;
      renderCanvas.height = RASTER_HEIGHT;
      const ctx = renderCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Cannot get 2d context');

      const encoder = new GifEncoder(RASTER_WIDTH, RASTER_HEIGHT);

      for (let i = 0; i < frameData.length; i++) {
        const frame = frameData[i];
        const hold = frame.layers[0]?.hold ?? 1;
        const delayMs = (1000 / fps) * hold;

        // Render frame onto renderCanvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, RASTER_WIDTH, RASTER_HEIGHT);

        // Raster layers
        layers.forEach((l, idx) => {
          if (!l.visible) return;
          const c = rasterCanvases[idx];
          if (c) {
            ctx.globalAlpha = l.opacity;
            ctx.drawImage(c, 0, 0);
          }
        });

        // Vector strokes
        frame.layers.forEach((lf, lIdx) => {
          const l = layers[lIdx];
          if (!l?.visible) return;
          ctx.globalAlpha = l.opacity;
          lf.strokes?.forEach((s) => {
            renderVectorStroke(ctx, s);
          });
        });

        encoder.addFrame(ctx, delayMs);
      }

      const gifBytes = encoder.finish();
      const gifBlob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });
      downloadBlob(gifBlob, 'motioncanvas_animation.gif');
      showStatus('GIF animation exported!');
    } catch (err) {
      console.error('GIF export failed', err);
      showStatus('GIF export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Save Project as .motioncanvas ZIP
  const handleSaveProject = async () => {
    showStatus('Packaging project...');
    const zip = new JSZip();

    // Serialize project manifest
    const projectManifest = {
      version: 1,
      rasterWidth: RASTER_WIDTH,
      rasterHeight: RASTER_HEIGHT,
      layers,
      frameData,
      fps,
      gridType,
      gridSpacing,
      perspectiveGuide,
    };
    zip.file('project.json', JSON.stringify(projectManifest, null, 2));

    // Save raster layer PNGs
    const rasterFolder = zip.folder('raster');
    for (let i = 0; i < rasterCanvases.length; i++) {
      const c = rasterCanvases[i];
      const dataUrl = c.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      rasterFolder?.file(`layer_${i}.png`, base64Data, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'animation_project.motioncanvas');
    showStatus('Project saved (.motioncanvas)');
  };

  // Load Project from .motioncanvas ZIP or JSON
  const handleLoadProject = async (file: File) => {
    try {
      showStatus('Loading project...');
      const zip = await JSZip.loadAsync(file);
      const projectFile = zip.file('project.json');
      if (!projectFile) {
        showStatus('Invalid project file: missing project.json');
        return;
      }

      const jsonStr = await projectFile.async('text');
      const manifest = JSON.parse(jsonStr);

      setLayers(manifest.layers || []);
      setFrameData(manifest.frameData || []);
      setFps(manifest.fps || 12);
      setFrameIndex(0);
      if (manifest.gridType) setGridType(manifest.gridType);
      if (manifest.gridSpacing) setGridSpacing(manifest.gridSpacing);
      if (manifest.perspectiveGuide) setPerspectiveGuide(manifest.perspectiveGuide);

      // Recreate and load raster canvases
      const newCanvases: HTMLCanvasElement[] = [];
      const layerCount = manifest.layers?.length || 1;

      for (let i = 0; i < layerCount; i++) {
        const c = createLayerCanvas();
        const pngFile = zip.file(`raster/layer_${i}.png`);
        if (pngFile) {
          const imgBlob = await pngFile.async('blob');
          const imgBitmap = await createImageBitmap(imgBlob);
          const ctx = c.getContext('2d');
          ctx?.drawImage(imgBitmap, 0, 0);
        }
        newCanvases.push(c);
      }

      setRasterCanvases(newCanvases);
      setSelectedLayer(0);
      showStatus('Project loaded successfully!');
    } catch (err) {
      console.error('Failed to load project', err);
      showStatus('Failed to load project');
    }
  };

  // Shape label for EditHud
  const editShapeLabel = ((): string => {
    if (editStrokeIndex === null) return 'Edit Shape';
    const stroke = currentStrokes[selectedLayer]?.[editStrokeIndex];
    if (!stroke) return 'Edit Shape';
    if (stroke.closed) return 'Edit Shape';
    if (stroke.points.length === 2) return 'Edit Line';
    return 'Edit Arc';
  })();

  return (
    <div id="motioncanvas-root" className="flex flex-col w-screen h-screen bg-zinc-950 overflow-hidden font-sans">
      {/* Top Bar: Title, Project Save/Load, Export PNG/GIF, Undo/Redo */}
      <TopBar
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onExportPng={handleExportPng}
        onExportGif={handleExportGif}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        statusMessage={statusMessage}
        isExporting={isExporting}
      />

      {/* Tool Bar: Tools, Brushes, Sliders, Symmetry, Grid, Rigging */}
      <ToolBar
        tool={tool}
        setTool={setTool}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        onOpenColorPicker={() => setColorPickerOpen(true)}
        brushType={brushType}
        setBrushType={setBrushType}
        onionSkin={onionSkin}
        setOnionSkin={setOnionSkin}
        onionSkinIntensity={onionSkinIntensity}
        setOnionSkinIntensity={setOnionSkinIntensity}
        width={width}
        setWidth={setWidth}
        opacity={opacity}
        setOpacity={setOpacity}
        shapeFilled={shapeFilled}
        setShapeFilled={setShapeFilled}
        symmetry={symmetry}
        setSymmetry={setSymmetry}
        radialSymmetry={radialSymmetry}
        setRadialSymmetry={setRadialSymmetry}
        alphaLock={alphaLock}
        setAlphaLock={setAlphaLock}
        clippingMask={clippingMask}
        setClippingMask={(v) => {
          setClippingMask(v);
          setLayers((prev) => {
            const next = [...prev];
            next[selectedLayer] = { ...next[selectedLayer], clipToBelow: v };
            return next;
          });
        }}
        canClipBelow={selectedLayer > 0}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        gridType={gridType}
        setGridType={setGridType}
        gridSpacing={gridSpacing}
        setGridSpacing={setGridSpacing}
        perspectivePoints={perspectiveGuide.perspectivePoints}
        setPerspectivePoints={(pts) =>
          setPerspectiveGuide((prev) => ({ ...prev, perspectivePoints: pts }))
        }
        stabilization={stabilization}
        setStabilization={setStabilization}
        streamline={streamline}
        setStreamline={setStreamline}
        deepBrushEngine={deepBrushEngine}
        setDeepBrushEngine={setDeepBrushEngine}
        quickShape={quickShape}
        setQuickShape={setQuickShape}
        weightPaintMode={weightPaintMode}
        setWeightPaintMode={setWeightPaintMode}
        weightRadius={weightRadius}
        setWeightRadius={setWeightRadius}
        weightStrength={weightStrength}
        setWeightStrength={setWeightStrength}
        sculptMode={sculptMode}
        setSculptMode={setSculptMode}
        sculptTool={sculptTool}
        setSculptTool={setSculptTool}
        sculptRadius={sculptRadius}
        setSculptRadius={setSculptRadius}
        sculptStrength={sculptStrength}
        setSculptStrength={setSculptStrength}
        spacing={spacing}
        setSpacing={setSpacing}
        taper={taper}
        setTaper={setTaper}
        pressureEnabled={pressureEnabled}
        setPressureEnabled={setPressureEnabled}
      />

      {/* Main Canvas Viewport & Layers Sidebar */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Floating Edit HUD if stroke/shape is being edited */}
        {editStrokeIndex !== null && (
          <EditHud
            editShapeLabel={editShapeLabel}
            weightPaintMode={weightPaintMode}
            onToggleWeightPaint={() => setWeightPaintMode(!weightPaintMode)}
            rigMode={rigMode}
            onToggleRigMode={() => setRigMode(!rigMode)}
            onResetRig={() => {
              setRigJoints([
                { x: 800, y: 400 },
                { x: 800, y: 600 },
                { x: 800, y: 800 },
              ]);
              setRigParents([-1, 0, 1]);
              setRigSelected(0);
            }}
            onAddRigJoint={() => {
              const last = rigJoints[rigJoints.length - 1];
              setRigJoints((prev) => [...prev, { x: last.x, y: last.y + 120 }]);
              setRigParents((prev) => [...prev, prev.length - 1]);
              setRigSelected(rigJoints.length);
            }}
            nodeEditorMode={nodeEditorMode}
            onToggleNodeEditor={() => setNodeEditorMode(!nodeEditorMode)}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
            onRespaceNodes={handleRespaceNodes}
            bezierHandleMode={bezierHandleMode}
            onToggleBezier={() => setBezierHandleMode(!bezierHandleMode)}
            canDeleteNode={
              (currentStrokes[selectedLayer]?.[editStrokeIndex]?.points.length || 0) > 2
            }
            sculptMode={sculptMode}
            onFinishEditing={() => {
              setEditStrokeIndex(null);
              setSelectedStrokeIds(new Set());
              setNodeEditorMode(false);
              setBezierHandleMode(false);
            }}
          />
        )}

        {/* Stage Canvas */}
        <CanvasStage
          rasterWidth={RASTER_WIDTH}
          rasterHeight={RASTER_HEIGHT}
          layers={layers}
          selectedLayer={selectedLayer}
          frameData={frameData}
          frameIndex={frameIndex}
          rasterCanvases={rasterCanvases}
          tool={tool}
          brushColor={brushColor}
          brushWidth={width}
          brushOpacity={opacity}
          brushType={brushType}
          shapeFilled={shapeFilled}
          pressureEnabled={pressureEnabled}
          stabilization={stabilization}
          streamline={streamline}
          spacing={spacing}
          taper={taper}
          quickShape={quickShape}
          deepBrushEngine={deepBrushEngine}
          alphaLock={alphaLock}
          clippingMask={clippingMask}
          onionSkin={onionSkin}
          onionSkinIntensity={onionSkinIntensity}
          showGrid={showGrid}
          gridType={gridType}
          gridSpacing={gridSpacing}
          perspectiveGuide={perspectiveGuide}
          currentStrokes={currentStrokes}
          selectedStrokeIds={selectedStrokeIds}
          editStrokeIndex={editStrokeIndex}
          editNodeIndex={editNodeIndex}
          nodeEditorMode={nodeEditorMode}
          bezierHandleMode={bezierHandleMode}
          weightPaintMode={weightPaintMode}
          weightJoints={weightJoints}
          weightJoint={weightJoint}
          weightRadius={weightRadius}
          weightStrength={weightStrength}
          rigMode={rigMode}
          rigJoints={rigJoints}
          rigParents={rigParents}
          rigSelected={rigSelected}
          sculptMode={sculptMode}
          sculptTool={sculptTool}
          sculptRadius={sculptRadius}
          sculptStrength={sculptStrength}
          onCommitStroke={handleCommitStroke}
          onFloodFill={handleFloodFill}
          onSampleColor={handleSampleColor}
          onSelectLasso={handleSelectLasso}
          onSelectNode={(nodeIdx) => setEditNodeIndex(nodeIdx)}
          onMoveNode={handleMoveNode}
          onMoveBezierHandle={handleMoveBezierHandle}
          onPoseWeightJoint={handlePoseWeightJoint}
          onMoveRigJoint={handleMoveRigJoint}
          onSculptStroke={handleSculptStroke}
          onDeselectEditStroke={() => {
            setEditStrokeIndex(null);
            setSelectedStrokeIds(new Set());
          }}
        />

        {/* Layers Sidebar */}
        <LayersSidebar
          layers={layers}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onToggleVisibility={handleToggleLayerVisibility}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          currentStrokes={currentStrokes}
          onUpdateLayerOpacity={handleUpdateLayerOpacity}
        />
      </div>

      {/* Animation Timeline Bar */}
      <TimelineBar
        frameData={frameData}
        frameIndex={frameIndex}
        onSelectFrame={(idx) => setFrameIndex(idx)}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        playing={playing}
        onTogglePlay={() => setPlaying(!playing)}
        pingPong={pingPong}
        onTogglePingPong={() => setPingPong(!pingPong)}
        fps={fps}
        onChangeFps={setFps}
        onSetHold={handleSetHold}
        hasSelection={selectedStrokeIds.size > 0}
        onTransformSelection={handleTransformSelection}
        onClearSelection={() => {
          setSelectedStrokeIds(new Set());
          setEditStrokeIndex(null);
        }}
      />

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        currentColor={brushColor}
        onApplyColor={handleApplyColor}
        recentColors={recentColors}
      />
    </div>
  );
}

// Helpers
function createLayerCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = RASTER_WIDTH;
  canvas.height = RASTER_HEIGHT;
  return canvas;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderVectorStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.width;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  if (
    stroke.inHandles &&
    stroke.outHandles &&
    stroke.inHandles.length === stroke.points.length &&
    stroke.outHandles.length === stroke.points.length
  ) {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const a = stroke.points[i];
      const b = stroke.points[i + 1];
      const c1 = { x: a.x + stroke.outHandles[i].x, y: a.y + stroke.outHandles[i].y };
      const c2 = { x: b.x + stroke.inHandles[i + 1].x, y: b.y + stroke.inHandles[i + 1].y };
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y);
    }
  } else {
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
  }

  if (stroke.closed) {
    ctx.closePath();
  }
  if (stroke.filled) {
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}
