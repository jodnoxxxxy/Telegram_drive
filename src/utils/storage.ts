import { DriveFile, DriveFolder, SafeConfig, TelegramConfig } from '../types';

const STORAGE_KEYS = {
  FILES: 'tg_drive_files_v1',
  FOLDERS: 'tg_drive_folders_v1',
  TELEGRAM_CONFIG: 'tg_drive_config_v1',
  SAFE_CONFIG: 'tg_drive_safe_config_v1',
};

// Initial realistic seed items for immediate out-of-the-box exploration
const INITIAL_FOLDERS: DriveFolder[] = [
  {
    id: 'folder-documents',
    name: 'Personal Documents',
    parentId: null,
    createdAt: '2026-10-20T10:15:00.000Z',
    isSafe: false,
    color: '#3B82F6',
  },
  {
    id: 'folder-media',
    name: 'Photography & Media',
    parentId: null,
    createdAt: '2026-10-21T14:30:00.000Z',
    isSafe: false,
    color: '#10B981',
  },
  {
    id: 'folder-projects',
    name: 'Development & Scripts',
    parentId: null,
    createdAt: '2026-10-22T09:45:00.000Z',
    isSafe: false,
    color: '#8B5CF6',
  },
  {
    id: 'folder-safe-finances',
    name: 'Bank & Tax Statements',
    parentId: null,
    createdAt: '2026-10-23T16:00:00.000Z',
    isSafe: true, // Inside Safe
    color: '#EC4899',
  },
  {
    id: 'folder-safe-keys',
    name: 'Private Keys & Recovery',
    parentId: null,
    createdAt: '2026-10-23T16:05:00.000Z',
    isSafe: true, // Inside Safe
    color: '#F59E0B',
  },
];

