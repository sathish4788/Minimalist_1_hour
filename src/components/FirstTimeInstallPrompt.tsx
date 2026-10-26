import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface FirstTimeInstallPromptProps {
  onOpenFullGuide?: () => void;
}

export const FirstTimeInstallPrompt: React.FC<FirstTimeInstallPromptProps> = ({
  onOpenFullGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, isIframe, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If running in standalone mode (already installed), never show
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if dismissed before
    const dismissedAt = localStorage.getItem('minimalist_first_install_prompt_dismissed');
    if (dismissedAt) {
      return;
    }

    // Delay appearance slightly so the user gets a smooth initial app experience
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 900);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('minimalist_first_install_prompt_dismissed', Date.now().toString());
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success) {
          setInstallSuccess(true);
          setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem('minimalist_first_install_prompt_dismissed', 'installed');
          }, 2400);
        }
      } catch (err) {
        console.error('Install failed:', err);
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // Browser without native beforeinstallprompt (e.g., Firefox, or preview iframe)
      if (onOpenFullGuide) {
        onOpenFullGuide();
        handleDismiss();
      } else {
        setShowIOSInstructions(true);
      }
    }
  };

  const handleCopyLink = () => {
    const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const appUrl = rawOrigin.includes('ais-dev-')
      ? rawOrigin.replace('ais-dev-', 'ais-pre-')
      : rawOrigin || window.location.href;

    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <aside
      aria-label="Install MinimaList App"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-45 animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-neutral-900 text-white dark:bg-neutral-850 dark:text-neutral-100 rounded-2xl p-4 sm:p-5 shadow-2xl border border-neutral-700/80 dark:border-neutral-700 relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative gradient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {installSuccess ? (
          <div className="py-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-emerald-400">
                MinimaList Installed!
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                The app icon is now on your home screen with offline capability.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-start gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold text-base shrink-0 shadow-md">
                M·
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Install Now
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  Install MinimaList on Your Phone
                </h3>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  Add to your home screen for instant 1-tap access, reliable sound reminders, and full offline support.
                </p>
              </div>
            </div>

            {/* iOS or Manual Instructions Toggle */}
            {showIOSInstructions && (
              <div className="p-3 rounded-xl bg-neutral-800/90 border border-neutral-700 space-y-2 text-xs animate-in fade-in duration-200">
                <p className="font-medium text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>How to install on {isIOS ? 'iPhone (Safari)' : 'Phone Browser'}:</span>
                </p>
                {isIOS ? (
                  <ol className="space-y-1.5 text-neutral-300 text-[11px] pl-1">
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0 text-white font-mono">1</span>
                      <span>Tap the <strong>Share</strong> button <Share2 className="w-3 h-3 inline text-blue-400 mx-0.5" /> in Safari</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0 text-white font-mono">2</span>
                      <span>Scroll and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3 h-3 inline text-emerald-400 mx-0.5" /></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0 text-white font-mono">3</span>
                      <span>Tap <strong>Add</strong> in the top-right corner</span>
                    </li>
                  </ol>
                ) : (
                  <ol className="space-y-1.5 text-neutral-300 text-[11px] pl-1">
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0 text-white font-mono">1</span>
                      <span>Tap browser menu (<strong>⋮</strong> or three dots)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0 text-white font-mono">2</span>
                      <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                    </li>
                  </ol>
                )}

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
                  </button>

                  {onOpenFullGuide && (
                    <button
                      onClick={() => {
                        onOpenFullGuide();
                        handleDismiss();
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>More options</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isInstalling
                    ? 'Installing...'
                    : isInstallable
                    ? 'Install Now (Instant)'
                    : isIOS
                    ? 'Show How to Install'
                    : 'Install on Phone'}
                </span>
              </button>

              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] text-neutral-300 hover:text-white font-medium text-xs transition-colors shrink-0"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
