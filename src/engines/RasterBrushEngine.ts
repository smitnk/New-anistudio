import { Offset, BrushType } from '../types';

export class RasterBrushEngine {
  static pointInPolygon(point: Offset, polygon: Offset[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    let j = polygon.length - 1;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[j];
      const intersects =
        a.y > point.y !== b.y > point.y &&
        point.x <
          ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y !== 0 ? b.y - a.y : 0.0001) +
            a.x;
      if (intersects) inside = !inside;
      j = i;
    }
    return inside;
  }

  static drawStroke(
    ctx: CanvasRenderingContext2D,
    points: Offset[],
    pressures: number[] | undefined,
    color: string,
    brushSize: number,
    opacity: number,
    brushType: BrushType,
    alphaLock: boolean = false,
    eraser: boolean = false,
    pressureEnabled: boolean = true,
    taper: number = 0,
    deepBrushEngine: boolean = true
  ) {
    if (points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      if (alphaLock) {
        ctx.globalCompositeOperation = 'source-atop';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    const baseWidth = ((): number => {
      switch (brushType) {
        case 'Pen':
          return brushSize;
        case 'Marker':
          return brushSize * 1.35;
        case 'Airbrush':
          return brushSize * 1.8;
        case 'Pencil':
          return brushSize * 0.82;
        default:
          return brushSize;
      }
    })();

    if (brushType === 'Airbrush') {
      ctx.shadowBlur = baseWidth * 0.4;
      ctx.shadowColor = color;
    }

    const hasPressure =
      pressureEnabled &&
      pressures &&
      pressures.length >= points.length &&
      brushType !== 'Marker';

    if (points.length === 1) {
      const p = points[0];
      const pVal = hasPressure ? Math.max(0.05, Math.min(1.25, pressures![0])) : 1;
      const r = (baseWidth * (hasPressure ? 0.45 + pVal * 0.85 : 1)) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (hasPressure) {
      const lastIndex = Math.max(1, points.length - 1);
      for (let i = 0; i < points.length; i++) {
        const p = Math.max(0.05, Math.min(1.25, pressures![i]));
        const taperFactor = 1 - taper * (i / lastIndex);
        const dynamicWidth = Math.max(0.5, baseWidth * (0.45 + p * 0.85) * taperFactor);
        const dynamicOpacity = Math.max(0.01, Math.min(1, opacity * (0.45 + p * 0.55)));
        ctx.globalAlpha = dynamicOpacity;
        ctx.lineWidth = dynamicWidth;

        if (i === 0) {
          ctx.beginPath();
          ctx.arc(points[i].x, points[i].y, dynamicWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
      }
    } else {
      ctx.lineWidth = Math.max(1, baseWidth);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  static floodFill(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startX: number,
    startY: number,
    fillRgba: [number, number, number, number],
    tolerance: number = 12
  ) {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startIndex = (startY * width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    const [fillR, fillG, fillB, fillA] = fillRgba;

    if (
      targetR === fillR &&
      targetG === fillG &&
      targetB === fillB &&
      targetA === fillA
    ) {
      return;
    }

    const near = (r: number, g: number, b: number, a: number): boolean => {
      return (
        Math.abs(r - targetR) <= tolerance &&
        Math.abs(g - targetG) <= tolerance &&
        Math.abs(b - targetB) <= tolerance &&
        Math.abs(a - targetA) <= tolerance
      );
    };

    const visited = new Uint8Array(width * height);
    const queueX = new Int32Array(width * height);
    const queueY = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    queueX[tail] = startX;
    queueY[tail++] = startY;
    visited[startY * width + startX] = 1;

    while (head < tail) {
      const x = queueX[head];
      const y = queueY[head++];
      const idx = (y * width + x) * 4;

      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      const neighbors = [
        x - 1,
        y,
        x + 1,
        y,
        x,
        y - 1,
        x,
        y + 1,
      ];

      for (let i = 0; i < neighbors.length; i += 2) {
        const nx = neighbors[i];
        const ny = neighbors[i + 1];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = ny * width + nx;
          if (!visited[nIndex]) {
            const pixelIdx = nIndex * 4;
            if (
              near(
                data[pixelIdx],
                data[pixelIdx + 1],
                data[pixelIdx + 2],
                data[pixelIdx + 3]
              )
            ) {
              visited[nIndex] = 1;
              queueX[tail] = nx;
              queueY[tail++] = ny;
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }
}
