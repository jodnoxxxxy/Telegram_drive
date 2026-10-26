import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, Clock, Link as LinkIcon } from 'lucide-react';
import { DriveFile } from '../types';

interface ShareModalProps {
  file: DriveFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  const [expiry, setExpiry] = useState<'1h' | '24h' | '7d' | 'never'>('24h');
  const [passcode, setPasscode] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate share link
  const shareToken = `tgd_${file.id.slice(-6)}_${Date.now().toString(36)}`;
  const shareUrl = `${window.location.origin}/#share=${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121c32]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Share Telegram File</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Direct Access Link
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 rounded flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Link Expiration</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '1h', label: '1 Hour' },
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
                { id: 'never', label: 'No Limit' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExpiry(item.id as any)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    expiry === item.id
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Optional Access Password</span>
            </label>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Leave empty for public link"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#121c32] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
