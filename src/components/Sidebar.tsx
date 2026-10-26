import React from 'react';
import {
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Star,
  Image,
  FileText,
  Music,
  Trash2,
  FolderOpen,
  Bot,
  Settings,
  Sparkles,
  ExternalLink,
  Archive,
} from 'lucide-react';
import { SafeConfig, TelegramConfig, ViewFilter } from '../types';
import { formatBytes } from '../utils/storage';

interface SidebarProps {
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  safeConfig: SafeConfig;
  onOpenSafeModal: () => void;
  onLockSafe: () => void;
  telegramConfig: TelegramConfig;
  onOpenTelegramModal: () => void;
  filesCount: {
    all: number;
    safe: number;
    starred: number;
    media: number;
    documents: number;
    audio: number;
    archives: number;
    trash: number;
  };
  totalBytes: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onSelectFilter,
  safeConfig,
  onOpenSafeModal,
  onLockSafe,
  telegramConfig,
  onOpenTelegramModal,
  filesCount,
  totalBytes,
}) => {
  const isSafeUnlocked = safeConfig.isInitialized && !safeConfig.isLocked;

  const navItems = [
    { id: 'all' as ViewFilter, label: 'All Files', icon: FolderOpen, count: filesCount.all },
    {
      id: 'safe' as ViewFilter,
      label: 'Safe Vault',
      icon: isSafeUnlocked ? Unlock : Lock,
      count: filesCount.safe,
      isSpecial: true,
      safeLocked: !isSafeUnlocked,
    },
    { id: 'starred' as ViewFilter, label: 'Starred', icon: Star, count: filesCount.starred },
    { id: 'media' as ViewFilter, label: 'Photos & Videos', icon: Image, count: filesCount.media },
    { id: 'documents' as ViewFilter, label: 'Documents & Code', icon: FileText, count: filesCount.documents },
    { id: 'audio' as ViewFilter, label: 'Audio & Music', icon: Music, count: filesCount.audio },
    { id: 'archives' as ViewFilter, label: 'Archives & Zips', icon: Archive, count: filesCount.archives },
    { id: 'trash' as ViewFilter, label: 'Trash Bin', icon: Trash2, count: filesCount.trash },
  ];

  return (
    <aside className="w-64 bg-[#0d1424] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-full">
      {/* Top Brand */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                Telegram Drive
                <span className="text-[10px] text-blue-400 font-mono font-medium">Safe</span>
              </h1>
              <p className="text-[11px] text-slate-400">Personal Cloud Storage</p>
            </div>
          </div>
        </div>

        {/* Safe Vault Banner Status Card */}
        <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isSafeUnlocked
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isSafeUnlocked ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {isSafeUnlocked ? 'Safe Unlocked' : 'Safe Locked'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  AES-256-GCM
                </p>
              </div>
            </div>

            {isSafeUnlocked ? (
              <button
                onClick={onLockSafe}
                title="Lock Safe Vault now"
                className="px-2 py-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-md transition-colors"
              >
                Lock
              </button>
            ) : (
              <button
                onClick={onOpenSafeModal}
                className="px-2 py-1 text-[11px] font-medium text-blue-300 hover:text-blue-200 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 rounded-md transition-colors"
              >
                Unlock
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectFilter(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      item.isSpecial
                        ? isSafeUnlocked
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                        : isActive
                        ? 'text-blue-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Storage & Telegram Connection Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Telegram Cloud Storage Status */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              Cloud Volume
            </span>
            <span className="font-mono text-[11px] text-slate-300 tabular-nums">
              {formatBytes(totalBytes)}
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: '45%' }} title="Media" />
            <div className="h-full bg-purple-500" style={{ width: '30%' }} title="Docs" />
            <div className="h-full bg-emerald-500" style={{ width: '25%' }} title="Encrypted Safe" />
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
            <span>Telegram Channel</span>
            <span className="text-blue-400 font-medium">Unlimited</span>
          </div>
        </div>

        {/* Telegram Bot Connector Status Button */}
        <button
          onClick={onOpenTelegramModal}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                telegramConfig.isConnected
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-[11px] font-medium text-slate-200 truncate">
                {telegramConfig.isConnected
                  ? telegramConfig.botUsername || telegramConfig.botName || 'Telegram Bot'
                  : 'Connect Telegram Bot'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {telegramConfig.isConnected ? 'Connected & Synced' : 'Click to configure'}
              </p>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0 hover:text-slate-200" />
        </button>
      </div>
    </aside>
  );
};
