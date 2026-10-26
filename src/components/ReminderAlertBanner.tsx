import React from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { ReminderAlert } from '../types/todo';

interface ReminderAlertBannerProps {
  alerts: ReminderAlert[];
  onDismiss: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

export const ReminderAlertBanner: React.FC<ReminderAlertBannerProps> = ({
  alerts,
  onDismiss,
  onComplete,
  onSnooze,
}) => {
  if (alerts.length === 0) return null;

  return (
    <aside
      aria-label="Active Reminders"
      className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)]"
    >
      {alerts.map((alert) => (
        <div
          key={alert.taskId}
          className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 p-4 rounded-xl shadow-2xl border border-neutral-800 dark:border-neutral-200 transition-all animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5 p-1 rounded-md bg-amber-500/20 text-amber-400 dark:text-amber-600 shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 dark:text-amber-600 font-semibold">
                    1-Hour Reminder Due
                  </span>
                </div>
                <h4 className="text-sm font-semibold truncate mt-0.5">{alert.taskText}</h4>
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.taskId)}
              className="text-neutral-400 hover:text-white dark:hover:text-neutral-900 p-1 rounded transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-3 pt-3 border-t border-neutral-800 dark:border-neutral-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSnooze(alert.taskId, 15)}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:hover:bg-neutral-300 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Clock className="w-3 h-3" />
                <span>+15m</span>
              </button>
              <button
                onClick={() => onSnooze(alert.taskId, 60)}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:hover:bg-neutral-300 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Clock className="w-3 h-3" />
                <span>+1 hour</span>
              </button>
            </div>

            <button
              onClick={() => onComplete(alert.taskId)}
              className="px-3 py-1 rounded bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 font-medium transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Complete</span>
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
};
