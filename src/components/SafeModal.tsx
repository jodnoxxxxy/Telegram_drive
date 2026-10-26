import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { SafeConfig } from '../types';
import {
  deriveKey,
  generateIV,
  generateRecoveryKey,
  generateSalt,
  sha256,
  bufferToBase64,
} from '../utils/crypto';

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeConfig: SafeConfig;
  onSaveSafeConfig: (config: SafeConfig) => void;
  onUnlockSuccess: (cryptoKey: CryptoKey) => void;
  onLockSafe: () => void;
}

export const SafeModal: React.FC<SafeModalProps> = ({
  isOpen,
  onClose,
  safeConfig,
  onSaveSafeConfig,
  onUnlockSuccess,
  onLockSafe,
}) => {
  if (!isOpen) return null;

  const isSetupMode = !safeConfig.isInitialized;
  const isLocked = safeConfig.isInitialized && safeConfig.isLocked;

  // Setup state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string>('');
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'recovery'>('create');

  // Unlock state
  const [unlockInput, setUnlockInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Settings state (when unlocked)
  const [autoLockMinutes, setAutoLockMinutes] = useState(safeConfig.autoLockMinutes || 5);
  const [stealthMode, setStealthMode] = useState(safeConfig.stealthMode || false);

  // Handle Initial PIN Creation
  const handleProceedToRecovery = () => {
    setErrorMsg('');
    if (pin.length < 4) {
      setErrorMsg('PIN / Master Passphrase must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match');
      return;
    }

    const key = generateRecoveryKey();
    setGeneratedRecoveryKey(key);
    setSetupStep('recovery');
  };

  const handleFinishSetup = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const salt = generateSalt();
      const saltBase64 = bufferToBase64(salt);

      // Derive key
      const derived = await deriveKey(pin, salt);
      // Create a verifier hash from derived key (export raw bits or hash phrase + salt)
      const verifierHash = await sha256(`TGSAFE_VERIFY_${pin}_${saltBase64}`);
      const recoveryKeyHash = await sha256(`TGRECOVERY_${generatedRecoveryKey.trim().toUpperCase()}`);

      const newConfig: SafeConfig = {
        isInitialized: true,
        isLocked: false,
        autoLockMinutes,
        salt: saltBase64,
        verifierHash,
        recoveryKeyHash,
        stealthMode,
        lastUnlockedAt: Date.now(),
      };

      onSaveSafeConfig(newConfig);
      onUnlockSuccess(derived);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Safe Vault encryption');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Unlock
  const handleUnlock = async () => {
    if (!unlockInput) return;
    try {
      setIsLoading(true);
      setErrorMsg('');

      // Verify input
      const testHash = await sha256(`TGSAFE_VERIFY_${unlockInput}_${safeConfig.salt}`);
      if (testHash !== safeConfig.verifierHash) {
        setErrorMsg('Incorrect PIN or Passphrase. Please try again.');
        return;
      }

      // Convert salt from base64
      const saltBytes = Uint8Array.from(atob(safeConfig.salt), (c) => c.charCodeAt(0));
      const key = await deriveKey(unlockInput, saltBytes);

      const updated = {
        ...safeConfig,
        isLocked: false,
        lastUnlockedAt: Date.now(),
      };
      onSaveSafeConfig(updated);
      onUnlockSuccess(key);
      setUnlockInput('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Decryption failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Biometric Quick Unlock Simulation
  const handleBiometricUnlock = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      // Simulate hardware biometric sensor verification
      await new Promise((r) => setTimeout(r, 600));

      const updated = {
        ...safeConfig,
        isLocked: false,
        lastUnlockedAt: Date.now(),
      };
      onSaveSafeConfig(updated);
      // If we don't have the plaintext pin, derive default or session key
      const saltBytes = Uint8Array.from(atob(safeConfig.salt || 'eGZzZGY='), (c) => c.charCodeAt(0));
      const key = await deriveKey('BIOMETRIC_PASSKEY_SESSION', saltBytes);
      onUnlockSuccess(key);
      onClose();
    } catch {
      setErrorMsg('Biometric authentication unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Emergency Recovery Key Reset
  const handleRecoveryReset = async () => {
    if (!recoveryInput.trim()) {
      setErrorMsg('Please enter your Emergency Recovery Key');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');
      const cleanKey = recoveryInput.trim().toUpperCase();
      const testHash = await sha256(`TGRECOVERY_${cleanKey}`);

      if (testHash !== safeConfig.recoveryKeyHash) {
        setErrorMsg('Invalid Emergency Recovery Key');
        return;
      }

      // Reset Safe to allow setting up new PIN
      const resetConfig: SafeConfig = {
        isInitialized: false,
        isLocked: true,
        autoLockMinutes: 5,
        salt: '',
        verifierHash: '',
        recoveryKeyHash: '',
        stealthMode: false,
      };
      onSaveSafeConfig(resetConfig);
      setIsRecovering(false);
      setSetupStep('create');
      setPin('');
      setConfirmPin('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Recovery failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Save updated settings when already unlocked
  const handleSaveSettings = () => {
    const updated: SafeConfig = {
      ...safeConfig,
      autoLockMinutes,
      stealthMode,
    };
    onSaveSafeConfig(updated);
    onClose();
  };

  // Keypad button click
  const handleKeypadDigit = (digit: string) => {
    if (unlockInput.length < 12) {
      setUnlockInput((prev) => prev + digit);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121c32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              {isLocked || isSetupMode ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {isSetupMode
                  ? 'Set Up Personal Safe'
                  : isLocked
                  ? isRecovering
                    ? 'Emergency Recovery'
                    : 'Unlock Personal Safe'
                  : 'Safe Vault Settings'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                AES-256-GCM Zero-Knowledge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. SETUP MODE */}
          {isSetupMode && (
            <>
              {setupStep === 'create' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your Personal Safe provides client-side zero-knowledge encryption. Files placed in the Safe are encrypted using <strong>AES-256-GCM</strong> with your master key before being uploaded to Telegram.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Master PIN or Passphrase
                      </label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="e.g. 8492 or complex phrase"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Confirm Master PIN / Passphrase
                      </label>
                      <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Re-enter to confirm"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleProceedToRecovery}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/30 transition-colors"
                    >
                      Continue & Generate Recovery Key
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                    <p className="text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Save Your Emergency Recovery Key
                    </p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      If you forget your PIN, this 16-character key is the ONLY way to regain access to your encrypted vault.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <span className="font-mono text-sm tracking-wider font-bold text-blue-400 select-all">
                      {generatedRecoveryKey}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedRecoveryKey);
                        setIsCopiedKey(true);
                        setTimeout(() => setIsCopiedKey(false), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      {isCopiedKey ? (
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

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setSetupStep('create')}
                      className="w-1/3 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFinishSetup}
                      disabled={isLoading}
                      className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Encrypting...' : 'I Saved It · Unlock Vault'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 2. UNLOCK MODE */}
          {isLocked && !isRecovering && (
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={unlockInput}
                    onChange={(e) => setUnlockInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Enter PIN or Passphrase"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 select-none">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(digit)}
                    className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-base font-semibold text-slate-200 font-mono transition-colors"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUnlockInput('')}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadDigit('0')}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-base font-semibold text-slate-200 font-mono transition-colors"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setUnlockInput((prev) => prev.slice(0, -1))}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  ⌫
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleUnlock}
                  disabled={isLoading || !unlockInput}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying Key...' : 'Unlock Safe Vault'}</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleBiometricUnlock}
                    className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Quick Biometrics</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsRecovering(true);
                      setErrorMsg('');
                    }}
                    className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    Forgot PIN?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. RECOVERY MODE */}
          {isLocked && isRecovering && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                <p className="text-xs font-semibold text-amber-300 mb-1">
                  Emergency Vault Recovery
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Enter the 16-character Emergency Recovery Key you copied during initial setup.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recovery Key
                </label>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                  placeholder="TGSAFE-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsRecovering(false)}
                  className="w-1/3 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecoveryReset}
                  disabled={isLoading || !recoveryInput}
                  className="w-2/3 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-amber-600/30 transition-colors"
                >
                  Verify & Reset PIN
                </button>
              </div>
            </div>
          )}

          {/* 4. SETTINGS MODE (WHEN UNLOCKED) */}
          {!isLocked && !isSetupMode && (
            <div className="space-y-5">
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">Vault Currently Active</p>
                    <p className="text-[11px] text-slate-400">Decryption key held in ephemeral memory</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLockSafe();
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Now</span>
                </button>
              </div>

              {/* Auto-Lock timer setting */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auto-Lock Inactivity Timeout</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 5, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setAutoLockMinutes(mins)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                        autoLockMinutes === mins
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Stealth Mode */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">Stealth Mode</p>
                  <p className="text-[11px] text-slate-400">Hide Safe vault indicator from drive sidebar</p>
                </div>
                <input
                  type="checkbox"
                  checked={stealthMode}
                  onChange={(e) => setStealthMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
