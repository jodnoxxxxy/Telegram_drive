import React, { useState } from 'react';
import {
  X,
  Bot,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  UploadCloud,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { TelegramConfig } from '../types';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TelegramConfig;
  onSaveConfig: (newConfig: TelegramConfig) => void;
  onManualBackup: () => Promise<boolean>;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onManualBackup,
}) => {
  if (!isOpen) return null;

  const [botToken, setBotToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [showToken, setShowToken] = useState(false);
  const [autoBackup, setAutoBackup] = useState(config.autoBackupCatalog ?? true);
  const [maxChunkSize, setMaxChunkSize] = useState(config.maxChunkSizeMB || 20);

  const [isTesting, setIsTesting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    bot?: any;
    chat?: any;
    chatWarning?: string;
    error?: string;
  } | null>(null);

  // Test Connection to Telegram
  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      setTestResult({ success: false, error: 'Please enter your Telegram Bot Token.' });
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim() || undefined,
        }),
      });

      const data = await res.json();
      setTestResult(data);

      if (data.success && data.bot) {
        onSaveConfig({
          ...config,
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          botUsername: data.bot.username ? `@${data.bot.username}` : undefined,
          botName: data.bot.first_name,
          chatTitle: data.chat ? data.chat.title || data.chat.first_name : undefined,
          isConnected: true,
          autoBackupCatalog: autoBackup,
          maxChunkSizeMB: maxChunkSize,
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      isConnected: !!(botToken.trim() && chatId.trim()),
      autoBackupCatalog: autoBackup,
      maxChunkSizeMB: maxChunkSize,
    });
    onClose();
  };

  const handleTriggerBackup = async () => {
    try {
      setIsBackingUp(true);
      await onManualBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121c32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Telegram Bot & Cloud Setup</h2>
              <p className="text-[11px] text-slate-400">Personal Unlimited Storage Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Setup Instructions Accordion/Banner */}
          <div className="p-3.5 bg-blue-950/20 border border-blue-800/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to connect your personal Telegram Drive:</span>
            </div>
            <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed pl-1">
              <li>
                Open Telegram and search for <strong>@BotFather</strong>, send <code className="text-blue-400">/newbot</code>, and copy the Bot Token.
              </li>
              <li>
                Create a private Telegram Channel (or use your Saved Messages) and add your bot as an administrator.
              </li>
              <li>
                Forward any message from that channel to <strong>@userinfobot</strong> or <strong>@getmyid_bot</strong> to get the Channel ID (usually starts with <code className="text-blue-400">-100...</code>).
              </li>
            </ol>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telegram Bot Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Chat ID or Channel ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. -1001928374650 or your private user ID"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Files and Safe encrypted chunks will be stored in this private chat/channel.
              </p>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !botToken}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 text-xs font-medium text-blue-300 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Telegram Bot API...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test Bot Connection & Permissions</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Results Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-red-950/30 border-red-800/50 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Bot Verified: {testResult.bot?.first_name} (@{testResult.bot?.username})</span>
                    </div>
                    {testResult.chat ? (
                      <p className="text-[11px] text-emerald-200/80">
                        Chat verified: {testResult.chat.title || testResult.chat.first_name} ({testResult.chat.type})
                      </p>
                    ) : testResult.chatWarning ? (
                      <p className="text-[11px] text-amber-300 mt-1">
                        {testResult.chatWarning}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{testResult.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Preferences */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Max Chunk Size for Large Files</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setMaxChunkSize(size)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        maxChunkSize === size
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {size} MB / chunk
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Catalog Backup Toggle */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">Catalog Cloud Sync</p>
                  <p className="text-[11px] text-slate-400">
                    Automatically backup directory index to Telegram
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
                />
              </div>

              {/* Manual Backup Trigger */}
              {config.isConnected && (
                <button
                  type="button"
                  onClick={handleTriggerBackup}
                  disabled={isBackingUp}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isBackingUp ? 'Syncing Catalog...' : 'Backup Catalog to Telegram Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#121c32] flex items-center justify-between">
          <button
            onClick={() => {
              // Quick reset to demo
              setBotToken('');
              setChatId('');
              setTestResult(null);
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear / Offline Mode
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