const INITIAL_FILES: DriveFile[] = [
  {
    id: 'file-1',
    name: 'Architecture_Specification.md',
    size: 24580,
    mimeType: 'text/markdown',
    folderId: 'folder-documents',
    createdAt: '2026-10-24T11:20:00.000Z',
    updatedAt: '2026-10-24T11:20:00.000Z',
    isStarred: true,
    tags: ['Work', 'Specs'],
    isSafe: false,
    isEncrypted: false,
    telegramMessageId: 1042,
    telegramFileId: 'BQACAgIAAxkBAAIEam...',
    textContent: `# Telegram-Drive System Specification

## Overview
Telegram-Drive harnesses the Telegram Bot API & cloud channels to provide unlimited personal cloud storage. Files are segmented into chunks, cataloged, and seamlessly accessible via this web interface.

### Features
1. **Zero-Knowledge Safe Vault**: AES-256-GCM client-side encryption.
2. **Chunking Engine**: Auto-splits large media into Telegram Bot API chunks.
3. **In-App Media Streaming**: Direct playback for video, audio, images, and documents.
4. **Cloud Catalog Backup**: Automatic synchronization to private Telegram channel.

*Generated with Telegram-Drive Engine.*`,
  },
  {
    id: 'file-2',
    name: 'cloud_storage_bridge.ts',
    size: 14890,
    mimeType: 'text/typescript',
    folderId: 'folder-projects',
    createdAt: '2026-10-25T08:15:00.000Z',
    updatedAt: '2026-10-25T08:15:00.000Z',
    isStarred: true,
    tags: ['TypeScript', 'Backend'],
    isSafe: false,
    isEncrypted: false,
    telegramMessageId: 1043,
    telegramFileId: 'BQACAgIAAxkBAAIEb...',
    textContent: `/**
 * Telegram Cloud Bridge Controller
 * Handles streaming chunks and chunk assembly
 */
export async function streamTelegramDocument(fileId: string, botToken: string): Promise<ReadableStream> {
  const metaRes = await fetch(\`https://api.telegram.org/bot\${botToken}/getFile?file_id=\${fileId}\`);
  const meta = await metaRes.json();
  if (!meta.ok) throw new Error(meta.description);

  const fileUrl = \`https://api.telegram.org/file/bot\${botToken}/\${meta.result.file_path}\`;
  const streamRes = await fetch(fileUrl);
  if (!streamRes.body) throw new Error("Empty body stream");
  
  return streamRes.body;
}`,
  },
  {
    id: 'file-3',
    name: 'Glacier_Mountain_Panorama.jpg',
    size: 2840500,
    mimeType: 'image/jpeg',
    folderId: 'folder-media',
    createdAt: '2026-10-23T15:30:00.000Z',
    updatedAt: '2026-10-23T15:30:00.000Z',
    isStarred: true,
    tags: ['Travel', 'High-Res'],
    isSafe: false,
    isEncrypted: false,
    telegramMessageId: 1044,
    telegramFileId: 'AgACAgIAAxkBAAIEd...',
    // Crisp SVG fallback data URI of an Alpine mountain landscape
    contentUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e293b"/><stop offset="100%" stop-color="%2338bdf8"/></linearGradient><linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="100%" stop-color="%23475569"/></linearGradient><linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="1200" height="700" fill="url(%23sky)"/><polygon points="150,700 450,220 750,700" fill="url(%23m2)"/><polygon points="450,220 400,300 450,330 480,290" fill="%23f8fafc"/><polygon points="500,700 800,160 1100,700" fill="url(%23m1)"/><polygon points="800,160 740,250 810,290 850,230" fill="%23ffffff"/><polygon points="0,700 200,340 500,700" fill="%23334155"/><circle cx="1020" cy="180" r="45" fill="%23fef08a" opacity="0.85"/><text x="60" y="660" fill="%2394a3b8" font-family="system-ui" font-size="24" font-weight="600">Glacier Ridge 4K Photo (Telegram Cloud)</text></svg>`,
  },
  {
    id: 'file-4',
    name: 'Synthwave_Sunset_Journey.mp3',
    size: 4718592,
    mimeType: 'audio/mpeg',
    folderId: 'folder-media',
    createdAt: '2026-10-22T19:40:00.000Z',
    updatedAt: '2026-10-22T19:40:00.000Z',
    isStarred: false,
    tags: ['Music', 'Podcast'],
    isSafe: false,
    isEncrypted: false,
    telegramMessageId: 1045,
    telegramFileId: 'CQACAgIAAxkBAAIEe...',
    // Synth audio stream simulation
    contentUrl: 'https://actions.google.com/sounds/v1/ambiences/humming_room_tone.ogg',
  },
  {
    id: 'file-5',
    name: 'Nebula_DeepSpace_Timelapse.mp4',
    size: 18450000,
    mimeType: 'video/mp4',
    folderId: 'folder-media',
    createdAt: '2026-10-21T21:10:00.000Z',
    updatedAt: '2026-10-21T21:10:00.000Z',
    isStarred: false,
    tags: ['Video', '4K'],
    isSafe: false,
    isEncrypted: false,
    telegramMessageId: 1046,
    telegramFileId: 'BAACAgIAAxkBAAIEf...',
    contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  // Safe Vault Encrypted Files (Private items)
  {
    id: 'safe-file-1',
    name: 'Crypto_Seed_Wallets.enc',
    size: 8192,
    mimeType: 'application/octet-stream',
    folderId: 'folder-safe-keys',
    createdAt: '2026-10-25T14:00:00.000Z',
    updatedAt: '2026-10-25T14:00:00.000Z',
    isStarred: true,
    tags: ['Encrypted', 'High-Security'],
    isSafe: true, // Only in Safe Vault
    isEncrypted: true,
    encryptionMeta: {
      algorithm: 'AES-GCM-256',
      iv: 'x8f7s9d8f7s8',
      salt: 's7d8f7s8d7f8',
      originalMimeType: 'text/plain',
      originalName: 'Crypto_Seed_Wallets.txt',
    },
    textContent: `=== CONFIDENTIAL HARDWARE SEED BACKUP ===
Vault ID: tg-vault-primary
Algorithm: AES-256-GCM Client-Side Decrypted

Primary Cold Storage:
1. orbit 2. canvas 3. timber 4. ripple 5. breeze 6. summit
7. galaxy 8. quartz 9. velvet 10. anchor 11. solar 12. crystal

ETH Deposit Address: 0x71C...4982a
BTC Segwit: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`,
    telegramMessageId: 1047,
    telegramFileId: 'BQACAgIAAxkBAAIEg...',
  },
  {
    id: 'safe-file-2',
    name: 'Tax_Returns_2025_Final.enc',
    size: 1450000,
    mimeType: 'application/octet-stream',
    folderId: 'folder-safe-finances',
    createdAt: '2026-10-24T17:25:00.000Z',
    updatedAt: '2026-10-24T17:25:00.000Z',
    isStarred: true,
    tags: ['Finance', 'Tax'],
    isSafe: true,
    isEncrypted: true,
    encryptionMeta: {
      algorithm: 'AES-GCM-256',
      iv: 'k2j3h4k2j3h4',
      salt: 'a9s8d7a9s8d7',
      originalMimeType: 'application/pdf',
      originalName: 'Tax_Returns_2025_Final.pdf',
    },
    textContent: `=== FORM 1040 U.S. INDIVIDUAL INCOME TAX RETURN ===
Tax Year: 2025
Filing Status: Single
Total Income: $148,500.00
Adjusted Gross Income: $132,400.00
Taxable Amount: $104,200.00
Total Payments & Withholdings: $28,900.00
Refund Due: $2,450.00
Status: Verified & Stored in Client-Side Encrypted Safe Vault`,
    telegramMessageId: 1048,
    telegramFileId: 'BQACAgIAAxkBAAIEh...',
  },
];

export function loadFiles(): DriveFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!raw) {
      saveFiles(INITIAL_FILES);
      return INITIAL_FILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FILES;
  }
}

