import React, { useState } from 'react';
import { X, FolderPlus, Lock } from 'lucide-react';
import { DriveFolder } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  isSafeVault: boolean;
  onCreateFolder: (folder: DriveFolder) => void;
}

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  parentId,
  isSafeVault,
  onCreateFolder,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [isSafe, setIsSafe] = useState(isSafeVault);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please provide a folder name');
      return;
    }

    const folder: DriveFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      parentId,
      createdAt: new Date().toISOString(),
      isSafe,
      color: selectedColor,
    };

    onCreateFolder(folder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#121c32]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Create New Folder</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && <p className="text-xs text-red-400">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Folder Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Work Documents"
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Folder Accent Color</label>
            <div className="flex items-center gap-3">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-white/60 ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Store in Safe Vault</p>
                <p className="text-[10px] text-slate-400">Folder will be encrypted in Safe</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isSafe}
              onChange={(e) => setIsSafe(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#121c32] flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
