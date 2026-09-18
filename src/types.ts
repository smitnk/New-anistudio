export interface Offset {
  x: number;
  y: number;
}

export interface Stroke {
  points: Offset[];
  inHandles?: Offset[];
  outHandles?: Offset[];
  pressures?: number[];
  color: string;
  width: number;
  opacity: number;
  closed?: boolean;
  filled?: boolean;
}

export interface ArtLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  clipToBelow: boolean;
}

export interface LayerFrame {
  strokes: Stroke[];
  hold: number;
}

export interface Frame {
  layers: LayerFrame[];
}

export type Tool =
  | 'BRUSH'
  | 'ERASER'
  | 'LINE'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'SELECT'
  | 'FILL'
  | 'EYEDROPPER';

export type BrushType = 'Pencil' | 'Pen' | 'Marker' | 'Airbrush';

export type GridType = '2D' | 'ISO' | 'PERSPECTIVE';

export type SculptTool = 'Grab' | 'Push' | 'Smooth' | 'Pinch' | 'Thickness';

export interface EditorSnapshot {
  strokes: Stroke[][];
  // ImageData or DataURL for each layer
  rasterData: string[];
}

export interface PerspectiveGuideState {
  horizonY: number;
  vanishingPoints: Offset[];
  snapEnabled: boolean;
  perspectivePoints: number; // 1, 2, or 3
}

export interface TransformBox {
  center: Offset;
  width: number;
  height: number;
  rotationDegrees: number;
  pivot: Offset;
}

export type TransformHandle =
  | 'NONE'
  | 'TOP_LEFT'
  | 'TOP'
  | 'TOP_RIGHT'
  | 'RIGHT'
  | 'BOTTOM_RIGHT'
  | 'BOTTOM'
  | 'BOTTOM_LEFT'
  | 'LEFT'
  | 'ROTATE'
  | 'PIVOT';

export interface TransformHandleHit {
  handle: TransformHandle;
  distance: number;
}

export interface TransformInteraction {
  handle: TransformHandle;
  startPointer: Offset;
  startBox: TransformBox | null;
}
