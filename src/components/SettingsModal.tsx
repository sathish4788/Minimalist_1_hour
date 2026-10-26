import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Laptop,
  Check,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Play,
  Smartphone,
  Music,
  Type,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { UserSettings, SoundTone, AppTheme, FontSizeScale, ScreenWidthMode } from '../types/todo';
import { playChime } from '../utils/audio';
import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  triggerBrowserNotification,
} from '../utils/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportTasks: () => void;
  onImportTasks: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCompleted: () => void;
  onResetTasks: () => void;
  completedCount: number;
  onOpenInstall?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportTasks,
  onImportTasks,
  onClearCompleted,
  onResetTasks,
  completedCount,
  onOpenInstall,
}) => {
  const [notificationStatus, setNotificationStatus] = useState(getNotificationPermissionStatus());
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    setNotificationError(null);
    const granted = await requestBrowserNotificationPermission();
    setNotificationStatus(getNotificationPermissionStatus());
    onUpdateSettings({ browserNotificationsEnabled: granted });
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setNotificationError('Selected audio file must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        onUpdateSettings({
          soundTone: 'custom-phone',
          customToneName: file.name,
          customToneData: dataUrl,
          soundEnabled: true,
        });
        // Play audio preview immediately
        playChime('custom-phone', settings.soundVolume, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestNotification = async () => {
    setNotificationError(null);

    // Play chime / custom phone tone
    if (settings.soundEnabled) {
      playChime(settings.soundTone, settings.soundVolume, settings.customToneData);
    }

    // Direct phone vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore vibration error
      }
    }

    // If permission not granted yet, request it automatically
    let currentStatus = getNotificationPermissionStatus();
    if (currentStatus !== 'granted') {
      const granted = await requestBrowserNotificationPermission();
      currentStatus = getNotificationPermissionStatus();
      setNotificationStatus(currentStatus);
      onUpdateSettings({ browserNotificationsEnabled: granted });
      if (!granted) {
        setNotificationError('Notifications are not permitted yet. Please tap "Enable Notifications" below.');
        return;
      }
    }

    const sent = await triggerBrowserNotification(
      'MinimaList Reminder Test',
      'Your task reminder tone and alert are working!'
    );

    if (sent) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3500);
    } else {
      setNotificationError('Could not send notification. Please verify site permissions in your browser bar.');
    }
  };

  const handleTestChime = (tone: SoundTone, customData?: string) => {
    playChime(tone, settings.soundVolume, customData || settings.customToneData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Preferences & Automation
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Configure reminder defaults, sounds, and appearance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* SECTION 1: AUTO-REMINDER CONFIGURATION (User Request Focus) */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Default 1-Hour Reminder for New Tasks
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Automatically attaches a reminder for every newly entered task. You can turn this off anytime.
                </p>
              </div>

              {/* Master Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoReminderEnabled}
                onClick={() =>
                  onUpdateSettings({ autoReminderEnabled: !settings.autoReminderEnabled })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoReminderEnabled
                    ? 'bg-neutral-900 dark:bg-white'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoReminderEnabled
                      ? 'translate-x-5 bg-white dark:bg-neutral-900'
                      : 'translate-x-0 bg-white dark:bg-neutral-300'
                  }`}
                />
              </button>
            </div>

            {/* Sub-setting: Default Offset Duration */}
            <div
              className={`p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 space-y-2 transition-opacity ${
                settings.autoReminderEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}
            >
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Default Reminder Timing
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '15 mins', minutes: 15 },
                  { label: '30 mins', minutes: 30 },
                  { label: '45 mins', minutes: 45 },
                  { label: '1 Hour (Default)', minutes: 60 },
                  { label: '90 mins', minutes: 90 },
                  { label: '2 Hours', minutes: 120 },
                  { label: '4 Hours', minutes: 240 },
                  { label: '24 Hours', minutes: 1440 },
                ].map((item) => (
                  <button
                    key={item.minutes}
                    type="button"
                    onClick={() => onUpdateSettings({ defaultReminderOffsetMinutes: item.minutes })}
                    className={`px-2 py-1.5 text-xs rounded-lg border text-center transition-all ${
                      settings.defaultReminderOffsetMinutes === item.minutes
                        ? 'bg-white dark:bg-neutral-900 border-neutral-900 dark:border-white font-semibold text-neutral-900 dark:text-white shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-750 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: AUDIO & SOUND CHIMES */}
          <div className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Reminder Audio Chimes
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.soundEnabled
                    ? 'bg-neutral-900 dark:bg-white'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                    settings.soundEnabled
                      ? 'translate-x-5 bg-white dark:bg-neutral-900'
                      : 'translate-x-0 bg-white dark:bg-neutral-300'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="space-y-4 p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300">
                      Reminder Sound & Tone
                    </label>
                    <span className="text-[10px] text-neutral-400">Zen tones & custom phone audio</span>
                  </div>

                  {/* Standard Built-in Tones */}
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    {[
                      { id: 'mellow', name: 'Mellow Temple' },
                      { id: 'zen', name: 'Zen Singing Bowl' },
                      { id: 'gentle-bell', name: 'Gentle Bell' },
                      { id: 'marimba', name: 'Warm Marimba' },
                    ].map((tone) => (
                      <div
                        key={tone.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                          settings.soundTone === tone.id
                            ? 'bg-white dark:bg-neutral-900 border-neutral-900 dark:border-white font-medium text-neutral-900 dark:text-white shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-750 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ soundTone: tone.id as SoundTone })}
                          className="flex-1 text-left"
                        >
                          {tone.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTestChime(tone.id as SoundTone)}
                          title="Preview sound"
                          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Phone Native & Custom Tone Options */}
                  <div className="space-y-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-750">
                    <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 block">
                      Use Tones from Your Phone
                    </span>

                    {/* Option A: Custom Audio/Ringtone File from Phone Storage */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        settings.soundTone === 'custom-phone'
                          ? 'bg-white dark:bg-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-750 bg-neutral-100/50 dark:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Music className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (settings.customToneData) {
                                  onUpdateSettings({ soundTone: 'custom-phone' });
                                }
                              }}
                              className="text-left font-medium text-neutral-900 dark:text-neutral-100 truncate block"
                            >
                              {settings.customToneName ? (
                                <span>Custom: {settings.customToneName}</span>
                              ) : (
                                <span>Pick Audio / Ringtone from Phone</span>
                              )}
                            </button>
                            <span className="text-[10px] text-neutral-400 block">
                              Supports any MP3, OGG, M4A, or WAV file from your phone storage
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {settings.customToneData && (
                            <button
                              type="button"
                              onClick={() => handleTestChime('custom-phone', settings.customToneData)}
                              title="Preview uploaded tone"
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}

                          <label className="cursor-pointer px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-xs">
                            <Upload className="w-3 h-3" />
                            <span>{settings.customToneData ? 'Change' : 'Choose File'}</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleCustomAudioUpload}
                              className="hidden"
                            />
                          </label>

                          {settings.customToneData && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateSettings({
                                  soundTone: 'mellow',
                                  customToneName: undefined,
                                  customToneData: undefined,
                                } as Partial<UserSettings>)
                              }
                              title="Remove custom tone"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option B: Android Phone System Notification Tone */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        settings.soundTone === 'phone-system'
                          ? 'bg-white dark:bg-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-750 bg-neutral-100/50 dark:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ soundTone: 'phone-system' })}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
                              Phone System Default Tone
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              Plays the native notification ringtone configured in your phone's Android settings
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ soundTone: 'phone-system' })}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            settings.soundTone === 'phone-system'
                              ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        >
                          {settings.soundTone === 'phone-system' && <Check className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-neutral-600 dark:text-neutral-400">
                    <span>In-App Volume</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(settings.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) =>
                      onUpdateSettings({ soundVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-neutral-900 dark:accent-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PHONE & DESKTOP NOTIFICATIONS */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Phone & Device Notifications
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Receive native system alerts with audio chimes and vibration when task reminders are due.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {notificationStatus === 'granted' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Notifications Allowed
                    </span>
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{testNotificationSent ? 'Sent!' : 'Send Test Notification'}</span>
                    </button>
                  </div>
                </div>
              ) : notificationStatus === 'denied' ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs w-full">
                  Notifications blocked in browser site settings. Tap the lock/tune icon in your address bar &rarr; Site settings &rarr; Allow notifications.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Notifications & Test</span>
                </button>
              )}
            </div>

            {testNotificationSent && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Test notification sent! System notification, audio chime, and vibration triggered.</span>
              </div>
            )}

            {notificationError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                <span>⚠️</span>
                <span>{notificationError}</span>
              </div>
            )}
          </div>

          {/* SECTION 4: THEME, FONT SIZE & SCREEN FIT */}
          <div className="pt-5 space-y-4">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
              Color Theme, Font Size & Screen Fit
            </span>

            {/* Font Size Scaling (+ and -) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Text & Font Size</span>
                </span>
                <span className="font-mono text-neutral-500 tabular-nums text-[11px]">
                  {settings.fontSizeScale === 'sm'
                    ? 'Small (90%)'
                    : settings.fontSizeScale === 'lg'
                    ? 'Large (115%)'
                    : settings.fontSizeScale === 'xl'
                    ? 'Extra Large (130%)'
                    : settings.fontSizeScale === '2xl'
                    ? 'Maximum (150%)'
                    : 'Standard (100%)'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {[
                  { id: 'sm', label: '90%', name: 'Small' },
                  { id: 'md', label: '100%', name: 'Normal' },
                  { id: 'lg', label: '115%', name: 'Large' },
                  { id: 'xl', label: '130%', name: 'XL' },
                  { id: '2xl', label: '150%', name: 'Max' },
                ].map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontSizeScale: scale.id as FontSizeScale })}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      (settings.fontSizeScale || 'md') === scale.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold border-neutral-900 dark:border-white shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <span className="block font-mono text-xs">{scale.label}</span>
                    <span className="text-[10px] opacity-75">{scale.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Width / Fit Screen Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Screen Width / Fit Screen</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'standard', name: 'Standard (Centered)', desc: 'Clean reading column' },
                  { id: 'wide', name: 'Wide View', desc: 'Expanded width' },
                  { id: 'fit-screen', name: 'Fit Screen (Full)', desc: 'Edge-to-edge for phone' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onUpdateSettings({ screenWidthMode: mode.id as ScreenWidthMode })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (settings.screenWidthMode || 'standard') === mode.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold border-neutral-900 dark:border-white shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                Color Palette
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slate', name: 'Minimal Slate', icon: Laptop },
                  { id: 'paper', name: 'Warm Paper', icon: Sun },
                  { id: 'obsidian', name: 'Obsidian Dark', icon: Moon },
                ].map((t) => {
                  const IconComponent = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: t.id as AppTheme })}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        settings.theme === t.id
                          ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
              <span>Compact Row Density</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ compactMode: !settings.compactMode })}
                className={`px-2 py-1 rounded border text-xs ${
                  settings.compactMode
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {settings.compactMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* SECTION 5: ANDROID PHONE & GOOGLE PLAY STORE */}
          {onOpenInstall && (
            <div className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Android Phone & Google Play Store
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Install directly on your Android phone home screen in 10 seconds or publish as an official Trusted Web Activity (TWA) app on Google Play.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInstall();
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Phone & Play Store Setup</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: DATA MANAGEMENT */}
          <div className="pt-5 space-y-3">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
              Data & Reset
            </span>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={onExportTasks}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportTasks}
                  className="hidden"
                />
              </label>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear completed ({completedCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetTasks}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to demo tasks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
