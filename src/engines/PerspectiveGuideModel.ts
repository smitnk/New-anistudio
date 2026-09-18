import { Offset, Tool } from '../types';
import { PrecisionRulerEngine } from './PrecisionRulerEngine';

export class PerspectiveGuideModel {
  horizonY: number;
  vanishingPoints: Offset[];
  snapEnabled: boolean;

  constructor(
    horizonY: number = 600,
    vanishingPoints: Offset[] = [{ x: 800, y: -500 }],
    snapEnabled: boolean = false
  ) {
    this.horizonY = horizonY;
    this.vanishingPoints = vanishingPoints;
    this.snapEnabled = snapEnabled;
  }

  static createDefault(width: number = 1600, height: number = 1200, count: number = 1): PerspectiveGuideModel {
    const model = new PerspectiveGuideModel(height / 2, [], false);
    return model.withPointCount(count, width, height);
  }

  withPointCount(count: number, width: number, height: number): PerspectiveGuideModel {
    const y = Math.max(0, Math.min(height, this.horizonY));
    const clampedCount = Math.max(1, Math.min(3, count));
    let points: Offset[] = [];

    if (clampedCount === 1) {
      points = [{ x: width / 2, y: y - 1100 }];
    } else if (clampedCount === 2) {
      points = [
        { x: -900, y },
        { x: width + 900, y },
      ];
    } else {
      points = [
        { x: -900, y: y - 900 },
        { x: width + 900, y: y - 900 },
        { x: width / 2, y: y + 1400 },
      ];
    }

    return new PerspectiveGuideModel(y, points, this.snapEnabled);
  }

  nearestPoint(point: Offset, radius: number = 70): number {
    let best = -1;
    let bestDistance = radius * radius;
    this.vanishingPoints.forEach((vp, index) => {
      const dx = vp.x - point.x;
      const dy = vp.y - point.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  }

  movePoint(index: number, point: Offset): PerspectiveGuideModel {
    if (index < 0 || index >= this.vanishingPoints.length) return this;
    const updated = [...this.vanishingPoints];
    updated[index] = point;
    return new PerspectiveGuideModel(this.horizonY, updated, this.snapEnabled);
  }

  moveHorizon(y: number, height: number): PerspectiveGuideModel {
    return new PerspectiveGuideModel(
      Math.max(0, Math.min(height, y)),
      this.vanishingPoints,
      this.snapEnabled
    );
  }

  snap(point: Offset): Offset {
    if (!this.snapEnabled || this.vanishingPoints.length === 0) return point;
    const center: Offset = { x: point.x, y: this.horizonY };

    let bestVp: Offset | null = null;
    let bestDist = Number.MAX_VALUE;
    for (const p of this.vanishingPoints) {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestVp = p;
      }
    }
    if (!bestVp) return point;

    const dx = bestVp.x - center.x;
    const dy = bestVp.y - center.y;
    const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const ux = dx / length;
    const uy = dy / length;
    const px = point.x - center.x;
    const py = point.y - center.y;
    const projection = px * ux + py * uy;
    return {
      x: center.x + projection * ux,
      y: center.y + projection * uy,
    };
  }

  isNearHorizon(point: Offset, tolerance: number = 45): boolean {
    return Math.abs(point.y - this.horizonY) <= tolerance;
  }
}

export class DrawingSnapController {
  static snap(
    start: Offset,
    point: Offset,
    tool: Tool,
    guide: PerspectiveGuideModel
  ): Offset {
    const shapeTool = tool === 'LINE' || tool === 'RECTANGLE' || tool === 'ELLIPSE';
    if (!shapeTool || !guide.snapEnabled) return point;

    const perspective = guide.snap(point);
    return PrecisionRulerEngine.snapAngle(start, perspective).point;
  }
}
