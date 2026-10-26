import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Tag, Flag, Check, ChevronDown, BellOff, Zap, Sparkles, Camera } from 'lucide-react';
import { PriorityLevel, UserSettings } from '../types/todo';
import { REMINDER_PRESETS, parseNaturalLanguageTime } from '../utils/time';

interface TaskInputProps {
  settings: UserSettings;
  onAddTask: (params: {
    text: string;
    hasReminder: boolean;
    reminderOffsetMinutes: number | null;
    priority: PriorityLevel;
    tag?: string;
  }) => void;
  onOpenImageToTasks?: () => void;
}

export interface TaskTemplate {
  title: string;
  tag?: string;
  priority?: PriorityLevel;
}

export const QUICK_TEMPLATES: TaskTemplate[] = [
  { title: 'Check email', tag: 'Work', priority: 'medium' },
  { title: 'Drink water', tag: 'Health', priority: 'low' },
  { title: 'Review projects', tag: 'Work', priority: 'high' },
  { title: 'Take a 5-min stretch break', tag: 'Health', priority: 'none' },
  { title: 'Plan tomorrow’s priorities', tag: 'Focus', priority: 'medium' },
];

const COMMON_TAGS = ['Work', 'Personal', 'Focus', 'Finance', 'Health', 'Errands'];

