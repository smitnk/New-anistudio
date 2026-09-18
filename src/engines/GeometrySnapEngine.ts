import { Offset } from '../types';

export interface SnapResult {
  point: Offset;
  snapped: boolean;
  angleDegrees: number;
}

export class GeometrySnapEngine {
  static snapToPerspective(
    point: Offset,
    origin: Offset,
    vanishingPoints: Offset[],
    radius: number = 140
  ): SnapResult {
    if (vanishingPoints.length === 0) return { point, snapped: false, angleDegrees: 0 };
    let bestPoint = point;
    let bestDistance = Number.MAX_VALUE;
    let bestAngle = 0;

    for (const vp of vanishingPoints) {
      const dx = vp.x - origin.x;
      const dy = vp.y - origin.y;
      const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const ux = dx / length;
      const uy = dy / length;
      const px = point.x - origin.x;
      const py = point.y - origin.y;
      const projection = px * ux + py * uy;
      const projected: Offset = {
        x: origin.x + projection * ux,
        y: origin.y + projection * uy,
      };
      const distance = Math.sqrt(
        (projected.x - point.x) * (projected.x - point.x) +
          (projected.y - point.y) * (projected.y - point.y)
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = projected;
        bestAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      }
    }

    return {
      point: bestPoint,
      snapped: bestDistance <= radius,
      angleDegrees: bestAngle,
    };
  }
}
