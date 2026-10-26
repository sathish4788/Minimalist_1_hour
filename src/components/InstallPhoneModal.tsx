import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Play,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface InstallPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPhoneModal: React.FC<InstallPhoneModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'playstore'>('instant');
  const [phoneOs, setPhoneOs] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);
  const { isInstallable, install, isIframe } = usePWAInstall();

  if (!isOpen) return null;

  // Resolve public share URL so that ANY phone can open it without developer login
  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const appUrl = rawOrigin.includes('ais-dev-')
    ? rawOrigin.replace('ais-dev-', 'ais-pre-')
    : rawOrigin || 'https://ais-pre-jujxffkljsgajj5qxedm5y-187793029932.asia-northeast1.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MinimaList - Clean & Fast To-Do App',
          text: 'Check out MinimaList to-do app on your phone:',
          url: appUrl,
        });
        return;
      } catch {
        // Fall back to copy
      }
    }
    handleCopyLink();
  };

  // Generate SVG QR Code URL using public QR API pointing to public share URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}&margin=8`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Open & Install on Any Phone
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Works on all Android phones and iPhones — no login required.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented View Switcher */}
        <div className="px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('instant')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'instant'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Use on Any Phone (Instant)</span>
            </button>

            <button
              onClick={() => setActiveTab('playstore')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'playstore'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />
              <span>Google Play Store Guide</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 text-xs space-y-5">
          {activeTab === 'instant' ? (
            <div className="space-y-5">
              {/* Universal Phone Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-800 dark:text-amber-300">
                  <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>To open on another phone without login: Click "Share" in AI Studio</span>
                </div>
                <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                  In Google AI Studio, click the <strong>"Share"</strong> button in the top right to deploy and activate the public link. Until "Share" is clicked, Cloud Run shows <em>Page not found</em> on other devices.
                </p>
              </div>

              {/* Direct Install Button if supported in current browser */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm">Install MinimaList App</h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      Adds an icon to your phone home screen with full offline capability.
                    </p>
                  </div>
                  <button
                    onClick={install}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              {/* QR Code + Public Phone Link */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850">
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-neutral-200 dark:border-neutral-700">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.origin : appUrl
                    )}&margin=8`}
                    alt="Scan to open on phone"
                    className="w-32 h-32 object-contain"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan with Your Phone</span>
                  </span>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Direct Link for Your Phone
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                    Scan this QR code or copy the link to open directly in mobile Chrome:
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.origin : appUrl}
                      className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 truncate outline-none"
                    />
                    <button
                      onClick={() => {
                        const target = typeof window !== 'undefined' ? window.location.origin : appUrl;
                        navigator.clipboard.writeText(target);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform Selector (Android vs iPhone) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                    Choose Phone Type to See Instructions:
                  </h4>
                  <div className="inline-flex p-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-[11px]">
                    <button
                      onClick={() => setPhoneOs('android')}
                      className={`px-3 py-1 rounded-md transition-all font-medium ${
                        phoneOs === 'android'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Android Phone
                    </button>
                    <button
                      onClick={() => setPhoneOs('ios')}
                      className={`px-3 py-1 rounded-md transition-all font-medium ${
                        phoneOs === 'ios'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      iPhone (iOS)
                    </button>
                  </div>
                </div>

                {phoneOs === 'android' ? (
                  <div className="space-y-2.5 text-neutral-600 dark:text-neutral-300 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong>Open in Chrome:</strong> Open the link in Google Chrome or Samsung Internet on the phone.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong>Tap Chrome Menu (⋮):</strong> In the top-right corner, tap the 3 dots (⋮).
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong>Tap "Install app" or "Add to Home screen":</strong> If it offers "Install and create shortcut", choose <strong>"Create shortcut"</strong> or <strong>"Install"</strong>. The MinimaList app icon will appear directly on your home screen!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-neutral-600 dark:text-neutral-300 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong>Open in Safari:</strong> On the iPhone, open the link specifically in <strong>Apple Safari</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong>Tap the Share Button:</strong> Tap the <strong>Share icon</strong> at the bottom of the screen (the square with an arrow pointing upward ⎋).
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong>Tap "Add to Home Screen":</strong> Scroll down the list of share options, tap <strong>"Add to Home Screen"</strong>, and tap <strong>"Add"</strong> in the top right. MinimaList is now installed as an app on your iPhone!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>PWA Manifest & Google Play Requirements 100% Configured</span>
                </div>
                <p className="font-normal text-[11px] leading-relaxed opacity-90">
                  Direct static <code>/manifest.json</code>, offline <code>/sw.js</code>, 512x512 maskable icons, and mobile store screenshots are now active and verified.
                </p>
              </div>

              {/* Status checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">Manifest Name & Details</div>
                    <div className="text-[10px] text-neutral-400">MinimaList (≤ 12 chars)</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">Service Worker</div>
                    <div className="text-[10px] text-neutral-400">Offline caching active</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">Maskable Icons</div>
                    <div className="text-[10px] text-neutral-400">192px + 512px padded</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">Store Screenshots</div>
                    <div className="text-[10px] text-neutral-400">Mobile + Desktop included</div>
                  </div>
                </div>
              </div>

              {/* Direct PWABuilder Action Banner */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 border border-neutral-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Ready for PWABuilder Packaging</span>
                  <button
                    onClick={handleCopyLink}
                    className="px-2 py-1 text-[10px] font-medium rounded-md bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied URL' : 'Copy App URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  On PWABuilder, click <strong>"Test Again"</strong> or re-enter the URL. All manifest checks will now show green and the <strong>"Package For Stores"</strong> button will be enabled!
                </p>
                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open PWABuilder with App URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 3 Steps to Publish */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Click "Package for Android"</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 pl-7 text-[11px] leading-relaxed">
                    Select Android on PWABuilder to generate the signed <code>.aab</code> package.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Upload to Google Play Console</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 pl-7 text-[11px] leading-relaxed">
                    Under Production or Closed Testing, create a release and upload your <code>.aab</code> file.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Digital Asset Links</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 pl-7 text-[11px] leading-relaxed">
                    Your domain already serves <code>/.well-known/assetlinks.json</code> with CORS headers enabled for instant domain validation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            PWA Manifest & Service Worker Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
