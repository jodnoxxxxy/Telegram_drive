/**
 * Client-Side Zero-Knowledge Encryption Engine using Web Crypto API (AES-256-GCM + PBKDF2)
 * Ensures user files inside the Safe Vault are encrypted before ever touching Telegram or disk.
 */

// Convert ArrayBuffer / Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random salt (16 bytes)
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

// Generate random IV for AES-GCM (12 bytes)
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Derive AES-256-GCM key from PIN/password and salt using PBKDF2 (100,000 iterations)
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true, // exportable for session verifier calculation
    ['encrypt', 'decrypt']
  );
}

// Hash string with SHA-256 for verifiers
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return bufferToBase64(hashBuffer);
}

// Encrypt binary data (ArrayBuffer or Uint8Array) using AES-256-GCM
export async function encryptBytes(
  data: ArrayBuffer | Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const bufferToEncrypt = data instanceof Uint8Array ? data : new Uint8Array(data);
  return window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    key,
    bufferToEncrypt as BufferSource
  );
}

// Decrypt binary data using AES-256-GCM
export async function decryptBytes(
  cipherBuffer: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    key,
    cipherBuffer as BufferSource
  );
}

// Encrypt plaintext string
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<{ cipherBase64: string; ivBase64: string }> {
  const iv = generateIV();
  const encoded = new TextEncoder().encode(text);
  const encrypted = await encryptBytes(encoded, key, iv);
  return {
    cipherBase64: bufferToBase64(encrypted),
    ivBase64: bufferToBase64(iv),
  };
}

// Decrypt ciphertext to plaintext string
export async function decryptText(
  cipherBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const cipherBuffer = base64ToUint8Array(cipherBase64).buffer;
  const iv = base64ToUint8Array(ivBase64);
  const decrypted = await decryptBytes(cipherBuffer as ArrayBuffer, key, iv);
  return new TextDecoder().decode(decrypted);
}

// Generate Emergency Recovery Key (e.g. TGSAFE-A7B2-9F41-8C3D)
export function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const getChunk = () => {
    let res = '';
    const random = window.crypto.getRandomValues(new Uint8Array(4));
    for (let i = 0; i < 4; i++) {
      res += chars[random[i] % chars.length];
    }
    return res;
  };
  return `TGSAFE-${getChunk()}-${getChunk()}-${getChunk()}`;
}
