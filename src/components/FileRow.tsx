import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Code,
  Archive,
  Lock,
  Star,
  Download,
  Share2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { DriveFile, SafeConfig } from '../types';
import { formatBytes, formatDate, getFileCategory } from '../utils/storage';

interface FileRowProps {
  file: DriveFile;
  safeConfig: SafeConfig;
  activeCryptoKey: CryptoKey | null;
  onPreview: (file: DriveFile) => void;
  onToggleStar: (fileId: string) => void;
  onToggleSafe: (fileId: string) => void;
  onDownload: (file: DriveFile) => void;
  onShare: (file: DriveFile) => void;
  onDelete: (fileId: string) => void;
}

export const FileRow: React.FC<FileRowProps> = ({
  file,
  safeConfig,
  activeCryptoKey,
  onPreview,
  onToggleStar,
  onToggleSafe,
  onDownload,
  onShare,
  onDelete,
}) => {
  const category = getFileCategory(file);
  const isSafeLocked = (file.isSafe || file.isEncrypted) && (safeConfig.isLocked || !activeCryptoKey);

  const renderIcon = () => {
    if (file.isSafe || file.isEncrypted) {
      return isSafeLocked ? (
        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
      );
    }
    switch (category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <tr
      onClick={() => onPreview(file)}
      className="group hover:bg-[#121c33] border-b border-slate-800/60 cursor-pointer transition-colors text-xs select-none"
    >
      {/* File Name & Icon */}
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file.id);
            }}
            className={`p-1 rounded transition-colors ${
              file.isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>

          {renderIcon()}

          <span className="font-medium text-slate-200 group-hover:text-white truncate max-w-xs">
            {file.name}
          </span>

          {file.isSafe && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/30">
              Safe
            </span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="py-2.5 px-4 text-slate-400 font-mono tabular-nums whitespace-nowrap">
        {formatDate(file.createdAt)}
      </td>

      {/* Size */}
      <td className="py-2.5 px-4 text-slate-400 font-mono tabular-nums whitespace-nowrap">
        {formatBytes(file.size)}
      </td>

      {/* Format */}
      <td className="py-2.5 px-4 text-slate-400 font-mono truncate max-w-[140px]">
        {file.mimeType}
      </td>

      {/* Actions */}
      <td className="py-2.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(file);
            }}
            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSafe(file.id);
            }}
            className={`p-1 rounded transition-colors ${
              file.isSafe ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
            }`}
            title={file.isSafe ? 'Remove from Safe' : 'Encrypt into Safe'}
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file.id);
            }}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
