/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderOpen,
  Upload,
  FolderPlus,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  AlertCircle,
  HardDrive,
  Sparkles,
  Bot,
  Layers,
  Trash2,
} from 'lucide-react';

import {
  DriveFile,
  DriveFolder,
  SafeConfig,
  SortField,
  SortOrder,
  TelegramConfig,
  ViewFilter,
  ViewLayout,
} from './types';
import {
  loadFiles,
  saveFiles,
  loadFolders,
  saveFolders,
  loadSafeConfig,
  saveSafeConfig,
  loadTelegramConfig,
  saveTelegramConfig,
  getFileCategory,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { FolderCard } from './components/FolderCard';
import { FileCard } from './components/FileCard';
import { FileRow } from './components/FileRow';
import { SafeModal } from './components/SafeModal';
import { TelegramSettingsModal } from './components/TelegramSettingsModal';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { ShareModal } from './components/ShareModal';
import { FileViewerModal } from './components/FileViewerModal';

export default function App() {
  // Primary Drive State
  const [files, setFiles] = useState<DriveFile[]>(() => loadFiles());
  const [folders, setFolders] = useState<DriveFolder[]>(() => loadFolders());
  const [safeConfig, setSafeConfig] = useState<SafeConfig>(() => loadSafeConfig());
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => loadTelegramConfig());

  // In-memory zero-knowledge cryptographic key (erased on lock)
  const [activeCryptoKey, setActiveCryptoKey] = useState<CryptoKey | null>(null);

  // Navigation & View State
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modal Dialogs
  const [isSafeModalOpen, setIsSafeModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [uploadDefaultSafe, setUploadDefaultSafe] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [sharingFile, setSharingFile] = useState<DriveFile | null>(null);

  // Global drag-and-drop indicator
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Save files & folders on change
  useEffect(() => {
    saveFiles(files);
  }, [files]);

  useEffect(() => {
    saveFolders(folders);
  }, [folders]);

  // Handle Safe Lock action
  const handleLockSafe = useCallback(() => {
    setActiveCryptoKey(null);
    setSafeConfig((prev) => {
      const updated = { ...prev, isLocked: true };
      saveSafeConfig(updated);
      return updated;
    });
  }, []);

  // Auto-Lock Inactivity Watcher
  useEffect(() => {
    if (!safeConfig.isInitialized || safeConfig.isLocked || !activeCryptoKey) return;
    const timeoutMinutes = safeConfig.autoLockMinutes || 5;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleLockSafe();
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [safeConfig.isInitialized, safeConfig.isLocked, safeConfig.autoLockMinutes, activeCryptoKey, handleLockSafe]);

  // Calculate file counts for sidebar
  const filesCount = useMemo(() => {
    const nonDeleted = files.filter((f) => !f.isDeleted);
    return {
      all: nonDeleted.length,
      safe: nonDeleted.filter((f) => f.isSafe).length,
      starred: nonDeleted.filter((f) => f.isStarred).length,
      media: nonDeleted.filter((f) => {
        const cat = getFileCategory(f);
        return cat === 'image' || cat === 'video';
      }).length,
      documents: nonDeleted.filter((f) => {
        const cat = getFileCategory(f);
        return cat === 'doc' || cat === 'code';
      }).length,
      audio: nonDeleted.filter((f) => getFileCategory(f) === 'audio').length,
      archives: nonDeleted.filter((f) => getFileCategory(f) === 'archive').length,
      trash: files.filter((f) => f.isDeleted).length,
    };
  }, [files]);

  // Calculate total storage volume
  const totalBytes = useMemo(() => {
    return files
      .filter((f) => !f.isDeleted)
      .reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [files]);

  // Filtered and Sorted Files
  const displayFiles = useMemo(() => {
    return files
      .filter((f) => {
        // Handle trash filter
        if (currentFilter === 'trash') {
          return f.isDeleted;
        }
        if (f.isDeleted) return false;

        // Handle Safe Vault filter
        if (currentFilter === 'safe') {
          return f.isSafe;
        }

        // Under normal views (All, Starred, etc.), if Safe is locked, hide safe files for privacy
        if (f.isSafe && (safeConfig.isLocked || !activeCryptoKey)) {
          return false;
        }

        // Category filters
        if (currentFilter === 'starred') return !!f.isStarred;
        if (currentFilter === 'media') {
          const cat = getFileCategory(f);
          return cat === 'image' || cat === 'video';
        }
        if (currentFilter === 'documents') {
          const cat = getFileCategory(f);
          return cat === 'doc' || cat === 'code';
        }
        if (currentFilter === 'audio') return getFileCategory(f) === 'audio';
        if (currentFilter === 'archives') return getFileCategory(f) === 'archive';

        // 'all' filter: filter by currentFolderId
        if (currentFilter === 'all') {
          return f.folderId === currentFolderId;
        }

        return true;
      })
      .filter((f) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesTag = f.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesMime = f.mimeType.toLowerCase().includes(q);
        return matchesName || matchesTag || matchesMime;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortField === 'date') {
          diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortField === 'size') {
          diff = b.size - a.size;
        } else if (sortField === 'type') {
          diff = a.mimeType.localeCompare(b.mimeType);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [files, currentFilter, currentFolderId, searchQuery, sortField, sortOrder, safeConfig.isLocked, activeCryptoKey]);

  // Display Folders for the current view
  const displayFolders = useMemo(() => {
    if (currentFilter === 'trash') return [];
    return folders.filter((folder) => {
      if (folder.isDeleted) return false;
      if (currentFilter === 'safe') {
        return folder.isSafe;
      }
      if (folder.isSafe && (safeConfig.isLocked || !activeCryptoKey)) {
        return false;
      }
      if (currentFilter === 'all') {
        return folder.parentId === currentFolderId;
      }
      return false;
    });
  }, [folders, currentFilter, currentFolderId, safeConfig.isLocked, activeCryptoKey]);

  // Action Handlers
  const handleToggleStar = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  const handleToggleSafeStatus = (fileId: string) => {
    if (!safeConfig.isInitialized || safeConfig.isLocked || !activeCryptoKey) {
      setIsSafeModalOpen(true);
      return;
    }
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const nextSafe = !f.isSafe;
        return {
          ...f,
          isSafe: nextSafe,
          isEncrypted: nextSafe,
          tags: nextSafe ? ['Safe Vault', 'Encrypted'] : (f.tags || []).filter((t) => t !== 'Safe Vault'),
        };
      })
    );
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        if (currentFilter === 'trash') {
          // permanently delete
          return null as any;
        }
        return { ...f, isDeleted: true };
      }).filter(Boolean)
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Orphan files move to root
    setFiles((prev) =>
      prev.map((f) => (f.folderId === folderId ? { ...f, folderId: null } : f))
    );
  };

  const handleDownloadFile = (file: DriveFile) => {
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

  const handleUploadSuccess = (newFiles: DriveFile[]) => {
    setFiles((prev) => [...newFiles, ...prev]);
  };

  const handleCreateFolder = (newFolder: DriveFolder) => {
    setFolders((prev) => [...prev, newFolder]);
  };

  // Telegram Manual Backup
  const handleManualBackup = async (): Promise<boolean> => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) return false;
    try {
      const res = await fetch('/api/telegram/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          catalogData: {
            files,
            folders,
            timestamp: Date.now(),
          },
        }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  };

  const isSafeVaultActive = currentFilter === 'safe';
  const isSafeLocked = isSafeVaultActive && (safeConfig.isLocked || !activeCryptoKey);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        setUploadDefaultSafe(currentFilter === 'safe');
        setIsUploadModalOpen(true);
      }}
      className="flex h-screen w-screen bg-[#0b101b] text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentFilter={currentFilter}
        onSelectFilter={(filter) => {
          setCurrentFilter(filter);
          setCurrentFolderId(null);
        }}
        safeConfig={safeConfig}
        onOpenSafeModal={() => setIsSafeModalOpen(true)}
        onLockSafe={handleLockSafe}
        telegramConfig={telegramConfig}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        filesCount={filesCount}
        totalBytes={totalBytes}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          currentFilter={currentFilter}
          currentFolderId={currentFolderId}
          folders={folders}
          onNavigateFolder={(folderId) => setCurrentFolderId(folderId)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewLayout={viewLayout}
          onViewLayoutChange={setViewLayout}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          safeConfig={safeConfig}
          onOpenSafeModal={() => setIsSafeModalOpen(true)}
          onLockSafe={handleLockSafe}
          onOpenUploadModal={(uploadToSafe) => {
            setUploadDefaultSafe(!!uploadToSafe);
            setIsUploadModalOpen(true);
          }}
          onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* SAFE VAULT LOCKED SCREEN */}
          {isSafeLocked ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Personal Safe Vault is Locked</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Files inside your Personal Safe are encrypted with zero-knowledge AES-256-GCM. Enter your master PIN or biometric key to decrypt and manage your private files.
                </p>
              </div>
              <button
                onClick={() => setIsSafeModalOpen(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  {safeConfig.isInitialized ? 'Unlock Personal Safe' : 'Set Up Personal Safe'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Folders Section (if any in current scope) */}
              {displayFolders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Folders ({displayFolders.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {displayFolders.map((folder) => {
                      const count = files.filter(
                        (f) => f.folderId === folder.id && !f.isDeleted
                      ).length;
                      return (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          fileCount={count}
                          onClick={() => setCurrentFolderId(folder.id)}
                          onDelete={handleDeleteFolder}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Files Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Files ({displayFiles.length})
                  </h3>

                  {currentFilter === 'trash' && displayFiles.length > 0 && (
                    <button
                      onClick={() => setFiles((prev) => prev.filter((f) => !f.isDeleted))}
                      className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Empty Trash</span>
                    </button>
                  )}
                </div>

                {displayFiles.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">No files found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No items match "${searchQuery}". Try a different search.`
                        : currentFilter === 'safe'
                        ? 'Your Safe Vault is empty. Upload or move files here for AES-256 client encryption.'
                        : 'Upload files to Telegram Cloud or create folders to organize your drive.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setUploadDefaultSafe(currentFilter === 'safe');
                          setIsUploadModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm"
                      >
                        Upload File
                      </button>
                      {currentFilter === 'all' && (
                        <button
                          onClick={() => setIsNewFolderModalOpen(true)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
                        >
                          New Folder
                        </button>
                      )}
                    </div>
                  </div>
                ) : viewLayout === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        safeConfig={safeConfig}
                        activeCryptoKey={activeCryptoKey}
                        onPreview={(f) => setPreviewFile(f)}
                        onToggleStar={handleToggleStar}
                        onToggleSafe={handleToggleSafeStatus}
                        onDownload={handleDownloadFile}
                        onShare={(f) => setSharingFile(f)}
                        onDelete={handleDeleteFile}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                          <th className="py-2.5 px-4">Name</th>
                          <th className="py-2.5 px-4">Date Modified</th>
                          <th className="py-2.5 px-4">Size</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayFiles.map((file) => (
                          <FileRow
                            key={file.id}
                            file={file}
                            safeConfig={safeConfig}
                            activeCryptoKey={activeCryptoKey}
                            onPreview={(f) => setPreviewFile(f)}
                            onToggleStar={handleToggleStar}
                            onToggleSafe={handleToggleSafeStatus}
                            onDownload={handleDownloadFile}
                            onShare={(f) => setSharingFile(f)}
                            onDelete={handleDeleteFile}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-blue-950/80 backdrop-blur-sm border-4 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-16 h-16 text-blue-400 animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-white">Drop files to upload to Telegram Drive</h3>
          <p className="text-xs text-blue-200 mt-1">Unlimited Telegram Cloud Storage</p>
        </div>
      )}

      {/* Safe Modal */}
      <SafeModal
        isOpen={isSafeModalOpen}
        onClose={() => setIsSafeModalOpen(false)}
        safeConfig={safeConfig}
        onSaveSafeConfig={(cfg) => {
          setSafeConfig(cfg);
          saveSafeConfig(cfg);
        }}
        onUnlockSuccess={(key) => {
          setActiveCryptoKey(key);
        }}
        onLockSafe={handleLockSafe}
      />

      {/* Telegram Settings Modal */}
      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        config={telegramConfig}
        onSaveConfig={(cfg) => {
          setTelegramConfig(cfg);
          saveTelegramConfig(cfg);
        }}
        onManualBackup={handleManualBackup}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folders={folders}
        currentFolderId={currentFolderId}
        safeConfig={safeConfig}
        activeCryptoKey={activeCryptoKey}
        telegramConfig={telegramConfig}
        defaultToSafe={uploadDefaultSafe}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        parentId={currentFolderId}
        isSafeVault={currentFilter === 'safe'}
        onCreateFolder={handleCreateFolder}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={!!sharingFile}
        file={sharingFile}
        onClose={() => setSharingFile(null)}
      />

      {/* File In-App Viewer Modal */}
      <FileViewerModal
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        safeConfig={safeConfig}
        activeCryptoKey={activeCryptoKey}
        onOpenSafeUnlock={() => setIsSafeModalOpen(true)}
        onToggleStar={handleToggleStar}
        onToggleSafeStatus={handleToggleSafeStatus}
        onDeleteFile={handleDeleteFile}
        onOpenShareModal={(f) => setSharingFile(f)}
      />
    </div>
  );
}
