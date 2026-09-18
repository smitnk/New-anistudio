import { Offset, TransformBox, TransformHandle, TransformHandleHit, TransformInteraction } from '../types';

export class TransformGeometry {
  static corners(box: TransformBox): Offset[] {
    const local = [
      { x: -box.width / 2, y: -box.height / 2 },
      { x: box.width / 2, y: -box.height / 2 },
      { x: box.width / 2, y: box.height / 2 },
      { x: -box.width / 2, y: box.height / 2 },
    ];
    const r = (box.rotationDegrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return local.map((p) => ({
      x: box.center.x + p.x * c - p.y * s,
      y: box.center.y + p.x * s + p.y * c,
    }));
  }

  static contains(box: TransformBox, point: Offset, tolerance: number = 0): boolean {
    const r = (-box.rotationDegrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    const dx = point.x - box.center.x;
    const dy = point.y - box.center.y;
    const x = dx * c - dy * s;
    const y = dx * s + dy * c;
    return (
      x >= -box.width / 2 - tolerance &&
      x <= box.width / 2 + tolerance &&
      y >= -box.height / 2 - tolerance &&
      y <= box.height / 2 + tolerance
    );
  }

  static bounds(points: Offset[]): TransformBox | null {
    if (points.length === 0) return null;
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      rotationDegrees: 0,
      pivot: { x: 0, y: 0 },
    };
  }

  static move(points: Offset[], delta: Offset): Offset[] {
    return points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y }));
  }

  static scale(points: Offset[], center: Offset, sx: Float64Array[0] | number, sy: number): Offset[] {
    return points.map((p) => ({
      x: center.x + (p.x - center.x) * sx,
      y: center.y + (p.y - center.y) * sy,
    }));
  }

  static rotate(points: Offset[], center: Offset, degrees: number): Offset[] {
    const r = (degrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return points.map((p) => {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      return {
        x: center.x + dx * c - dy * s,
        y: center.y + dx * s + dy * c,
      };
    });
  }

  static flipHorizontal(points: Offset[], centerX: number): Offset[] {
    return points.map((p) => ({ x: 2 * centerX - p.x, y: p.y }));
  }

  static flipVertical(points: Offset[], centerY: number): Offset[] {
    return points.map((p) => ({ x: p.x, y: 2 * centerY - p.y }));
  }
}

export class TransformHandleGeometry {
  private static midpoint(a: Offset, b: Offset): Offset {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  static handles(box: TransformBox, rotateOffset: number = 70): Map<TransformHandle, Offset> {
    const c = TransformGeometry.corners(box);
    const topMid = this.midpoint(c[0], c[1]);
    const rightMid = this.midpoint(c[1], c[2]);
    const bottomMid = this.midpoint(c[2], c[3]);
    const leftMid = this.midpoint(c[3], c[0]);
    const pivot = box.pivot.x !== 0 || box.pivot.y !== 0 ? box.pivot : box.center;

    const dx = pivot.x - box.center.x;
    const dy = pivot.y - box.center.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const rotateCenter: Offset = {
      x: topMid.x + ((topMid.x - box.center.x) * rotateOffset) / len,
      y: topMid.y + ((topMid.y - box.center.y) * rotateOffset) / len,
    };

    const map = new Map<TransformHandle, Offset>();
    map.set('TOP_LEFT', c[0]);
    map.set('TOP', topMid);
    map.set('TOP_RIGHT', c[1]);
    map.set('RIGHT', rightMid);
    map.set('BOTTOM_RIGHT', c[2]);
    map.set('BOTTOM', bottomMid);
    map.set('BOTTOM_LEFT', c[3]);
    map.set('LEFT', leftMid);
    map.set('ROTATE', rotateCenter);
    map.set('PIVOT', pivot);

    return map;
  }

  static hitTest(box: TransformBox, point: Offset, radius: number = 32): TransformHandleHit {
    let best: TransformHandle = 'NONE';
    let bestDistance = Number.MAX_VALUE;

    const hMap = this.handles(box);
    hMap.forEach((position, handle) => {
      const dx = point.x - position.x;
      const dy = point.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius && distance < bestDistance) {
        best = handle;
        bestDistance = distance;
      }
    });

    return { handle: best, distance: bestDistance };
  }

  static angle(center: Offset, point: Offset): number {
    return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
  }
}

export class TransformInteractionController {
  static begin(box: TransformBox, pointer: Offset): TransformInteraction {
    return {
      handle: TransformHandleGeometry.hitTest(box, pointer).handle,
      startPointer: pointer,
      startBox: { ...box, pivot: { ...box.pivot }, center: { ...box.center } },
    };
  }

  static move(
    interaction: TransformInteraction,
    pointer: Offset,
    minSize: number = 1
  ): TransformBox | null {
    const box = interaction.startBox;
    if (!box) return null;
    const handle = interaction.handle;
    const dx = pointer.x - interaction.startPointer.x;
    const dy = pointer.y - interaction.startPointer.y;

    switch (handle) {
      case 'NONE':
        return null;
      case 'PIVOT':
        return {
          ...box,
          pivot: { x: box.pivot.x + dx, y: box.pivot.y + dy },
        };
      case 'ROTATE': {
        const before = TransformHandleGeometry.angle(box.center, interaction.startPointer);
        const after = TransformHandleGeometry.angle(box.center, pointer);
        return {
          ...box,
          rotationDegrees: box.rotationDegrees + (after - before),
        };
      }
      case 'TOP_LEFT':
        return this.resize(box, -dx, -dy, true, true, minSize);
      case 'TOP':
        return this.resize(box, 0, -dy, false, true, minSize);
      case 'TOP_RIGHT':
        return this.resize(box, dx, -dy, true, true, minSize);
      case 'RIGHT':
        return this.resize(box, dx, 0, true, false, minSize);
      case 'BOTTOM_RIGHT':
        return this.resize(box, dx, dy, true, true, minSize);
      case 'BOTTOM':
        return this.resize(box, 0, dy, false, true, minSize);
      case 'BOTTOM_LEFT':
        return this.resize(box, -dx, dy, true, true, minSize);
      case 'LEFT':
        return this.resize(box, -dx, 0, true, false, minSize);
      default:
        return null;
    }
  }

  private static resize(
    box: TransformBox,
    dx: number,
    dy: number,
    horizontal: boolean,
    vertical: boolean,
    minSize: number
  ): TransformBox {
    const newWidth = horizontal ? Math.max(minSize, box.width + dx) : box.width;
    const newHeight = vertical ? Math.max(minSize, box.height + dy) : box.height;
    const centerShiftX = horizontal ? dx / 2 : 0;
    const centerShiftY = vertical ? dy / 2 : 0;
    return {
      ...box,
      center: {
        x: box.center.x + centerShiftX,
        y: box.center.y + centerShiftY,
      },
      width: Math.min(newWidth, 100000),
      height: Math.min(newHeight, 100000),
    };
  }
}
