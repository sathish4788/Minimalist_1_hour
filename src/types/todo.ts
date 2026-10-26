export type PriorityLevel = 'none' | 'low' | 'medium' | 'high';

export type SoundTone = 'mellow' | 'zen' | 'gentle-bell' | 'marimba' | 'phone-system' | 'custom-phone';

export type AppTheme = 'slate' | 'paper' | 'obsidian';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  notes?: string;
  subtasks?: Subtask[];
  completed: boolean;
  completedAt?: number | null;
  createdAt: number;
  hasReminder: boolean;
  reminderAt: number | null; // epoch timestamp
  reminderDismissed: boolean;
  reminderNotified: boolean;
  priority: PriorityLevel;
  tag?: string;
}

export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type ScreenWidthMode = 'standard' | 'wide' | 'fit-screen';

export interface UserSettings {
  autoReminderEnabled: boolean; // default: true
  defaultReminderOffsetMinutes: number; // default: 60 (1 hour)
  soundEnabled: boolean; // default: true
  soundTone: SoundTone; // default: 'mellow'
  soundVolume: number; // 0.1 to 1.0, default: 0.6
  customToneName?: string; // name of selected custom audio file from phone
  customToneData?: string; // base64 data url of uploaded audio tone
  browserNotificationsEnabled: boolean; // default: false
  theme: AppTheme; // 'slate' | 'paper' | 'obsidian'
  hideCompleted: boolean;
  compactMode: boolean;
  confirmDelete: boolean;
  fontSizeScale: FontSizeScale; // default: 'md' (100%)
  screenWidthMode: ScreenWidthMode; // default: 'standard'
}

export type FilterView = 'all' | 'reminders' | 'active' | 'completed' | 'insights';

export interface ReminderAlert {
  taskId: string;
  taskText: string;
  reminderAt: number;
  timestamp: number;
}