export function saveFiles(files: DriveFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  } catch (err) {
    console.error('Failed to save files to localStorage', err);
  }
}

export function loadFolders(): DriveFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!raw) {
      saveFolders(INITIAL_FOLDERS);
      return INITIAL_FOLDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FOLDERS;
  }
}

export function saveFolders(folders: DriveFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders to localStorage', err);
  }
}

export function loadTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    botToken: '',
    chatId: '',
    isConnected: false,
    autoBackupCatalog: true,
    maxChunkSizeMB: 20,
  };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TELEGRAM_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save telegram config', err);
  }
}

export function loadSafeConfig(): SafeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAFE_CONFIG);
    if (raw) {
      const cfg = JSON.parse(raw);
      // Always initialize locked on page load for zero-knowledge safety
      return { ...cfg, isLocked: true };
    }
  } catch {}
  return {
    isInitialized: false,
    isLocked: true,
    autoLockMinutes: 5,
    salt: '',
    verifierHash: '',
    recoveryKeyHash: '',
    stealthMode: false,
  };
}

export function saveSafeConfig(config: SafeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAFE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save safe config', err);
  }
}

// Utility: Format bytes into human-readable string
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Utility: Format ISO date string into readable short date
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

// Determine file category
export function getFileCategory(file: DriveFile): 'image' | 'video' | 'audio' | 'code' | 'doc' | 'archive' | 'safe' {
  if (file.isSafe || file.isEncrypted) return 'safe';
  const mime = file.mimeType.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)$/.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/.test(name)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/.test(name)) return 'audio';
  if (/\.(ts|tsx|js|jsx|json|py|rs|go|html|css|sql|sh|yaml|yml)$/.test(name)) return 'code';
  if (/\.(zip|tar|gz|7z|rar)$/.test(name)) return 'archive';
  return 'doc';
}
