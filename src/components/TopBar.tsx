import React, { useRef } from 'react';
import {
  Save,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Undo2,
  Redo2,
} from 'lucide-react';

interface TopBarProps {
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onExportPng: () => void;
  onExportGif: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  statusMessage?: string;
  isExporting?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSaveProject,
  onLoadProject,
  onExportPng,
  onExportGif,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  statusMessage,
  isExporting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
      e.target.value = '';
    }
  };

  return (
    <header
      id="main-topbar"
      className="h-12 bg-zinc-900 border-b border-zinc-800 px-3 flex items-center justify-between shrink-0 select-none"
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          MotionCanvas
        </span>

        {statusMessage && (
          <span
            id="status-toast"
            className="text-xs bg-zinc-800/90 text-blue-400 border border-zinc-700 px-2.5 py-0.5 rounded-full ml-3 animate-pulse"
          >
            {statusMessage}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".motioncanvas,.zip,application/zip"
          className="hidden"
        />

        <button
          id="btn-save-project"
          type="button"
          onClick={onSaveProject}
          title="Save Project (.motioncanvas zip)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Save Project</span>
        </button>

        <button
          id="btn-load-project"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Load Project"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Load Project</span>
        </button>

        <div className="w-px h-4 bg-zinc-800 mx-1 hidden sm:block" />

        <button
          id="btn-export-png"
          type="button"
          onClick={onExportPng}
          title="Export Current Frame as PNG"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Export PNG</span>
        </button>

        <button
          id="btn-export-gif"
          type="button"
          disabled={isExporting}
          onClick={onExportGif}
          title="Export Animated GIF"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 rounded transition-colors cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">{isExporting ? 'Exporting...' : 'Export GIF'}</span>
        </button>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <button
          id="btn-undo"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
          className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          id="btn-redo"
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
          className="p-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
