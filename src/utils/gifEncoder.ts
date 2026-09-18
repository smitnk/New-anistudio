/**
 * Lightweight, zero-dependency in-browser GIF89a encoder
 * Converts HTMLCanvasElement or ImageData sequence into an animated GIF Blob.
 */

export interface GifFrameOptions {
  delayMs: number;
}

export class GifEncoder {
  private width: number;
  private height: number;
  private stream: number[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.writeHeader();
  }

  private writeHeader() {
    // GIF89a
    this.writeString('GIF89a');
    // Logical Screen Descriptor
    this.writeShort(this.width);
    this.writeShort(this.height);
    // GCT Flag: 0, Color Res: 7, Sort: 0, GCT Size: 0
    this.writeByte(0x70);
    this.writeByte(0); // Background Color Index
    this.writeByte(0); // Pixel Aspect Ratio

    // Netscape application block for looping
    this.writeByte(0x21); // Extension Introducer
    this.writeByte(0xff); // Application Extension
    this.writeByte(11); // Block Size
    this.writeString('NETSCAPE2.0');
    this.writeByte(3); // Sub-block size
    this.writeByte(1); // Loop sub-block ID
    this.writeShort(0); // Loop count 0 = infinite
    this.writeByte(0); // Block Terminator
  }

  addFrame(ctx: CanvasRenderingContext2D, delayMs: number = 100) {
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    // Build color palette (quantized up to 256 colors)
    const colorMap = new Map<number, number>();
    const palette: number[][] = [];
    const indexedPixels = new Uint8Array(this.width * this.height);

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      const pixelIdx = i / 4;
      if (a < 128) {
        // Transparent pixel
        indexedPixels[pixelIdx] = 0; // Reserve index 0 for transparent
        continue;
      }
      // Quantize 8-bit to 5-bit for fast clustering if many colors
      const r = data[i] & 0xf8;
      const g = data[i + 1] & 0xf8;
      const b = data[i + 2] & 0xf8;
      const key = (r << 16) | (g << 8) | b;

      let colorIndex = colorMap.get(key);
      if (colorIndex === undefined) {
        if (palette.length < 255) {
          colorIndex = palette.length + 1; // 1-indexed to keep 0 for transparency
          colorMap.set(key, colorIndex);
          palette.push([data[i], data[i + 1], data[i + 2]]);
        } else {
          // Find closest
          let minD = Number.MAX_VALUE;
          let best = 1;
          for (let p = 0; p < palette.length; p++) {
            const dr = palette[p][0] - data[i];
            const dg = palette[p][1] - data[i + 1];
            const db = palette[p][2] - data[i + 2];
            const d = dr * dr + dg * dg + db * db;
            if (d < minD) {
              minD = d;
              best = p + 1;
            }
          }
          colorIndex = best;
        }
      }
      indexedPixels[pixelIdx] = colorIndex;
    }

    // Pad palette to power of 2 (at least 2, max 256)
    let palSize = Math.max(2, palette.length + 1);
    let pow = 1;
    while (1 << pow < palSize && pow < 8) {
      pow++;
    }
    const fullPalSize = 1 << pow;

    // Graphic Control Extension
    this.writeByte(0x21); // Extension
    this.writeByte(0xf9); // Graphic Control
    this.writeByte(4); // Block size
    this.writeByte(0x09); // Disposal: restore to background, transparent flag: 1
    this.writeShort(Math.max(1, Math.round(delayMs / 10))); // Delay time in hundredths of a second
    this.writeByte(0); // Transparent color index = 0
    this.writeByte(0); // Terminator

    // Image Descriptor
    this.writeByte(0x2c);
    this.writeShort(0); // Left
    this.writeShort(0); // Top
    this.writeShort(this.width);
    this.writeShort(this.height);
    // Local Color Table Flag = 1, Interlace = 0, Sort = 0, Size = pow - 1
    this.writeByte(0x80 | (pow - 1));

    // Write Local Color Table
    // Index 0: transparent dummy color
    this.writeByte(0);
    this.writeByte(0);
    this.writeByte(0);
    for (let i = 0; i < palette.length; i++) {
      this.writeByte(palette[i][0]);
      this.writeByte(palette[i][1]);
      this.writeByte(palette[i][2]);
    }
    for (let i = palette.length + 1; i < fullPalSize; i++) {
      this.writeByte(0);
      this.writeByte(0);
      this.writeByte(0);
    }

    // LZW Compression
    this.compressLZW(indexedPixels, Math.max(2, pow));
  }

  private compressLZW(pixels: Uint8Array, minCodeSize: number) {
    this.writeByte(minCodeSize);
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 1 << 12;

    const dict = new Map<string, number>();
    const resetDict = () => {
      dict.clear();
      for (let i = 0; i < clearCode; i++) {
        dict.set(String.fromCharCode(i), i);
      }
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    };
    resetDict();

    const bitBuffer: number[] = [];
    let curBits = 0;
    let curVal = 0;

    const emitBits = (code: number, bits: number) => {
      curVal |= code << curBits;
      curBits += bits;
      while (curBits >= 8) {
        bitBuffer.push(curVal & 0xff);
        curVal >>= 8;
        curBits -= 8;
      }
    };

    emitBits(clearCode, codeSize);

    let prefix = '';
    for (let i = 0; i < pixels.length; i++) {
      const c = String.fromCharCode(pixels[i]);
      const combined = prefix + c;
      if (dict.has(combined)) {
        prefix = combined;
      } else {
        emitBits(dict.get(prefix)!, codeSize);
        if (nextCode < maxCode) {
          dict.set(combined, nextCode++);
          if (nextCode > 1 << codeSize && codeSize < 12) {
            codeSize++;
          }
        } else {
          emitBits(clearCode, codeSize);
          resetDict();
        }
        prefix = c;
      }
    }
    if (prefix !== '') {
      emitBits(dict.get(prefix)!, codeSize);
    }
    emitBits(eoiCode, codeSize);

    if (curBits > 0) {
      bitBuffer.push(curVal & 0xff);
    }

    // Write sub-blocks of max 255 bytes
    let offset = 0;
    while (offset < bitBuffer.length) {
      const chunkSize = Math.min(255, bitBuffer.length - offset);
      this.writeByte(chunkSize);
      for (let b = 0; b < chunkSize; b++) {
        this.writeByte(bitBuffer[offset + b]);
      }
      offset += chunkSize;
    }
    this.writeByte(0); // Block Terminator
  }

  finish(): Uint8Array {
    this.writeByte(0x3b); // Trailer
    return new Uint8Array(this.stream);
  }

  private writeByte(b: number) {
    this.stream.push(b & 0xff);
  }

  private writeShort(s: number) {
    this.stream.push(s & 0xff);
    this.stream.push((s >> 8) & 0xff);
  }

  private writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      this.stream.push(s.charCodeAt(i));
    }
  }
}
