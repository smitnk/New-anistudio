import React, { useState, useEffect } from 'react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onApplyColor: (color: string) => void;
  recentColors: string[];
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  onApplyColor,
  recentColors,
}) => {
  const [hue, setHue] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(1);
  const [value, setValue] = useState<number>(1);
  const [alpha, setAlpha] = useState<number>(1);
  const [hexInput, setHexInput] = useState<string>('#000000');

  // Convert hex to HSV on open
  useEffect(() => {
    if (isOpen) {
      const parsed = hexToHsv(currentColor);
      setHue(parsed.h);
      setSaturation(parsed.s);
      setValue(parsed.v);
      setAlpha(parsed.a);
      setHexInput(currentColor.toUpperCase());
    }
  }, [isOpen, currentColor]);

  if (!isOpen) return null;

  const currentRgb = hsvToRgb(hue, saturation, value);
  const previewRgba = `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${alpha})`;

  const handleApply = () => {
    const hex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b, alpha);
    onApplyColor(hex);
    onClose();
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(val)) {
      const parsed = hexToHsv(val.startsWith('#') ? val : `#${val}`);
      setHue(parsed.h);
      setSaturation(parsed.s);
      setValue(parsed.v);
      setAlpha(parsed.a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        id="color-picker-dialog"
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-zinc-200"
      >
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">Color Picker</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Color preview box */}
        <div
          className="w-full h-14 rounded-lg border border-zinc-700 shadow-inner"
          style={{ backgroundColor: previewRgba }}
        />

        {/* Sliders */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span>Hue</span>
              <span>{Math.round(hue)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Saturation</span>
              <span>{Math.round(saturation * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={saturation}
              onChange={(e) => setSaturation(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-zinc-700 appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Value (Brightness)</span>
              <span>{Math.round(value * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-zinc-700 appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Alpha</span>
              <span>{Math.round(alpha * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-zinc-700 appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">HEX / ARGB</label>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <span className="text-zinc-400 block mb-1.5">Recent colors</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentColors.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const p = hexToHsv(color);
                      setHue(p.h);
                      setSaturation(p.s);
                      setValue(p.v);
                      setAlpha(p.a);
                      setHexInput(color.toUpperCase());
                    }}
                    className="w-7 h-7 shrink-0 rounded-full border border-zinc-600 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// Color math helpers
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0,
    g1 = 0,
    b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 0.999) {
    return `${hex}${toHex(Math.round(a * 255))}`;
  }
  return hex;
}

function hexToHsv(hex: string): { h: number; s: number; v: number; a: number } {
  let clean = hex.replace('#', '');
  let a = 1;
  if (clean.length === 8) {
    // #RRGGBBAA or #AARRGGBB
    a = parseInt(clean.slice(6, 8), 16) / 255;
    clean = clean.slice(0, 6);
  } else if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const num = parseInt(clean, 16) || 0;
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v, a };
}
