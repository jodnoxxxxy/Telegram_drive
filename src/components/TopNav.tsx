import React from 'react';
import {
  Search,
  Upload,
  FolderPlus,
  LayoutGrid,
  List,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Home,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';
import { DriveFolder, SafeConfig, SortField, SortOrder, ViewFilter, ViewLayout } from '../types';

interface TopNavProps {
  currentFilter: ViewFilter;
  currentFolderId: string | null;
  folders: DriveFolder[];
  onNavigateFolder: (folderId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewLayout: ViewLayout;
  onViewLayoutChange: (layout: ViewLayout) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  safeConfig: SafeConfig;
  onOpenSafeModal: () => void;
  onLockSafe: () => void;
  onOpenUploadModal: (uploadToSafe?: boolean) => void;
  onOpenNewFolderModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentFilter,
  currentFolderId,
  folders,
  onNavigateFolder,
  searchQuery,
  onSearchChange,
  viewLayout,
  onViewLayoutChange,
  sortField,
  sortOrder,
  onSortChange,
  safeConfig,
  onOpenSafeModal,
  onLockSafe,
  onOpenUploadModal,
  onOpenNewFolderModal,
}) => {
  const isSafeUnlocked = safeConfig.isInitialized && !safeConfig.isLocked;
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // Generate breadcrumb trail
  const getBreadcrumbs = () => {
    if (currentFilter === 'safe') {
      return [{ id: 'safe-root', name: 'Personal Safe Vault', isSafe: true }];
    }
    if (currentFilter !== 'all') {
      const labels: Record<string, string> = {
        starred: 'Starred Files',
        media: 'Photos & Videos',
        documents: 'Documents & Code',
        audio: 'Audio & Music',
        archives: 'Archives & Zips',
        trash: 'Trash Bin',
      };
      return [{ id: currentFilter, name: labels[currentFilter] || 'Files' }];
    }

    const trail: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }];
    if (currentFolder) {
      trail.push({ id: currentFolder.id, name: currentFolder.name });
    }
    return trail;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-[#0b101b] border-b border-slate-800 px-6 flex items-center justify-between gap-6 shrink-0">
      {/* Zone 1: Breadcrumb Trail Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 overflow-hidden shrink-0">
        <button
          onClick={() => onNavigateFolder(null)}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-blue-400" />
          <span>Drive</span>
        </button>

        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id || idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onNavigateFolder(crumb.id as string | null)}
              className={`truncate max-w-[180px] hover:text-white transition-colors ${
                idx === breadcrumbs.length - 1 ? 'text-slate-100 font-semibold' : 'text-slate-400'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Zone 2: Live Search & View Controls */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files by name or tag..."
            className="w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* View Layout Toggle */}
        <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => onViewLayoutChange('grid')}
            title="Grid view"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewLayout === 'grid'
                ? 'bg-slate-800 text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewLayoutChange('list')}
            title="List view"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewLayout === 'list'
                ? 'bg-slate-800 text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center shrink-0">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
              onSortChange(f, o);
            }}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="size-desc">Size (Largest)</option>
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Lock / Safe Status Button */}
        {currentFilter === 'safe' && (
          <button
            onClick={isSafeUnlocked ? onLockSafe : onOpenSafeModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isSafeUnlocked
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
            }`}
          >
            {isSafeUnlocked ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Vault</span>
              </>
            )}
          </button>
        )}

        {/* New Folder */}
        <button
          onClick={onOpenNewFolderModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
          <span>New Folder</span>
        </button>

        {/* Upload File */}
        <button
          onClick={() => onOpenUploadModal(currentFilter === 'safe')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{currentFilter === 'safe' ? 'Encrypt & Upload' : 'Upload File'}</span>
        </button>
      </div>
    </header>
  );
};