export const TaskInput: React.FC<TaskInputProps> = ({
  settings,
  onAddTask,
  onOpenImageToTasks,
}) => {
  const [text, setText] = useState('');
  const [hasReminder, setHasReminder] = useState(settings.autoReminderEnabled);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState<number | null>(
    settings.autoReminderEnabled ? settings.defaultReminderOffsetMinutes : null
  );
  const [priority, setPriority] = useState<PriorityLevel>('none');
  const [tag, setTag] = useState<string>('');
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const reminderMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Sync with global settings when user updates the default in settings
  useEffect(() => {
    setHasReminder(settings.autoReminderEnabled);
    setReminderOffsetMinutes(
      settings.autoReminderEnabled ? settings.defaultReminderOffsetMinutes : null
    );
  }, [settings.autoReminderEnabled, settings.defaultReminderOffsetMinutes]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reminderMenuRef.current && !reminderMenuRef.current.contains(e.target as Node)) {
        setShowReminderMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyTemplate = (template: TaskTemplate) => {
    setText(template.title);
    if (template.tag) setTag(template.tag);
    if (template.priority) setPriority(template.priority);
    setShowTemplateMenu(false);
    inputRef.current?.focus();
  };

  const parsedTime = text ? parseNaturalLanguageTime(text) : null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawTrimmed = text.trim();
    if (!rawTrimmed) return;

    // If natural language time detected and user hasn't explicitly turned off reminders
    const finalTitle = parsedTime && hasReminder ? parsedTime.cleanText || rawTrimmed : rawTrimmed;
    const finalOffset = parsedTime && hasReminder ? parsedTime.detectedMinutes : (reminderOffsetMinutes || settings.defaultReminderOffsetMinutes);

    onAddTask({
      text: finalTitle,
      hasReminder,
      reminderOffsetMinutes: hasReminder ? finalOffset : null,
      priority,
      tag: tag.trim() || undefined,
    });

    // Reset input fields
    setText('');
    setTag('');
    setPriority('none');
    // Reset to default reminder settings for next task
    setHasReminder(settings.autoReminderEnabled);
    setReminderOffsetMinutes(
      settings.autoReminderEnabled ? settings.defaultReminderOffsetMinutes : null
    );
    inputRef.current?.focus();
  };

  const getReminderLabel = () => {
    if (!hasReminder) return 'No Reminder';
    if (reminderOffsetMinutes === 60) return '1h Reminder';
    if (reminderOffsetMinutes === 15) return '15m Reminder';
    if (reminderOffsetMinutes === 30) return '30m Reminder';
    if (reminderOffsetMinutes === 45) return '45m Reminder';
    if (reminderOffsetMinutes === 120) return '2h Reminder';
    if (reminderOffsetMinutes === 240) return '4h Reminder';
    if (reminderOffsetMinutes === 720) return 'Tomorrow';
    return `${reminderOffsetMinutes}m Reminder`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-xs transition-all duration-150 focus-within:border-neutral-400 dark:focus-within:border-neutral-600"
    >
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done? (Press Enter to add)"
          className="flex-1 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs sm:text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Quick Add Template Chips (Instant Fill) */}
      {!text && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="text-[11px] font-sans flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Templates:</span>
          </span>
          {['Check email', 'Drink water', 'Review projects'].map((templateTitle) => {
            const foundTmpl = QUICK_TEMPLATES.find((t) => t.title === templateTitle) || {
              title: templateTitle,
            };
            return (
              <button
                key={templateTitle}
                type="button"
                onClick={() => handleApplyTemplate(foundTmpl)}
                className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                + {templateTitle}
              </button>
            );
          })}
        </div>
      )}

      {/* Natural Language Time Detected Notice */}
      {parsedTime && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-mono">
          <Clock className="w-3 h-3 shrink-0" />
          <span>
            Reminder detected: <strong>{parsedTime.label}</strong> for "{parsedTime.cleanText || text}"
          </span>
        </div>
      )}

      {/* Task Metadata & Reminder Presets Row */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Reminder Selector */}
          <div className="relative" ref={reminderMenuRef}>
            <button
              type="button"
              onClick={() => setShowReminderMenu(!showReminderMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                hasReminder
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Configure reminder for this task"
            >
              {hasReminder ? <Clock className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>{getReminderLabel()}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showReminderMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 py-1.5 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
                  Task Reminder
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHasReminder(false);
                    setReminderOffsetMinutes(null);
                    setShowReminderMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300"
                >
                  <span className="flex items-center gap-2">
                    <BellOff className="w-3.5 h-3.5 text-neutral-400" />
                    <span>No Reminder</span>
                  </span>
                  {!hasReminder && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                </button>

                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                {REMINDER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setHasReminder(true);
                      setReminderOffsetMinutes(preset.minutes);
                      setShowReminderMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      <span>{preset.label}</span>
                    </span>
                    {hasReminder && reminderOffsetMinutes === preset.minutes && (
                      <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Selector */}
          <div className="relative" ref={priorityMenuRef}>
            <button
              type="button"
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                priority === 'high'
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                  : priority === 'medium'
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                  : priority === 'low'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Flag className="w-3 h-3" />
              <span className="capitalize">{priority === 'none' ? 'Priority' : priority}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showPriorityMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 py-1 text-xs">
                {(['none', 'low', 'medium', 'high'] as PriorityLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setPriority(level);
                      setShowPriorityMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300 capitalize"
                  >
                    <span>{level === 'none' ? 'No Priority' : `${level} Priority`}</span>
                    {priority === level && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category/Tag Selector */}
          <div className="relative" ref={tagMenuRef}>
            <button
              type="button"
              onClick={() => setShowTagMenu(!showTagMenu)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                tag
                  ? 'text-neutral-900 dark:text-neutral-100 font-medium bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>{tag || 'Tag'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showTagMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 p-2 text-xs">
                <input
                  type="text"
                  placeholder="Custom tag..."
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-2 py-1 mb-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 outline-none text-neutral-800 dark:text-neutral-200"
                />
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTag('');
                      setShowTagMenu(false);
                    }}
                    className="text-left px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                  >
                    No tag
                  </button>
                  {COMMON_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTag(t);
                        setShowTagMenu(false);
                      }}
                      className="text-left px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-between"
                    >
                      <span>{t}</span>
                      {tag === t && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Templates Dropdown Button */}
          <div className="relative" ref={templateMenuRef}>
            <button
              type="button"
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title="Click to fill input with a common task template"
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Quick Add</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showTemplateMenu && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 p-1.5 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                  Select Task Template
                </div>

                <div className="flex flex-col gap-0.5 mt-1">
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-200 group transition-colors"
                    >
                      <span className="font-medium group-hover:text-neutral-900 dark:group-hover:text-white">
                        {tmpl.title}
                      </span>
                      {tmpl.tag && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                          {tmpl.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image to Tasks Scanner Trigger */}
          {onOpenImageToTasks && (
            <button
              type="button"
              onClick={onOpenImageToTasks}
              className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title="Convert photo or whiteboard notes into tasks"
            >
              <Camera className="w-3 h-3 text-neutral-500" />
              <span>Scan Image</span>
            </button>
          )}
        </div>

        {/* Quiet status helper note */}
        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
          {settings.autoReminderEnabled
            ? `Default ${settings.defaultReminderOffsetMinutes}m reminder applied`
            : 'Auto-reminder disabled in settings'}
        </div>
      </div>
    </form>
  );
};
