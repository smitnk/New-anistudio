import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Offset,
  Tool,
  Stroke,
  ArtLayer,
  Frame,
  GridType,
  SculptTool,
  PerspectiveGuideState,
} from '../types';
import { RasterBrushEngine } from '../engines/RasterBrushEngine';
import { PerspectiveGuideModel, DrawingSnapController } from '../engines/PerspectiveGuideModel';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasStageProps {
  rasterWidth: number;
  rasterHeight: number;
  layers: ArtLayer[];
  selectedLayer: number;
  frameData: Frame[];
  frameIndex: number;
  rasterCanvases: HTMLCanvasElement[];
  tool: Tool;
  brushColor: string;
  brushWidth: number;
  brushOpacity: number;
  brushType: 'Pencil' | 'Pen' | 'Marker' | 'Airbrush';
  shapeFilled: boolean;
  pressureEnabled: boolean;
  stabilization: number;
  streamline: number;
  spacing: number;
  taper: number;
  quickShape: boolean;
  deepBrushEngine: boolean;
  alphaLock: boolean;
  clippingMask: boolean;
  onionSkin: boolean;
  onionSkinIntensity: number;
  showGrid: boolean;
  gridType: GridType;
  gridSpacing: number;
  perspectiveGuide: PerspectiveGuideState;
  currentStrokes: Stroke[][];
  selectedStrokeIds: Set<number>;
  editStrokeIndex: number | null;
  editNodeIndex: number;
  nodeEditorMode: boolean;
  bezierHandleMode: boolean;
  weightPaintMode: boolean;
  weightJoints: Offset[];
  weightJoint: number;
  weightRadius: number;
  weightStrength: number;
  rigMode: boolean;
  rigJoints: Offset[];
  rigParents: number[];
  rigSelected: number;
  sculptMode: boolean;
  sculptTool: SculptTool;
  sculptRadius: number;
  sculptStrength: number;
  onCommitStroke: (stroke: Stroke, rasterUpdated: boolean) => void;
  onFloodFill: (point: Offset) => void;
  onSampleColor: (point: Offset) => void;
  onSelectLasso: (polygon: Offset[]) => void;
  onSelectNode: (nodeIndex: number) => void;
  onMoveNode: (nodeIndex: number, newPoint: Offset) => void;
  onMoveBezierHandle: (point: Offset, side: 'in' | 'out') => void;
  onPoseWeightJoint: (point: Offset) => void;
  onMoveRigJoint: (jointIndex: number, point: Offset) => void;
  onSculptStroke: (point: Offset, delta: Offset) => void;
  onDeselectEditStroke: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  rasterWidth,
  rasterHeight,
  layers,
  selectedLayer,
  frameData,
  frameIndex,
  rasterCanvases,
  tool,
  brushColor,
  brushWidth,
  brushOpacity,
  brushType,
  shapeFilled,
  pressureEnabled,
  stabilization,
  streamline,
  spacing,
  taper,
  quickShape,
  deepBrushEngine,
  alphaLock,
  onionSkin,
  onionSkinIntensity,
  showGrid,
  gridType,
  gridSpacing,
  perspectiveGuide,
  currentStrokes,
  selectedStrokeIds,
  editStrokeIndex,
  editNodeIndex,
  nodeEditorMode,
  bezierHandleMode,
  weightPaintMode,
  weightJoints,
  weightJoint,
  rigMode,
  rigJoints,
  rigParents,
  rigSelected,
  sculptMode,
  sculptTool,
  sculptRadius,
  sculptStrength,
  onCommitStroke,
  onFloodFill,
  onSampleColor,
  onSelectLasso,
  onSelectNode,
  onMoveNode,
  onMoveBezierHandle,
  onPoseWeightJoint,
  onMoveRigJoint,
  onSculptStroke,
  onDeselectEditStroke,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport navigation
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<Offset>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Active interaction tracking
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Offset[]>([]);
  const [currentPressures, setCurrentPressures] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isSpacePanning, setIsSpacePanning] = useState<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const lastPointerPos = useRef<Offset>({ x: 0, y: 0 });

  // Update viewport size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const artScale = useCallback((): number => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) return 1;
    return (
      Math.min(
        viewportSize.width / rasterWidth,
        viewportSize.height / rasterHeight
      ) * 0.92
    );
  }, [viewportSize, rasterWidth, rasterHeight]);

  const screenToArt = useCallback(
    (screen: Offset): Offset => {
      const base = artScale();
      const cx = viewportSize.width / 2 + pan.x;
      const cy = viewportSize.height / 2 + pan.y;
      const dx = screen.x - cx;
      const dy = screen.y - cy;
      const r = (-rotation * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      return {
        x: (dx * c - dy * s) / (base * scale) + rasterWidth / 2,
        y: (dx * s + dy * c) / (base * scale) + rasterHeight / 2,
      };
    },
    [artScale, pan, rotation, scale, viewportSize, rasterWidth, rasterHeight]
  );

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setScale((s) => Math.max(0.2, Math.min(8, s * zoomFactor)));
    } else {
      // Pan
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  };

  // Helper: check nearest node in active stroke
  const nearestEditNode = useCallback(
    (point: Offset): number => {
      if (editStrokeIndex === null) return -1;
      const strokes = currentStrokes[selectedLayer];
      const stroke = strokes?.[editStrokeIndex];
      if (!stroke || stroke.points.length === 0) return -1;

      let best = -1;
      let bestDist = Number.MAX_VALUE;
      stroke.points.forEach((n, idx) => {
        const dx = n.x - point.x;
        const dy = n.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = idx;
        }
      });
      return bestDist <= 44 ? best : -1;
    },
    [editStrokeIndex, currentStrokes, selectedLayer]
  );

  // Main render loop
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas dimensions to match viewport
    if (
      canvas.width !== viewportSize.width ||
      canvas.height !== viewportSize.height
    ) {
      canvas.width = viewportSize.width;
      canvas.height = viewportSize.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Center & Viewport transform
    const baseScale = artScale();
    ctx.translate(viewportSize.width / 2 + pan.x, viewportSize.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(baseScale * scale, baseScale * scale);
    ctx.translate(-rasterWidth / 2, -rasterHeight / 2);

    // 1. Draw Canvas Board Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rasterWidth, rasterHeight);

    // 2. Draw Grid & Guides if enabled
    if (showGrid) {
      ctx.save();
      const step = Math.max(20, gridSpacing);
      ctx.lineWidth = 1;
      if (gridType === '2D') {
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.22)';
        ctx.beginPath();
        for (let x = 0; x <= rasterWidth; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rasterHeight);
        }
        for (let y = 0; y <= rasterHeight; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(rasterWidth, y);
        }
        ctx.stroke();
      } else if (gridType === 'ISO') {
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.18)';
        ctx.beginPath();
        for (let x = -rasterHeight; x <= rasterWidth; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x + rasterHeight, rasterHeight);
        }
        for (let x = 0; x <= rasterWidth + rasterHeight; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x - rasterHeight, rasterHeight);
        }
        ctx.stroke();
      } else {
        // Perspective Grid
        const guideModel = new PerspectiveGuideModel(
          perspectiveGuide.horizonY,
          perspectiveGuide.vanishingPoints,
          perspectiveGuide.snapEnabled
        ).withPointCount(perspectiveGuide.perspectivePoints, rasterWidth, rasterHeight);

        // Horizon line
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, guideModel.horizonY);
        ctx.lineTo(rasterWidth, guideModel.horizonY);
        ctx.stroke();

        // Rays to center
        const center: Offset = { x: rasterWidth / 2, y: guideModel.horizonY };
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.28)';
        ctx.lineWidth = 1.5;
        guideModel.vanishingPoints.forEach((vp) => {
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(vp.x, vp.y);
          ctx.stroke();

          // Vanishing point dot
          ctx.fillStyle = 'rgba(0, 220, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(vp.x, vp.y, 8, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();
    }

    // 3. Onion Skinning (Previous and Next Frames)
    if (onionSkin && onionSkinIntensity > 0) {
      // Previous Frame (Warm Red Tint)
      if (frameIndex > 0) {
        ctx.save();
        const prevFrame = frameData[frameIndex - 1];
        if (prevFrame) {
          prevFrame.layers.forEach((lf, lIdx) => {
            const layer = layers[lIdx];
            if (!layer?.visible) return;
            const effOpacity = onionSkinIntensity * layer.opacity;
            lf.strokes.forEach((s) => {
              renderStroke(ctx, s, '#ef4444', effOpacity * (s.opacity ?? 1));
            });
          });
        }
        ctx.restore();
      }

      // Next Frame (Cool Green Tint)
      if (frameIndex < frameData.length - 1) {
        ctx.save();
        const nextFrame = frameData[frameIndex + 1];
        if (nextFrame) {
          nextFrame.layers.forEach((lf, lIdx) => {
            const layer = layers[lIdx];
            if (!layer?.visible) return;
            const effOpacity = onionSkinIntensity * layer.opacity;
            lf.strokes.forEach((s) => {
              renderStroke(ctx, s, '#22c55e', effOpacity * (s.opacity ?? 1));
            });
          });
        }
        ctx.restore();
      }
    }

    // 4. Render Raster Canvases for visible layers
    layers.forEach((layer, idx) => {
      if (!layer.visible) return;
      const layerCanvas = rasterCanvases[idx];
      if (layerCanvas) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
        ctx.drawImage(layerCanvas, 0, 0);
        ctx.restore();
      }
    });

    // 5. Render Vector Strokes for visible layers
    currentStrokes.forEach((strokes, lIdx) => {
      const layer = layers[lIdx];
      if (!layer?.visible) return;

      ctx.save();
      const layerOpacity = layer.opacity;

      strokes.forEach((s, sIdx) => {
        const isSelected = lIdx === selectedLayer && selectedStrokeIds.has(sIdx);
        renderStroke(ctx, s, s.color, s.opacity * layerOpacity, isSelected);
      });
      ctx.restore();
    });

    // 6. Active In-Progress Vector Preview
    if (currentStrokePoints.length > 0 && tool !== 'SELECT' && isDrawing) {
      ctx.save();
      let previewPts = currentStrokePoints;
      if (tool === 'LINE' && currentStrokePoints.length >= 2) {
        previewPts = [currentStrokePoints[0], currentStrokePoints[currentStrokePoints.length - 1]];
      } else if (tool === 'RECTANGLE' && currentStrokePoints.length >= 2) {
        const a = currentStrokePoints[0];
        const b = currentStrokePoints[currentStrokePoints.length - 1];
        previewPts = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
      } else if (tool === 'ELLIPSE' && currentStrokePoints.length >= 2) {
        const a = currentStrokePoints[0];
        const b = currentStrokePoints[currentStrokePoints.length - 1];
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        const rx = Math.abs(b.x - a.x) / 2;
        const ry = Math.abs(b.y - a.y) / 2;
        previewPts = [];
        for (let i = 0; i <= 48; i++) {
          const t = (i * 2 * Math.PI) / 48;
          previewPts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
        }
      }

      const previewStroke: Stroke = {
        points: previewPts,
        color: tool === 'ERASER' ? '#FFFFFF' : brushColor,
        width: brushWidth,
        opacity: brushOpacity,
        closed: tool === 'RECTANGLE' || tool === 'ELLIPSE',
        filled: shapeFilled && (tool === 'RECTANGLE' || tool === 'ELLIPSE'),
      };
      renderStroke(ctx, previewStroke, previewStroke.color, previewStroke.opacity);
      ctx.restore();
    }

    // 7. Lasso Selection Polygon
    if (tool === 'SELECT' && currentStrokePoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
      ctx.fillStyle = 'rgba(33, 150, 243, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
      for (let i = 1; i < currentStrokePoints.length; i++) {
        ctx.lineTo(currentStrokePoints[i].x, currentStrokePoints[i].y);
      }
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    // 8. Node Editing Overlay & Bezier Handles
    if (editStrokeIndex !== null) {
      const activeStroke = currentStrokes[selectedLayer]?.[editStrokeIndex];
      if (activeStroke) {
        // Bezier Handles
        if (nodeEditorMode && bezierHandleMode) {
          ctx.save();
          activeStroke.points.forEach((p, n) => {
            const ih = activeStroke.inHandles?.[n];
            const oh = activeStroke.outHandles?.[n];
            if (ih && (ih.x !== 0 || ih.y !== 0)) {
              ctx.strokeStyle = 'rgba(217, 70, 239, 0.6)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x + ih.x, p.y + ih.y);
              ctx.stroke();

              ctx.fillStyle = '#d946ef';
              ctx.beginPath();
              ctx.arc(p.x + ih.x, p.y + ih.y, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            if (oh && (oh.x !== 0 || oh.y !== 0)) {
              ctx.strokeStyle = 'rgba(217, 70, 239, 0.6)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x + oh.x, p.y + oh.y);
              ctx.stroke();

              ctx.fillStyle = '#d946ef';
              ctx.beginPath();
              ctx.arc(p.x + oh.x, p.y + oh.y, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.restore();
        }

        // Node circles
        if (nodeEditorMode) {
          ctx.save();
          activeStroke.points.forEach((p, n) => {
            const isNodeSelected = n === editNodeIndex;
            ctx.fillStyle = isNodeSelected ? '#FFEB3B' : '#00E5FF';
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, isNodeSelected ? 9 : 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
          ctx.restore();
        }
      }
    }

    // 9. Rig Joints & Bones
    if (rigMode && rigJoints.length > 0) {
      ctx.save();
      rigJoints.forEach((j, idx) => {
        const parentIdx = rigParents[idx] ?? -1;
        if (parentIdx >= 0 && parentIdx < rigJoints.length) {
          const parent = rigJoints[parentIdx];
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(j.x, j.y);
          ctx.stroke();
        }
        const isRigSelected = idx === rigSelected;
        ctx.fillStyle = isRigSelected ? '#FFEB3B' : '#00E5FF';
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(j.x, j.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }

    // 10. Weight Paint Mode Joints
    if (weightPaintMode && weightJoints.length === 2) {
      ctx.save();
      weightJoints.forEach((j, idx) => {
        const isSelected = idx === weightJoint;
        ctx.fillStyle = isSelected ? '#FFEB3B' : '#00E5FF';
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(j.x, j.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }

    // Canvas border outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, rasterWidth, rasterHeight);

    ctx.restore();
  }, [
    viewportSize,
    artScale,
    scale,
    pan,
    rotation,
    rasterWidth,
    rasterHeight,
    layers,
    selectedLayer,
    rasterCanvases,
    currentStrokes,
    selectedStrokeIds,
    currentStrokePoints,
    isDrawing,
    tool,
    brushColor,
    brushWidth,
    brushOpacity,
    shapeFilled,
    onionSkin,
    onionSkinIntensity,
    frameData,
    frameIndex,
    showGrid,
    gridType,
    gridSpacing,
    perspectiveGuide,
    editStrokeIndex,
    editNodeIndex,
    nodeEditorMode,
    bezierHandleMode,
    rigMode,
    rigJoints,
    rigParents,
    rigSelected,
    weightPaintMode,
    weightJoints,
    weightJoint,
  ]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    lastPointerPos.current = screenPos;

    // Check space pan or middle click
    if (isSpacePanning || e.button === 1) {
      isInteractingRef.current = true;
      return;
    }

    const artPoint = screenToArt(screenPos);
    isInteractingRef.current = true;
    setIsDrawing(true);

    // Eyedropper tool
    if (tool === 'EYEDROPPER') {
      onSampleColor(artPoint);
      setIsDrawing(false);
      return;
    }

    // Flood fill tool
    if (tool === 'FILL') {
      onFloodFill(artPoint);
      setIsDrawing(false);
      return;
    }

    // If editing stroke or shapes
    if (editStrokeIndex !== null) {
      if (rigMode) {
        let best = -1;
        let bd = 44 * 44;
        rigJoints.forEach((j, i) => {
          const dx = j.x - artPoint.x;
          const dy = j.y - artPoint.y;
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        if (best >= 0) {
          onMoveRigJoint(best, artPoint);
          return;
        }
      }

      if (weightPaintMode) {
        let best = -1;
        let bd = 44 * 44;
        weightJoints.forEach((j, i) => {
          const dx = j.x - artPoint.x;
          const dy = j.y - artPoint.y;
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        if (best >= 0) {
          onPoseWeightJoint(artPoint);
          return;
        }
      }

      if (nodeEditorMode) {
        const hit = nearestEditNode(artPoint);
        if (hit >= 0) {
          onSelectNode(hit);
          return;
        }
      }

      // Tap outside active shape dismisses edit mode
      if (nearestEditNode(artPoint) < 0 && !sculptMode) {
        onDeselectEditStroke();
      }
    }

    const pressure = e.pressure > 0 ? e.pressure : 0.5;
    setCurrentStrokePoints([artPoint]);
    setCurrentPressures([pressure]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const prevScreenPos = lastPointerPos.current;
    lastPointerPos.current = screenPos;

    // Viewport Panning
    if (isSpacePanning || e.buttons === 4) {
      setPan((p) => ({
        x: p.x + (screenPos.x - prevScreenPos.x),
        y: p.y + (screenPos.y - prevScreenPos.y),
      }));
      return;
    }

    const artPoint = screenToArt(screenPos);
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    // Rigging drag
    if (editStrokeIndex !== null && rigMode && rigSelected >= 0) {
      onMoveRigJoint(rigSelected, artPoint);
      return;
    }

    // Weight Pose drag
    if (editStrokeIndex !== null && weightPaintMode && weightJoint >= 0) {
      onPoseWeightJoint(artPoint);
      return;
    }

    // Sculpt Mode drag
    if (editStrokeIndex !== null && sculptMode) {
      const prevArt = screenToArt(prevScreenPos);
      const delta = { x: artPoint.x - prevArt.x, y: artPoint.y - prevArt.y };
      onSculptStroke(artPoint, delta);
      return;
    }

    // Node drag
    if (editStrokeIndex !== null && nodeEditorMode && editNodeIndex >= 0) {
      if (bezierHandleMode) {
        onMoveBezierHandle(artPoint, 'out');
      } else {
        onMoveNode(editNodeIndex, artPoint);
      }
      return;
    }

    // Stroke Drawing
    if (isDrawing) {
      setCurrentStrokePoints((pts) => [...pts, artPoint]);
      setCurrentPressures((prs) => [...prs, pressure]);
    }
  };

  const handlePointerUp = () => {
    isInteractingRef.current = false;
    setIsDrawing(false);

    if (currentStrokePoints.length === 0) return;

    // Lasso selection
    if (tool === 'SELECT') {
      onSelectLasso(currentStrokePoints);
      setCurrentStrokePoints([]);
      setCurrentPressures([]);
      return;
    }

    // Process drawn stroke
    let processedPoints = currentStrokePoints;

    // Stabilization
    if (stabilization > 0 && processedPoints.length > 2) {
      const out: Offset[] = [processedPoints[0]];
      let last = processedPoints[0];
      for (let i = 1; i < processedPoints.length; i++) {
        const p = processedPoints[i];
        last = {
          x: last.x + (p.x - last.x) * (1 - stabilization),
          y: last.y + (p.y - last.y) * (1 - stabilization),
        };
        out.push(last);
      }
      processedPoints = out;
    }

    // Spacing
    if (spacing > 0 && processedPoints.length > 2) {
      const out: Offset[] = [processedPoints[0]];
      let carry = 0;
      const minStep = Math.max(1, brushWidth * spacing);
      for (let i = 1; i < processedPoints.length; i++) {
        const a = processedPoints[i - 1];
        const b = processedPoints[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        carry += Math.sqrt(dx * dx + dy * dy);
        if (carry >= minStep) {
          out.push(b);
          carry = 0;
        }
      }
      if (out[out.length - 1] !== processedPoints[processedPoints.length - 1]) {
        out.push(processedPoints[processedPoints.length - 1]);
      }
      processedPoints = out;
    }

    // Quick Shape auto-straighten
    if (quickShape && (tool === 'BRUSH' || tool === 'ERASER') && processedPoints.length >= 6) {
      const a = processedPoints[0];
      const b = processedPoints[processedPoints.length - 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (Math.abs(dx) > Math.abs(dy) * 6 || Math.abs(dy) > Math.abs(dx) * 6) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          processedPoints = processedPoints.map((pt) => ({
            x: pt.x,
            y: a.y + (b.y - a.y) * ((pt.x - a.x) / (dx !== 0 ? dx : 1)),
          }));
        } else {
          processedPoints = processedPoints.map((pt) => ({
            x: a.x + (b.x - a.x) * ((pt.y - a.y) / (dy !== 0 ? dy : 1)),
            y: pt.y,
          }));
        }
      }
    }

    // Shape geometry conversion
    if (tool === 'LINE' && processedPoints.length >= 2) {
      let endPoint = processedPoints[processedPoints.length - 1];
      if (perspectiveGuide.snapEnabled) {
        const guideModel = new PerspectiveGuideModel(
          perspectiveGuide.horizonY,
          perspectiveGuide.vanishingPoints,
          perspectiveGuide.snapEnabled
        );
        endPoint = DrawingSnapController.snap(processedPoints[0], endPoint, tool, guideModel);
      }
      processedPoints = [processedPoints[0], endPoint];
    } else if (tool === 'RECTANGLE' && processedPoints.length >= 2) {
      const a = processedPoints[0];
      const b = processedPoints[processedPoints.length - 1];
      processedPoints = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
    } else if (tool === 'ELLIPSE' && processedPoints.length >= 2) {
      const a = processedPoints[0];
      const b = processedPoints[processedPoints.length - 1];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
      processedPoints = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i * 2 * Math.PI) / 48;
        processedPoints.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
    }

    // If brush or eraser, commit to the raster layer bitmap
    let isRaster = false;
    if (tool === 'BRUSH' || tool === 'ERASER') {
      const layerCanvas = rasterCanvases[selectedLayer];
      if (layerCanvas) {
        const ctx = layerCanvas.getContext('2d');
        if (ctx) {
          RasterBrushEngine.drawStroke(
            ctx,
            processedPoints,
            currentPressures,
            brushColor,
            brushWidth,
            brushOpacity,
            brushType,
            alphaLock,
            tool === 'ERASER',
            pressureEnabled,
            taper,
            deepBrushEngine
          );
          isRaster = true;
        }
      }
    }

    const stroke: Stroke = {
      points: processedPoints,
      pressures: currentPressures,
      color: tool === 'ERASER' ? 'transparent' : brushColor,
      width: brushWidth,
      opacity: brushOpacity,
      closed: tool === 'RECTANGLE' || tool === 'ELLIPSE',
      filled: shapeFilled && (tool === 'RECTANGLE' || tool === 'ELLIPSE'),
    };

    onCommitStroke(stroke, isRaster);
    setCurrentStrokePoints([]);
    setCurrentPressures([]);
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <div
      ref={containerRef}
      id="canvas-stage-container"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex-1 w-full h-full bg-zinc-950 overflow-hidden ${
        isSpacePanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    >
      <canvas
        ref={displayCanvasRef}
        id="main-interactive-canvas"
        className="absolute inset-0 block w-full h-full"
      />

      {/* Floating Canvas Navigation Overlay */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 p-1 bg-zinc-900/90 backdrop-blur-xs border border-zinc-800 rounded-lg shadow-lg text-xs text-zinc-300 select-none">
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(8, s * 1.2))}
          className="p-1 hover:bg-zinc-800 rounded cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] px-1 text-zinc-400">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.2, s / 1.2))}
          className="p-1 hover:bg-zinc-800 rounded cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />
        <button
          type="button"
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 hover:bg-zinc-800 text-[11px] rounded flex items-center gap-1 cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Fit</span>
        </button>
      </div>
    </div>
  );
};

// Helper: render a single stroke onto Canvas2D
function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  color: string,
  opacity: number = 1,
  outline: boolean = false
) {
  if (stroke.points.length === 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = outline ? stroke.width + 4 : stroke.width;
  ctx.strokeStyle = outline ? 'rgba(33, 150, 243, 0.45)' : color;
  ctx.fillStyle = color;

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

  if (stroke.filled && !outline) {
    ctx.fill();
  }
  ctx.stroke();

  ctx.restore();
}
