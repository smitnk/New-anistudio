import { Offset } from '../types';

export type SnapKind = 'NONE' | 'ANGLE' | 'GRID' | 'PERSPECTIVE';

export interface PrecisionSnapResult {
  point: Offset;
  kind: SnapKind;
  angleDegrees: number;
}

export class PrecisionRulerEngine {
  private static commonAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

  static snapAngle(
    start: Offset,
    point: Offset,
    toleranceDegrees: number = 7
  ): PrecisionSnapResult {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1) {
      return { point, kind: 'NONE', angleDegrees: 0 };
    }

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    let best = angle;
    let bestDelta = Number.MAX_VALUE;

    for (const candidate of this.commonAngles) {
      const delta = Math.abs(angle - candidate);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = candidate;
      }
    }

    const nearestDegree = Math.round(angle);
    if (bestDelta > toleranceDegrees) {
      best = nearestDegree;
    }

    const radians = (best * Math.PI) / 180;
    const snapped: Offset = {
      x: start.x + Math.cos(radians) * distance,
      y: start.y + Math.sin(radians) * distance,
    };

    return {
      point: snapped,
      kind: bestDelta <= toleranceDegrees ? 'ANGLE' : 'NONE',
      angleDegrees: best,
    };
  }

  static snapGrid(point: Offset, spacing: number): PrecisionSnapResult {
    if (spacing <= 0) return { point, kind: 'NONE', angleDegrees: 0 };
    const snapped: Offset = {
      x: Math.round(point.x / spacing) * spacing,
      y: Math.round(point.y / spacing) * spacing,
    };
    return { point: snapped, kind: 'GRID', angleDegrees: 0 };
  }
}
