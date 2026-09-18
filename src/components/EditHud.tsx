import React from 'react';

interface EditHudProps {
  editShapeLabel: string;
  weightPaintMode: boolean;
  onToggleWeightPaint: () => void;
  rigMode: boolean;
  onToggleRigMode: () => void;
  onResetRig: () => void;
  onAddRigJoint: () => void;
  nodeEditorMode: boolean;
  onToggleNodeEditor: () => void;
  onAddNode: () => void;
  onDeleteNode: () => void;
  onRespaceNodes: () => void;
  bezierHandleMode: boolean;
  onToggleBezier: () => void;
  canDeleteNode: boolean;
  sculptMode: boolean;
  onFinishEditing: () => void;
}

export const EditHud: React.FC<EditHudProps> = ({
  editShapeLabel,
  weightPaintMode,
  onToggleWeightPaint,
  rigMode,
  onToggleRigMode,
  onResetRig,
  onAddRigJoint,
  nodeEditorMode,
  onToggleNodeEditor,
  onAddNode,
  onDeleteNode,
  onRespaceNodes,
  bezierHandleMode,
  onToggleBezier,
  canDeleteNode,
  sculptMode,
  onFinishEditing,
}) => {
  return (
    <div
      id="edit-shape-hud"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-xl text-xs text-zinc-200"
    >
      <button
        type="button"
        onClick={onToggleWeightPaint}
        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
          weightPaintMode
            ? 'bg-amber-600 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
      >
        {weightPaintMode ? 'Weight Pose' : editShapeLabel}
      </button>

      {weightPaintMode && (
        <span className="text-[11px] text-amber-400 px-1">Drag joints to pose</span>
      )}

      {/* Rig Controls */}
      <button
        type="button"
        onClick={onToggleRigMode}
        className={`px-2 py-1 rounded-md cursor-pointer ${
          rigMode
            ? 'bg-cyan-600 text-white font-medium'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
      >
        {rigMode ? 'Rig On' : 'Rig'}
      </button>

      {rigMode && (
        <>
          <button
            type="button"
            onClick={onResetRig}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md cursor-pointer"
          >
            Reset Rig
          </button>
          <button
            type="button"
            onClick={onAddRigJoint}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded-md cursor-pointer"
          >
            + Joint
          </button>
        </>
      )}

      {/* Node and Bezier Controls */}
      {!weightPaintMode && !sculptMode && (
        <>
          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          <button
            type="button"
            onClick={onToggleNodeEditor}
            className={`px-2 py-1 rounded-md cursor-pointer ${
              nodeEditorMode
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {nodeEditorMode ? 'Nodes On' : 'Nodes'}
          </button>

          {nodeEditorMode && (
            <>
              <button
                type="button"
                onClick={onAddNode}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                disabled={!canDeleteNode}
                onClick={onDeleteNode}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 rounded-md cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onRespaceNodes}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md cursor-pointer"
              >
                Re-space
              </button>
              <button
                type="button"
                onClick={onToggleBezier}
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  bezierHandleMode
                    ? 'bg-fuchsia-600 text-white font-medium'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {bezierHandleMode ? 'Bezier On' : 'Bezier'}
              </button>
            </>
          )}
        </>
      )}

      <div className="w-px h-4 bg-zinc-700 mx-0.5" />

      <button
        type="button"
        onClick={onFinishEditing}
        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md cursor-pointer"
      >
        Done
      </button>
    </div>
  );
};
