import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Star,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Share2,
  FileText,
  Calendar,
  HardDrive,
  Maximize2,
} from 'lucide-react';
import { DriveFile, SafeConfig } from '../types';
import { formatBytes, formatDate } from '../utils/storage';

interface FileViewerModalProps {
  file: DriveFile | null;
  isOpen: boolean;
  onClose: () => void;
  safeConfig: SafeConfig;
  activeCryptoKey: CryptoKey | null;
  onOpenSafeUnlock: () => void;
  onToggleStar: (fileId: string) => void;
  onToggleSafeStatus: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenShareModal: (file: DriveFile) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  isOpen,
  onClose,
  safeConfig,
  activeCryptoKey,
  onOpenSafeUnlock,
  onToggleStar,
  onToggleSafeStatus,
  onDeleteFile,
  onOpenShareModal,
}) => {
  if (!isOpen || !file) return null;

  const isSafeLocked = (file.isSafe || file.isEncrypted) && (safeConfig.isLocked || !activeCryptoKey);

  // Image controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Audio controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video controls
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Copy code state
  const [copiedCode, setCopiedCode] = useState(false);

  // Reset state on file change
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [file.id]);

  const mime = file.mimeType.toLowerCase();
  const name = file.name.toLowerCase();

  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)$/.test(name);
  const isVideo = mime.startsWith('video/') || /\.(mp4|webm|mkv|mov)$/.test(name);
  const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/.test(name);
  const isCode = /\.(ts|tsx|js|jsx|json|py|rs|go|html|css|sql|sh|yaml|yml)$/.test(name);
  const isMarkdown = /\.md$/.test(name);

  // Audio time format
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyText = () => {
    if (file.textContent) {
      navigator.clipboard.writeText(file.textContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownload = () => {
    if (file.contentUrl) {
      const a = document.createElement('a');
      a.href = file.contentUrl;
      a.download = file.name;
      a.click();
    } else if (file.textContent) {
      const blob = new Blob([file.textContent], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-slate-800 bg-[#10192d] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{file.name}</h3>
            {file.isSafe && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                <span>Safe Encrypted</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Star Button */}
            <button
              onClick={() => onToggleStar(file.id)}
              className={`p-2 rounded-lg border transition-colors ${
                file.isStarred
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={file.isStarred ? 'Remove from starred' : 'Add to starred'}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            {/* Toggle Safe Status */}
            <button
              onClick={() => onToggleSafeStatus(file.id)}
              className={`p-2 rounded-lg border transition-colors ${
                file.isSafe
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400'
              }`}
              title={file.isSafe ? 'Remove from Safe Vault' : 'Move to Safe Vault (Encrypt)'}
            >
              {file.isSafe ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>

            {/* Share Link */}
            <button
              onClick={() => onOpenShareModal(file)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Share link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => {
                onDeleteFile(file.id);
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-800 mx-1" />

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer Center Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visualizer Area */}
          <div className="flex-1 bg-[#090d18] relative flex items-center justify-center overflow-auto p-4 select-none">
            {/* If file is in Safe and Safe is LOCKED */}
            {isSafeLocked ? (
              <div className="text-center p-8 max-w-sm space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">Vault File Locked</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This file is encrypted with AES-256-GCM. Unlock your Personal Safe to decrypt and preview.
                  </p>
                </div>
                <button
                  onClick={onOpenSafeUnlock}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 mx-auto"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Personal Safe</span>
                </button>
              </div>
            ) : isImage ? (
              /* Image Viewer with Zoom & Rotate */
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <div className="overflow-hidden flex items-center justify-center flex-1 w-full max-h-full">
                  <img
                    src={file.contentUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>'}
                    alt={file.name}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                  />
                </div>

                {/* Floating Image Control Bar */}
                <div className="absolute bottom-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-xl">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 min-w-[45px] text-center tabular-nums">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : isAudio ? (
              /* Audio Player with Animated Visualizer Bars */
              <div className="w-full max-w-md p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col items-center gap-6">
                <audio
                  ref={audioRef}
                  src={file.contentUrl}
                  onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                  onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Animated Audio Waveform Simulation */}
                <div className="flex items-center justify-center gap-1.5 h-20 w-full px-4">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const heightPercent = isPlaying
                      ? 20 + Math.sin((i + currentTime * 8) * 0.5) * 50 + ((i % 5) * 6)
                      : 15;
                    return (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-75"
                        style={{ height: `${Math.max(10, Math.min(100, heightPercent))}%` }}
                      />
                    );
                  })}
                </div>

                {/* Scrubber */}
                <div className="w-full space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (audioRef.current) audioRef.current.currentTime = val;
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (!audioRef.current) return;
                      if (isPlaying) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        audioRef.current.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (audioRef.current) audioRef.current.muted = !isMuted;
                    }}
                    className="p-2 text-slate-400 hover:text-slate-200"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : isVideo ? (
              /* Video Player */
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={file.contentUrl}
                  controls
                  className="max-h-[70vh] max-w-full rounded-xl shadow-2xl bg-black"
                />
              </div>
            ) : isCode || isMarkdown ? (
              /* Code or Markdown Viewer */
              <div className="w-full h-full bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{file.name}</span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                  {file.textContent || '// No text content preview available'}
                </div>
              </div>
            ) : (
              /* Document / Binary Fallback Viewer */
              <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{file.mimeType}</p>
                </div>

                {file.textContent ? (
                  <div className="p-3 bg-black/40 border border-slate-800 rounded-lg text-left text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                    {file.textContent}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This file is securely stored on Telegram Cloud. Click download to open with your local application.
                  </p>
                )}

                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Information Sidebar */}
          <div className="w-72 bg-[#0d1424] border-l border-slate-800 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  File Details
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Size</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Format / MIME</span>
                    <span className="font-mono text-slate-200 break-all">{file.mimeType}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Created</span>
                    <span className="text-slate-200">{formatDate(file.createdAt)}</span>
                  </div>

                  {file.telegramMessageId && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Telegram Message ID</span>
                      <span className="font-mono text-blue-400 tabular-nums">
                        #{file.telegramMessageId}
                      </span>
                    </div>
                  )}

                  {file.isSafe && (
                    <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                      <span className="text-emerald-400 font-semibold block text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        AES-256-GCM
                      </span>
                      <p className="text-[10px] text-emerald-200/80 mt-0.5">
                        Client-side encrypted payload. Zero-knowledge on Telegram servers.
                      </p>
                    </div>
                  )}

                  {file.tags && file.tags.length > 0 && (
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">Tags</span>
                      <div className="text-xs text-slate-300">
                        {file.tags.join(' · ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Encrypted Cloud Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
