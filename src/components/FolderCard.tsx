import React from 'react';
import { Folder, Lock, Trash2, MoreVertical } from 'lucide-react';
import { DriveFolder } from '../types';

interface FolderCardProps {
  folder: DriveFolder;
  fileCount: number;
  onClick: () => void;
  onDelete: (folderId: string) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  fileCount,
  onClick,
  onDelete,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0e1628] hover:bg-[#121c33] border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all duration-150 flex items-center justify-between shadow-sm select-none"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: `${folder.color || '#3B82F6'}1A`, color: folder.color || '#3B82F6' }}
        >
          {folder.isSafe ? <Lock className="w-5 h-5" /> : <Folder className="w-5 h-5 fill-current opacity-80" />}
        </div>
        <div className="truncate">
          <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
            {folder.name}
          </p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
            {fileCount} {fileCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(folder.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800 transition-all"
        title="Delete Folder"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
