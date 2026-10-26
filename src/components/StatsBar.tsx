import { Search, X, ArrowUpDown, Flag, ZoomIn, ZoomOut, Maximize2, Minimize2, Type } from 'lucide-react';
import { UserSettings, FontSizeScale, ScreenWidthMode } from '../types/todo';

const FONT_SCALES: { id: FontSizeScale; pct: string; px: string }[] = [
  { id: 'sm', pct: '90%', px: '14.5px' },
  { id: 'md', pct: '100%', px: '16px' },
  { id: 'lg', pct: '115%', px: '18.5px' },
  { id: 'xl', pct: '130%', px: '21px' },
  { id: '2xl', pct: '150%', px: '24px' },
];

interface StatsBarProps {
  activeCount: number;
  remindersCount: number;
  completedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allTags: string[];
  settings: UserSettings;
  sortByPriority: boolean;
  onToggleSortByPriority: () => void;
  onClearCompleted?: () => void;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  activeCount,
  remindersCount,
  completedCount,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  allTags,
  settings,
  sortByPriority,
  onToggleSortByPriority,
  onClearCompleted,
  onUpdateSettings,
}) => {
  const currentScaleIndex = FONT_SCALES.findIndex(
    (f) => f.id === (settings.fontSizeScale || 'md')
  );
  const activeScale = FONT_SCALES[currentScaleIndex >= 0 ? currentScaleIndex : 1];

  const handleDecreaseFont = () => {
    if (!onUpdateSettings || currentScaleIndex <= 0) return;
    onUpdateSettings({ fontSizeScale: FONT_SCALES[currentScaleIndex - 1].id });
  };

  const handleIncreaseFont = () => {
    if (!onUpdateSettings || currentScaleIndex >= FONT_SCALES.length - 1) return;
    onUpdateSettings({ fontSizeScale: FONT_SCALES[currentScaleIndex + 1].id });
  };

  const handleToggleScreenFit = () => {
    if (!onUpdateSettings) return;
    const nextMode: ScreenWidthMode =
      settings.screenWidthMode === 'fit-screen' ? 'standard' : 'fit-screen';
    onUpdateSettings({ screenWidthMode: nextMode });
  };
  return (
    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
      {/* Zero-Pill Unboxed Quantitative Stats */}
      <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums text-xs">
        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
          {activeCount} {activeCount === 1 ? 'task' : 'tasks'} active
        </span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span>
          {remindersCount} {remindersCount === 1 ? 'reminder' : 'reminders'} set
        </span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span className="flex items-center gap-1.5">
          <span>{completedCount} completed</span>
          {completedCount > 0 && onClearCompleted && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-rose-600 dark:text-rose-400 hover:underline font-sans text-[11px] font-medium"
            >
              (Clear completed)
            </button>
          )}
        </span>
        {settings.autoReminderEnabled && (
          <>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="text-amber-700 dark:text-amber-400 font-sans">
              1h auto-reminder active
            </span>
          </>
        )}
      </div>

      {/* Toolbar: Font Size (+ / -), Screen Fit, Sort by Priority, Search & Tag Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Font Size Scaling (+ and -) Controls */}
        {onUpdateSettings && (
          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleDecreaseFont}
              disabled={currentScaleIndex <= 0}
              title="Decrease font size (-)"
              aria-label="Decrease font size"
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-750 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              className="px-1.5 font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 select-none tabular-nums"
              title={`Current text scale: ${activeScale.pct}`}
            >
              {activeScale.pct}
            </span>
            <button
              type="button"
              onClick={handleIncreaseFont}
              disabled={currentScaleIndex >= FONT_SCALES.length - 1}
              title="Increase font size (+)"
              aria-label="Increase font size"
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-750 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Screen Fit / Width Toggle Button */}
        {onUpdateSettings && (
          <button
            type="button"
            onClick={handleToggleScreenFit}
            title={
              settings.screenWidthMode === 'fit-screen'
                ? 'Switch to standard centered column'
                : 'Fit app to full screen width (Edge-to-Edge)'
            }
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap border ${
              settings.screenWidthMode === 'fit-screen'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold border-neutral-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {settings.screenWidthMode === 'fit-screen' ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Fit Screen: On</span>
                <span className="sm:hidden">Fit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Fit Screen</span>
                <span className="sm:hidden">Fit</span>
              </>
            )}
          </button>
        )}

        {/* Sort by Priority Toggle Button */}
        <button
          type="button"
          onClick={onToggleSortByPriority}
          title={
            sortByPriority
              ? 'Sorting by Priority (High to Low active) - click to revert to default order'
              : 'Click to sort high-priority items to the top'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 border ${
            sortByPriority
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold border-neutral-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <Flag className={`w-3 h-3 ${sortByPriority ? 'text-amber-400 dark:text-amber-600 fill-current' : 'text-neutral-400'}`} />
          <span>Sort by Priority</span>
          <ArrowUpDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 pr-7 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 outline-none w-36 sm:w-44 focus:w-52 transition-all focus:border-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tag filter tabs */}
        {allTags.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTag(null)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedTag === null
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              All tags
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag(selectedTag === t ? null : t)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedTag === t
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
