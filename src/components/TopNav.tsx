import { Sliders, Bell, BellOff, CheckCircle2, BarChart3, Camera, Smartphone, Download } from 'lucide-react';
import { FilterView, UserSettings } from '../types/todo';
import { usePWAInstall } from '../utils/usePWAInstall';

interface TopNavProps {
  currentFilter: FilterView;
  onFilterChange: (filter: FilterView) => void;
  counts: {
    all: number;
    reminders: number;
    active: number;
    completed: number;
  };
  settings: UserSettings;
  onOpenSettings: () => void;
  onOpenImageToTasks: () => void;
  onOpenInstall: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentFilter,
  onFilterChange,
  counts,
  settings,
  onOpenSettings,
  onOpenImageToTasks,
  onOpenInstall,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <header className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div
        className={`mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 transition-all duration-200 ${
          settings.screenWidthMode === 'fit-screen'
            ? 'w-full max-w-full'
            : settings.screenWidthMode === 'wide'
            ? 'max-w-6xl'
            : 'max-w-4xl'
        }`}
      >
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm tracking-tighter">
            M·
          </div>
          <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            MinimaList
          </span>
        </div>

        {/* Zone 2: Navigation filter tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar text-xs sm:text-sm font-medium">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentFilter === 'all'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>All</span>
            <span className="font-mono text-xs opacity-75 tabular-nums">({counts.all})</span>
          </button>

          <button
            onClick={() => onFilterChange('reminders')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentFilter === 'reminders'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders</span>
            <span className="font-mono text-xs opacity-75 tabular-nums">({counts.reminders})</span>
          </button>

          <button
            onClick={() => onFilterChange('active')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentFilter === 'active'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Active</span>
            <span className="font-mono text-xs opacity-75 tabular-nums">({counts.active})</span>
          </button>

          <button
            onClick={() => onFilterChange('completed')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentFilter === 'completed'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className="font-mono text-xs opacity-75 tabular-nums">({counts.completed})</span>
          </button>

          <button
            onClick={() => onFilterChange('insights')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentFilter === 'insights'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>
        </nav>

        {/* Zone 3: Primary action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isInstalled && (
            <button
              onClick={isInstallable ? install : onOpenInstall}
              title="Install MinimaList on your phone or computer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={onOpenInstall}
            title="Install on phone / Google Play Store guide"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="hidden sm:inline">Phone Guide</span>
          </button>

          <button
            onClick={onOpenImageToTasks}
            title="Convert image to to-do items post confirmation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            <span className="hidden sm:inline">Image to Tasks</span>
          </button>

          <button
            onClick={onOpenSettings}
            title={
              settings.autoReminderEnabled
                ? `Default 1-hour auto-reminder is active (${settings.defaultReminderOffsetMinutes}m)`
                : 'Default auto-reminder is disabled'
            }
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap"
          >
            {settings.autoReminderEnabled ? (
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span className="hidden md:inline">
              {settings.autoReminderEnabled
                ? `${settings.defaultReminderOffsetMinutes}m Auto-Reminder`
                : 'No Auto-Reminder'}
            </span>
            <Sliders className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

