import React, { useState, useMemo } from 'react';
import {
  Plus,
  X,
  Check,
  Clock,
  Trash2,
  ExternalLink,
  Minimize2,
  Maximize2,
  Bell,
  Sparkles,
  Layers,
  ArrowUpRight,
  Pin,
  LayoutGrid
} from 'lucide-react';
import { TodoItem, UserSettings, PriorityLevel } from '../types/todo';
import { playCheckmarkSound, playChime } from '../utils/audio';

interface TaskWidgetProps {
  tasks: TodoItem[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (
    text: string,
    tag?: string,
    priority?: PriorityLevel,
    reminderOffsetMinutes?: number
  ) => void;
  settings: UserSettings;
  isStandalone?: boolean;
  onOpenFullApp?: () => void;
  onClose?: () => void;
}

export const TaskWidget: React.FC<TaskWidgetProps> = ({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
  settings,
  isStandalone = false,
  onOpenFullApp,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState<string>('Personal');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [reminderOffset, setReminderOffset] = useState<number>(settings.defaultReminderOffsetMinutes || 60);
  const [viewMode, setViewMode] = useState<'standard' | 'compact'>('standard');
  const [showPinGuide, setShowPinGuide] = useState(false);
  const [lastCancelledTask, setLastCancelledTask] = useState<TodoItem | null>(null);

  // Filter and sort tasks: active tasks first, ordered by nearest reminder or priority
  const upcomingTasks = useMemo(() => {
    const active = tasks.filter((t) => !t.completed);
    return active.sort((a, b) => {
      // Overdue or upcoming reminders first
      if (a.reminderAt && b.reminderAt) {
        return a.reminderAt - b.reminderAt;
      }
      if (a.reminderAt) return -1;
      if (b.reminderAt) return 1;

      // Priority ordering
      const priorityOrder: Record<PriorityLevel, number> = {
        high: 3,
        medium: 2,
        low: 1,
        none: 0,
      };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      return b.createdAt - a.createdAt;
    });
  }, [tasks]);

  const handleComplete = (task: TodoItem) => {
    playCheckmarkSound(settings.soundVolume);
    onToggleComplete(task.id);
  };

  const handleCancelTask = (task: TodoItem) => {
    setLastCancelledTask(task);
    onDeleteTask(task.id);
    setTimeout(() => {
      setLastCancelledTask((current) => (current?.id === task.id ? null : current));
    }, 4000);
  };

  const handleUndoCancel = () => {
    if (lastCancelledTask) {
      onAddTask(
        lastCancelledTask.text,
        lastCancelledTask.tag,
        lastCancelledTask.priority,
        lastCancelledTask.reminderAt
          ? Math.max(1, Math.round((lastCancelledTask.reminderAt - Date.now()) / 60000))
          : undefined
      );
      setLastCancelledTask(null);
    }
  };

  const handleSubmitNewTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;

    if (settings.soundEnabled) {
      playChime(settings.soundTone, settings.soundVolume);
    }

    onAddTask(
      newText.trim(),
      newTag,
      newPriority,
      settings.autoReminderEnabled ? reminderOffset : undefined
    );

    setNewText('');
    setIsAdding(false);
  };

  const formatCountdown = (timestamp?: number | null) => {
    if (!timestamp) return null;
    const diff = timestamp - Date.now();
    if (diff < 0) {
      const minsOver = Math.abs(Math.round(diff / 60000));
      return { text: `${minsOver}m overdue`, isOverdue: true };
    }
    const mins = Math.round(diff / 60000);
    if (mins < 60) {
      return { text: `in ${mins}m`, isOverdue: false };
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return {
      text: remainingMins > 0 ? `in ${hours}h ${remainingMins}m` : `in ${hours}h`,
      isOverdue: false,
    };
  };

  const containerClasses = isStandalone
    ? 'min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-3 sm:p-6'
    : 'w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all';

  const cardClasses = isStandalone
    ? 'w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col'
    : 'flex flex-col w-full';

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Widget Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>Upcoming Tasks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {upcomingTasks.length}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Quick Add (+) */}
            <button
              onClick={() => setIsAdding((prev) => !prev)}
              title={isAdding ? 'Close add task form' : 'Add new task (+)'}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                isAdding
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <Plus className={`w-3.5 h-3.5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
              <span className="text-[11px] font-medium pr-0.5">Add</span>
            </button>

            {/* Pin / Shortcut Guide button */}
            <button
              onClick={() => setShowPinGuide((prev) => !prev)}
              title="How to pin widget on your phone home screen"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            {/* Standalone View: Open Full App button */}
            {isStandalone && (
              <a
                href="/"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px]"
                title="Enter full MinimaList application"
              >
                <span>Full App</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}

            {/* In-app floating mode close button */}
            {!isStandalone && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Close widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pin to Home Screen Guidance Drawer */}
        {showPinGuide && (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800/90 border-b border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between font-semibold text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-1">
                <Pin className="w-3 h-3 text-emerald-500" />
                <span>Use on Phone Home Screen Without Opening App</span>
              </span>
              <button
                onClick={() => setShowPinGuide(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="leading-relaxed">
              <strong>Method 1 (Instant):</strong> On your phone's home screen, <strong>long-press</strong> the MinimaList app icon &rarr; tap or drag <strong>"Tasks Widget"</strong> onto your home screen!
            </p>
            <p className="leading-relaxed">
              <strong>Method 2:</strong> In Chrome, open <code>/widget</code> &rarr; tap menu (⋮) &rarr; tap <strong>"Add to Home screen"</strong>.
            </p>
          </div>
        )}

        {/* Inline Quick Add Task (+) Section */}
        {isAdding && (
          <form
            onSubmit={handleSubmitNewTask}
            className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200/50 dark:border-emerald-900/30 space-y-2.5 animate-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="What needs to be done next?"
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:border-emerald-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={!newText.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick Tag Selector + 1-Hour Reminder Info */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
              <div className="flex items-center gap-1">
                {['Personal', 'Work', 'Health', 'Errands'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewTag(tag)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      newTag === tag
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {settings.autoReminderEnabled && (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>1-hr auto reminder</span>
                </span>
              )}
            </div>
          </form>
        )}

        {/* Undo Cancel Notice */}
        {lastCancelledTask && (
          <div className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-between text-xs animate-in fade-in">
            <span className="truncate mr-2">Cancelled "{lastCancelledTask.text}"</span>
            <button
              onClick={handleUndoCancel}
              className="text-emerald-400 dark:text-emerald-600 font-semibold hover:underline shrink-0 text-[11px]"
            >
              Undo
            </button>
          </div>
        )}

        {/* Upcoming Tasks List */}
        <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto opacity-50 text-emerald-500" />
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                All clear! No upcoming tasks.
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Tap <strong>+ Add</strong> above to set a quick reminder task.
              </p>
            </div>
          ) : (
            upcomingTasks.map((task) => {
              const countdown = formatCountdown(task.reminderAt);

              return (
                <div
                  key={task.id}
                  className="group flex items-center justify-between gap-2 p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors"
                >
                  {/* Left: Complete Checkbox + Title + Badges */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleComplete(task)}
                      title="Mark task completed"
                      className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition-colors shrink-0 group-hover:bg-white dark:group-hover:bg-neutral-900"
                    >
                      <Check className="w-3 h-3 text-transparent hover:text-emerald-500 transition-colors" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white truncate tracking-tight">
                        {task.text}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        {countdown && (
                          <span
                            className={`inline-flex items-center gap-0.5 font-mono ${
                              countdown.isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{countdown.text}</span>
                          </span>
                        )}

                        {task.tag && (
                          <span className="text-neutral-500 dark:text-neutral-400">
                            • {task.tag}
                          </span>
                        )}

                        {task.priority === 'high' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Cancel Task Button (Directly requested by user) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCancelTask(task)}
                      title="Cancel this task directly from widget"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Widget Footer Bar */}
        <div className="px-4 py-2 bg-neutral-100/60 dark:bg-neutral-850/80 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Auto 1-Hour Reminder Active</span>
          </div>

          {!isStandalone && onOpenFullApp && (
            <button
              onClick={onOpenFullApp}
              className="text-neutral-700 dark:text-neutral-300 font-medium hover:underline flex items-center gap-1"
            >
              <span>Full App</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}

          {isStandalone && (
            <a
              href="/"
              className="text-neutral-700 dark:text-neutral-300 font-medium hover:underline flex items-center gap-1"
            >
              <span>Open MinimaList App</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
