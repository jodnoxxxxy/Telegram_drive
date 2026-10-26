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
  ShieldAlert,
} from 'lucide-react';
import { DriveFile, SafeConfig } from '../types';
import { formatBytes, formatDate, getFileCategory } from '../utils/storage';

interface FileCardProps {
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

export const FileCard: React.FC<FileCardProps> = ({
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
        <Lock className="w-8 h-8 text-amber-400" />
      ) : (
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
      );
    }
    switch (category) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-sky-400" />;
      case 'video':
        return <Video className="w-8 h-8 text-indigo-400" />;
      case 'audio':
        return <Music className="w-8 h-8 text-purple-400" />;
      case 'code':
        return <Code className="w-8 h-8 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-amber-400" />;
      default:
        return <FileText className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div
      onClick={() => onPreview(file)}
      className="group relative bg-[#0e1628] hover:bg-[#121c33] border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between shadow-sm select-none"
    >
      {/* Top Preview Canvas or Icon */}
      <div className="h-32 w-full rounded-lg bg-[#090e1c] border border-slate-800/80 overflow-hidden flex items-center justify-center relative mb-3">
        {category === 'image' && file.contentUrl && !file.isSafe ? (
          <img
            src={file.contentUrl}
            alt={file.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            {renderIcon()}
            {file.isSafe && (
              <span className="text-[10px] font-mono text-slate-400">
                {isSafeLocked ? 'Encrypted' : 'Decrypted'}
              </span>
            )}
          </div>
        )}

        {/* Floating Star Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(file.id);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all ${
            file.isStarred
              ? 'bg-amber-500/20 text-amber-400'
              : 'opacity-0 group-hover:opacity-100 bg-slate-900/80 text-slate-400 hover:text-amber-400'
          }`}
          title={file.isStarred ? 'Starred' : 'Add to Starred'}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      {/* Middle: File Name and Zero-Pill Clean Metadata */}
      <div>
        <p
          className="text-xs font-semibold text-slate-200 group-hover:text-white truncate"
          title={file.name}
        >
          {file.name}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
          <span>{formatBytes(file.size)}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>

      {/* Bottom Context Hover Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-slate-400">
        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
          {file.telegramMessageId ? `#${file.telegramMessageId}` : 'Local'}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-1 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(file);
            }}
            className="p-1 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
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
              file.isSafe
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'hover:text-emerald-400 hover:bg-slate-800'
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
            className="p-1 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
