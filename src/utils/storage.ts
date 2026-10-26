import { TodoItem, UserSettings } from '../types/todo';

const STORAGE_KEYS = {
  TASKS: 'minimalist_todo_tasks_v1',
  SETTINGS: 'minimalist_todo_settings_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  autoReminderEnabled: true, // Default 1-hour reminder is enabled
  defaultReminderOffsetMinutes: 60, // 60 minutes = 1 hour
  soundEnabled: true,
  soundTone: 'mellow',
  soundVolume: 0.6,
  browserNotificationsEnabled: false,
  theme: 'slate',
  hideCompleted: false,
  compactMode: false,
  confirmDelete: false,
  fontSizeScale: 'md',
  screenWidthMode: 'standard',
};

export const INITIAL_TASKS: TodoItem[] = [
  {
    id: 'task-1',
    text: 'Review quarterly architecture proposal',
    notes: 'Focus on database scaling and notification dispatch reliability.',
    completed: false,
    createdAt: Date.now() - 15 * 60 * 1000,
    hasReminder: true,
    reminderAt: Date.now() + 45 * 60 * 1000, // 45m left from 1h reminder
    reminderDismissed: false,
    reminderNotified: false,
    priority: 'high',
    tag: 'Work',
  },
  {
    id: 'task-2',
    text: 'Call dental clinic to reschedule appointment',
    notes: '',
    completed: false,
    createdAt: Date.now() - 5 * 60 * 1000,
    hasReminder: true,
    reminderAt: Date.now() + 55 * 60 * 1000, // 55m left
    reminderDismissed: false,
    reminderNotified: false,
    priority: 'medium',
    tag: 'Personal',
  },
  {
    id: 'task-3',
    text: 'Order ergonomic wrist rest & sketch pad',
    completed: true,
    completedAt: Date.now() - 120 * 60 * 1000,
    createdAt: Date.now() - 180 * 60 * 1000,
    hasReminder: false,
    reminderAt: null,
    reminderDismissed: false,
    reminderNotified: false,
    priority: 'none',
    tag: 'Focus',
  },
];

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage write quota error
  }
}

export function loadTasks(): TodoItem[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return INITIAL_TASKS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 0) {
      return parsed;
    }
    return INITIAL_TASKS;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: TodoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch {
    // Ignore storage write quota error
  }
}
