export interface DriveFile {
  id: string;
  name: string;
  size: number; // bytes
  mimeType: string;
  folderId: string | null; // null = root
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
  tags?: string[];
  isSafe: boolean; // resides in Safe Vault
  isEncrypted: boolean;
  encryptionMeta?: {
    algorithm: 'AES-GCM-256';
    iv: string; // base64
    salt: string; // base64
    originalMimeType: string;
    originalName: string;
  };
  telegramMessageId?: number;
  telegramFileId?: string;
  chunks?: {
    chunkIndex: number;
    totalChunks: number;
    telegramFileId: string;
    size: number;
  }[];
  contentUrl?: string; // blob or preview url
  textContent?: string; // for text, markdown, code
  isDeleted?: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  isSafe: boolean;
  color?: string;
  isDeleted?: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  botUsername?: string;
  botName?: string;
  chatTitle?: string;
  isConnected: boolean;
  autoBackupCatalog: boolean;
  maxChunkSizeMB: number;
}

export interface SafeConfig {
  isInitialized: boolean;
  isLocked: boolean;
  autoLockMinutes: number;
  salt: string; // base64 salt for PBKDF2
  verifierHash: string; // SHA-256 hash of derived key to verify PIN/password
  recoveryKeyHash: string; // SHA-256 hash of recovery token
  stealthMode: boolean;
  lastUnlockedAt?: number;
}

export type ViewFilter = 'all' | 'safe' | 'starred' | 'media' | 'documents' | 'audio' | 'archives' | 'trash';
export type ViewLayout = 'grid' | 'list';
export type SortField = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';
