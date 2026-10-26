/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  INITIAL_TASKS,
} from './utils/storage';
import { TodoItem, UserSettings, FilterView, ReminderAlert, PriorityLevel } from './types/todo';
import { TopNav } from './components/TopNav';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { StatsBar } from './components/StatsBar';
import { SettingsModal } from './components/SettingsModal';
import { ReminderAlertBanner } from './components/ReminderAlertBanner';
import { ProductivityInsights } from './components/ProductivityInsights';
import { ImageToTasksModal } from './components/ImageToTasksModal';
import { FocusModeModal } from './components/FocusModeModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { InstallPhoneModal } from './components/InstallPhoneModal';
import { FirstTimeInstallPrompt } from './components/FirstTimeInstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { playChime, playCheckmarkSound } from './utils/audio';
import { triggerBrowserNotification } from './utils/notifications';
import { CheckCircle2, Clock, Inbox, Sparkles, Filter, Keyboard, Smartphone } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<TodoItem[]>(() => loadTasks());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [currentFilter, setCurrentFilter] = useState<FilterView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<TodoItem | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<ReminderAlert[]>([]);
  // Tick counter to force countdown updates every second without full remount
  const [, setTick] = useState(0);

  // Sync tasks to local storage
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Sync settings to local storage & apply theme class
  useEffect(() => {
    saveSettings(settings);

    // Theme switching on document element
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('dark');
    body.classList.remove('theme-paper', 'theme-obsidian');

    if (settings.theme === 'obsidian') {
      root.classList.add('dark');
      body.classList.add('theme-obsidian');
    } else if (settings.theme === 'paper') {
      body.classList.add('theme-paper');
    }

    // Dynamic Font Scaling (+ and -) applied to root REM units
    const scalePxMap: Record<string, string> = {
      sm: '14.5px',
      md: '16px',
      lg: '18.5px',
      xl: '21px',
      '2xl': '24px',
    };
    root.style.fontSize = scalePxMap[settings.fontSizeScale || 'md'] || '16px';
  }, [settings]);

  // Periodic timer tick & reminder checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTick((prev) => prev + 1);

      // Check for reminders due
      setTasks((prevTasks) => {
        let changed = false;
        const newAlerts: ReminderAlert[] = [];

        const updated = prevTasks.map((task) => {
          if (
            task.hasReminder &&
            task.reminderAt &&
            task.reminderAt <= now &&
            !task.completed &&
            !task.reminderDismissed &&
            !task.reminderNotified
          ) {
            changed = true;
            newAlerts.push({
              taskId: task.id,
              taskText: task.text,
              reminderAt: task.reminderAt,
              timestamp: now,
            });

            return {
              ...task,
              reminderNotified: true,
            };
          }
          return task;
        });

        // Trigger alert effects if any reminder fired
        if (newAlerts.length > 0) {
          if (settings.soundEnabled) {
            playChime(settings.soundTone, settings.soundVolume, settings.customToneData);
          }

          newAlerts.forEach((a) => {
            if (settings.browserNotificationsEnabled) {
              triggerBrowserNotification(
                'Task Reminder Due',
                `Reminder for: ${a.taskText}`
              ).catch(() => {});
            }
          });

          setActiveAlerts((current) => [...current, ...newAlerts]);
        }

        return changed ? updated : prevTasks;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    settings.soundEnabled,
    settings.soundTone,
    settings.soundVolume,
    settings.customToneData,
    settings.browserNotificationsEnabled,
  ]);

  // Keyboard shortcut listener ('/' for search, 'n' to focus input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      }
      if (e.key === 'p' || e.key === 'P') {
        setSortByPriority((prev) => !prev);
      }
      if (e.key === 'i' || e.key === 'I') {
        setCurrentFilter((prev) => (prev === 'insights' ? 'all' : 'insights'));
      }
      if (e.key === 'a' || e.key === 'A') {
        setCurrentFilter('all');
      }
      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleAddTask = useCallback(
    ({
      text,
      hasReminder,
      reminderOffsetMinutes,
      priority,
      tag,
    }: {
      text: string;
      hasReminder: boolean;
      reminderOffsetMinutes: number | null;
      priority: 'none' | 'low' | 'medium' | 'high';
      tag?: string;
    }) => {
      const now = Date.now();
      const newTask: TodoItem = {
        id: `task-${now}-${Math.random().toString(36).substring(2, 7)}`,
        text,
        completed: false,
        createdAt: now,
        hasReminder,
        reminderAt: hasReminder && reminderOffsetMinutes ? now + reminderOffsetMinutes * 60 * 1000 : null,
        reminderDismissed: false,
        reminderNotified: false,
        priority,
        tag,
      };

      setTasks((prev) => [newTask, ...prev]);
    },
    []
  );

  const handleToggleComplete = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const nextCompleted = !t.completed;
            if (nextCompleted && settings.soundEnabled) {
              playCheckmarkSound(settings.soundVolume);
            }
            return {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? Date.now() : null,
            };
          }
          return t;
        })
      );
      // Dismiss any active alert for this task
      setActiveAlerts((prev) => prev.filter((a) => a.taskId !== id));
    },
    [settings.soundEnabled, settings.soundVolume]
  );

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActiveAlerts((prev) => prev.filter((a) => a.taskId !== id));
  }, []);

  const handleUpdateTask = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const handleSnooze = useCallback((id: string, minutes: number) => {
    const nextTime = Date.now() + minutes * 60 * 1000;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              hasReminder: true,
              reminderAt: nextTime,
              reminderDismissed: false,
              reminderNotified: false,
            }
          : t
      )
    );
    // Dismiss from active alert banner
    setActiveAlerts((prev) => prev.filter((a) => a.taskId !== id));
  }, []);

  const handleDismissAlert = useCallback((taskId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.taskId !== taskId));
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reminderDismissed: true } : t))
    );
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleExportTasks = () => {
    const jsonStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minimalist-todo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setTasks(imported);
        }
      } catch {
        console.error('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleResetTasks = () => {
    setTasks(INITIAL_TASKS);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleConfirmExtractedTasks = useCallback(
    (
      tasksToAdd: {
        text: string;
        tag?: string;
        priority: PriorityLevel;
        notes?: string;
        hasReminder: boolean;
      }[]
    ) => {
      const now = Date.now();
      const newItems: TodoItem[] = tasksToAdd.map((t, idx) => ({
        id: `task-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        text: t.text,
        completed: false,
        createdAt: now - idx * 1000,
        hasReminder: t.hasReminder,
        reminderAt: t.hasReminder ? now + settings.defaultReminderOffsetMinutes * 60 * 1000 : null,
        reminderDismissed: false,
        reminderNotified: false,
        priority: t.priority,
        tag: t.tag,
        notes: t.notes,
      }));

      setTasks((prev) => [...newItems, ...prev]);
    },
    [settings.defaultReminderOffsetMinutes]
  );

  // Derive counts & filter tags
  const counts = useMemo(() => {
    let reminders = 0;
    let active = 0;
    let completed = 0;

    tasks.forEach((t) => {
      if (t.completed) completed++;
      else active++;
      if (t.hasReminder && !t.completed) reminders++;
    });

    return { all: tasks.length, reminders, active, completed };
  }, [tasks]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.tag) tagSet.add(t.tag);
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Priority rank weights for priority sorting
  const PRIORITY_SCORES: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  // Filter and sort tasks based on currentFilter, search, selectedTag, and sortByPriority
  const filteredTasks = useMemo(() => {
    const list = tasks.filter((task) => {
      // Completed visibility toggle
      if (settings.hideCompleted && task.completed) {
        return false;
      }

      // Filter tabs
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;
      if (currentFilter === 'reminders' && (!task.hasReminder || task.completed)) return false;

      // Tag filter
      if (selectedTag && task.tag !== selectedTag) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = task.text.toLowerCase().includes(q);
        const matchNotes = task.notes ? task.notes.toLowerCase().includes(q) : false;
        const matchTag = task.tag ? task.tag.toLowerCase().includes(q) : false;
        if (!matchText && !matchNotes && !matchTag) return false;
      }

      return true;
    });

    if (!sortByPriority) {
      return list;
    }

    // Sort ensuring high-priority items always appear at the top of the list
    return [...list].sort((a, b) => {
      // If completed status differs, keep active tasks above completed
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      const scoreA = PRIORITY_SCORES[a.priority] || 0;
      const scoreB = PRIORITY_SCORES[b.priority] || 0;

      // Primary: High priority items appear first
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Secondary: If both have reminders, soonest reminder first
      if (a.hasReminder && b.hasReminder && a.reminderAt && b.reminderAt) {
        return a.reminderAt - b.reminderAt;
      }

      // Fallback: Newer items first
      return b.createdAt - a.createdAt;
    });
  }, [tasks, currentFilter, selectedTag, searchQuery, settings.hideCompleted, sortByPriority]);



  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors selection:bg-neutral-200 dark:selection:bg-neutral-700">
      {/* Top Bar Navigation */}
      <TopNav
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        counts={counts}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImageToTasks={() => setIsImageModalOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
      />

      {/* Main Viewport Container */}
      <main
        className={`flex-1 w-full mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-36 space-y-6 transition-all duration-200 ${
          settings.screenWidthMode === 'fit-screen'
            ? 'max-w-full'
            : settings.screenWidthMode === 'wide'
            ? 'max-w-6xl'
            : 'max-w-4xl'
        }`}
      >
        {currentFilter === 'insights' ? (
          <ProductivityInsights
            tasks={tasks}
            settings={settings}
            onBackToTasks={() => setCurrentFilter('all')}
          />
        ) : (
          <>
            {/* Editorial Subtitle & Context Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {currentFilter === 'all'
                    ? 'Daily Agenda'
                    : currentFilter === 'reminders'
                    ? 'Scheduled Reminders'
                    : currentFilter === 'active'
                    ? 'Active Tasks'
                    : 'Completed Tasks'}
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {settings.autoReminderEnabled
                    ? `1-hour auto-reminder is active for all new tasks. Manage in settings.`
                    : 'Default auto-reminder is turned off. Set reminders manually per task.'}
                </p>
              </div>

              <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 opacity-60" />
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Task Input Capture Bar */}
            <section aria-label="Add Task">
              <TaskInput
                settings={settings}
                onAddTask={handleAddTask}
                onOpenImageToTasks={() => setIsImageModalOpen(true)}
              />
            </section>

            {/* Unboxed Metadata & Filter Toolbar */}
            <StatsBar
              activeCount={counts.active}
              remindersCount={counts.reminders}
              completedCount={counts.completed}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              allTags={allTags}
              settings={settings}
              sortByPriority={sortByPriority}
              onToggleSortByPriority={() => setSortByPriority((prev) => !prev)}
              onClearCompleted={handleClearCompleted}
              onUpdateSettings={handleUpdateSettings}
            />

            {/* Task List Presentation */}
            <section
              aria-label="Tasks List"
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-visible relative z-10 shadow-xs"
            >
              {filteredTasks.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      settings={settings}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                      onSnooze={handleSnooze}
                      onFocusTask={(t) => setFocusedTask(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 px-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    {currentFilter === 'reminders' ? (
                      <Clock className="w-5 h-5" />
                    ) : currentFilter === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Inbox className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {searchQuery
                        ? `No tasks found matching "${searchQuery}"`
                        : selectedTag
                        ? `No tasks tagged "${selectedTag}"`
                        : currentFilter === 'reminders'
                        ? 'No pending reminders scheduled'
                        : currentFilter === 'completed'
                        ? 'No completed tasks yet'
                        : 'All clear! Your task list is empty'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                      {currentFilter === 'reminders'
                        ? 'Add tasks with the 1-hour auto-reminder enabled or snooze existing items.'
                        : 'Capture your thoughts above. Every item gets a default 1-hour reminder automatically.'}
                    </p>
                  </div>

                  {(searchQuery || selectedTag) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTag(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Clear filters</span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Reminder Feature Callout & Quick Guidance Footer */}
            <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Tasks are remembered automatically with 1-hour chimes. Customize offsets or disable in{' '}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="underline hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
                  >
                    Settings (S)
                  </button>
                  .
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                <button
                  type="button"
                  onClick={() => setIsInstallOpen(true)}
                  className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Phone / Play Store</span>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setIsShortcutsOpen(true)}
                  className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 cursor-pointer"
                >
                  <Keyboard className="w-3 h-3" />
                  <span>Shortcuts (?)</span>
                </button>
                <span aria-hidden="true">·</span>
                <span>/ to search</span>
                <span aria-hidden="true">·</span>
                <span>Esc close</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Preferences & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportTasks={handleExportTasks}
        onImportTasks={handleImportTasks}
        onClearCompleted={handleClearCompleted}
        onResetTasks={handleResetTasks}
        completedCount={counts.completed}
        onOpenInstall={() => setIsInstallOpen(true)}
      />

      {/* Image to Tasks Modal (Post-Confirmation Flow) */}
      <ImageToTasksModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        settings={settings}
        onConfirmTasks={handleConfirmExtractedTasks}
      />

      {/* Zen Focus Mode Modal */}
      <FocusModeModal
        task={focusedTask}
        isOpen={!!focusedTask}
        onClose={() => setFocusedTask(null)}
        settings={settings}
        onCompleteTask={handleToggleComplete}
        onUpdateTask={handleUpdateTask}
        onSnooze={handleSnooze}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Android Phone & Google Play Store Modal */}
      <InstallPhoneModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      {/* First-Time User Install Now Prompt */}
      <FirstTimeInstallPrompt
        onOpenFullGuide={() => setIsInstallOpen(true)}
      />

      {/* Floating Active Reminder Alerts */}
      <ReminderAlertBanner
        alerts={activeAlerts}
        onDismiss={handleDismissAlert}
        onComplete={handleToggleComplete}
        onSnooze={handleSnooze}
      />

      {/* Offline connectivity indicator */}
      <OfflineIndicator />
    </div>
  );
}
