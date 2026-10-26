import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Flag,
  FileText,
  CornerDownRight,
  BellOff,
  Target,
  ListChecks,
  Plus
} from 'lucide-react';
import { TodoItem, UserSettings, Subtask } from '../types/todo';
import { formatReminderCountdown, formatExactDateTime, toDateTimeLocalValue, fromDateTimeLocalValue } from '../utils/time';

interface TaskItemProps {
  task: TodoItem;
  settings: UserSettings;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TodoItem>) => void;
  onSnooze: (id: string, minutes: number) => void;
  onFocusTask?: (task: TodoItem) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  settings,
  onToggleComplete,
  onDelete,
  onUpdate,
  onSnooze,
  onFocusTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [showMenu, setShowMenu] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(
    task.reminderAt ? toDateTimeLocalValue(task.reminderAt) : toDateTimeLocalValue(Date.now() + 60 * 60 * 1000)
  );

  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleMenu = () => {
    if (!showMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 320px below, flip the popover menu UPWARD
      setOpenUpward(spaceBelow < 320);
    }
    setShowMenu((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(task.id, {
        text: editText.trim(),
        notes: editNotes.trim() || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleApplyCustomTime = () => {
    const timestamp = fromDateTimeLocalValue(customDateTime);
    if (timestamp) {
      onUpdate(task.id, {
        hasReminder: true,
        reminderAt: timestamp,
        reminderDismissed: false,
        reminderNotified: false,
      });
    }
    setShowDatePicker(false);
    setShowMenu(false);
  };

  const handleRemoveReminder = () => {
    onUpdate(task.id, {
      hasReminder: false,
      reminderAt: null,
      reminderDismissed: true,
    });
    setShowMenu(false);
  };

  const reminderInfo =
    task.hasReminder && task.reminderAt && !task.completed
      ? formatReminderCountdown(task.reminderAt)
      : null;

  return (
    <div
      className={`group relative border-b border-neutral-150 dark:border-neutral-800/80 transition-all rounded-lg my-1 ${
        settings.compactMode ? 'py-2.5' : 'py-3.5'
      } ${
        task.completed
          ? 'opacity-55 bg-neutral-50/40 dark:bg-neutral-900/20 border-l-4 border-l-transparent'
          : 'bg-white dark:bg-neutral-900 border-l-4 border-l-indigo-600 dark:border-l-indigo-400 shadow-2xs hover:shadow-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-850/60'
      }`}
    >
      <div className="flex items-start gap-3 px-2 sm:px-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? 'Mark uncompleted' : 'Mark completed'}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            task.completed
              ? 'bg-neutral-700 dark:bg-neutral-300 border-neutral-700 dark:border-neutral-300 text-white dark:text-neutral-900'
              : 'border-neutral-400 dark:border-neutral-500 hover:border-indigo-600 dark:hover:border-indigo-400 bg-white dark:bg-neutral-850 shadow-2xs'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
                className="w-full text-base font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-950 dark:text-white outline-none"
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes or details..."
                rows={2}
                className="w-full text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 outline-none resize-none font-medium"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Task Title (Bold & Bright for Active Tasks) */}
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-sm sm:text-base leading-snug break-words transition-all ${
                    task.completed
                      ? 'line-through text-neutral-400 dark:text-neutral-500 font-normal'
                      : 'text-neutral-950 dark:text-white font-bold tracking-tight text-[1.03rem] sm:text-[1.08rem]'
                  }`}
                >
                  {task.text}
                </span>

                {/* Priority flag if set */}
                {task.priority !== 'none' && !task.completed && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-mono uppercase tracking-wider shrink-0 font-bold ${
                      task.priority === 'high'
                        ? 'text-rose-600 dark:text-rose-400'
                        : task.priority === 'medium'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                    title={`${task.priority} priority`}
                  >
                    <Flag className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>

              {/* Notes Preview if available */}
              {task.notes && !task.completed && (
                <p className="mt-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-start gap-1 line-clamp-2">
                  <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400 dark:text-neutral-400" />
                  <span>{task.notes}</span>
                </p>
              )}

              {/* Unboxed Metadata Line (Section 1A zero-pill compliance) */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                {task.tag && (
                  <>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {task.tag}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                  </>
                )}

                {/* Reminder Countdown & Status */}
                {task.hasReminder && task.reminderAt ? (
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        task.completed
                          ? 'opacity-40'
                          : reminderInfo?.isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : reminderInfo?.isDueSoon
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    />
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        task.completed
                          ? 'line-through text-neutral-400'
                          : reminderInfo?.isOverdue
                          ? 'text-rose-600 dark:text-rose-400 font-medium'
                          : reminderInfo?.isDueSoon
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                      title={`Exact reminder: ${formatExactDateTime(task.reminderAt)}`}
                    >
                      {task.completed
                        ? `Reminder was set`
                        : `${reminderInfo?.text} (${formatExactDateTime(task.reminderAt)})`}
                    </span>

                    {reminderInfo?.isOverdue && !task.completed && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium ml-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Action needed</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400 dark:text-neutral-500">No reminder</span>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                  <>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} steps
                    </span>
                  </>
                )}

                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {task.completed
                    ? 'Completed'
                    : `Created ${new Date(task.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Menu */}
        <div className="flex items-center gap-1 shrink-0 relative" ref={menuRef}>
          {/* Quick Focus Button */}
          {onFocusTask && !task.completed && (
            <button
              type="button"
              onClick={() => onFocusTask(task)}
              title="Enter Zen Focus session for this task"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Target className="w-3 h-3 text-amber-500" />
              <span>Focus</span>
            </button>
          )}

          {/* Quick Snooze / Reschedule button if task has active reminder */}
          {task.hasReminder && !task.completed && (
            <button
              type="button"
              onClick={() => onSnooze(task.id, 60)}
              title="Quick Snooze: +1 Hour"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <CornerDownRight className="w-3 h-3" />
              <span>+1h</span>
            </button>
          )}

          {/* Direct Quick Delete Button (Always Accessible in 1 tap) */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title="Delete this task"
            aria-label="Delete this task"
            className="p-1 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More actions menu trigger */}
          <button
            type="button"
            onClick={handleToggleMenu}
            aria-label="More task actions"
            className={`p-1 rounded-md transition-colors ${
              showMenu
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Action Popover (Flipped UPWARD if near bottom so Delete is never cut off) */}
          {showMenu && (
            <div
              className={`absolute right-0 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 py-1.5 text-xs max-h-[75vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 ${
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              }`}
            >
              {onFocusTask && !task.completed && (
                <button
                  type="button"
                  onClick={() => {
                    onFocusTask(task);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                >
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span>Start Focus Session</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit text & notes</span>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                Reminder Controls
              </div>

              <button
                type="button"
                onClick={() => onSnooze(task.id, 15)}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Snooze +15 minutes</span>
              </button>

              <button
                type="button"
                onClick={() => onSnooze(task.id, 60)}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Snooze +1 hour</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Custom date & time...</span>
              </button>

              {showDatePicker && (
                <div className="p-2.5 mx-2 my-1 bg-neutral-50 dark:bg-neutral-800/80 rounded border border-neutral-200 dark:border-neutral-700">
                  <label className="block text-[10px] text-neutral-500 mb-1">
                    Select Exact Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 mb-2"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={handleApplyCustomTime}
                      className="px-2 py-1 text-[11px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded"
                    >
                      Set Reminder
                    </button>
                  </div>
                </div>
              )}

              {task.hasReminder && (
                <button
                  type="button"
                  onClick={handleRemoveReminder}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
                >
                  <BellOff className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Remove reminder</span>
                </button>
              )}

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              <button
                type="button"
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete task</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
