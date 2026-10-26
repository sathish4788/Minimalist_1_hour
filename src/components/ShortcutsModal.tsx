import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Enter', desc: 'Add new task when in input field' },
  { key: '/', desc: 'Focus the search bar' },
  { key: 'S', desc: 'Toggle preferences & reminder automation settings' },
  { key: 'P', desc: 'Toggle priority sorting (High to Low)' },
  { key: 'I', desc: 'Switch to Productivity Insights view' },
  { key: 'A', desc: 'Switch to Daily Agenda view' },
  { key: '?', desc: 'Open this keyboard shortcuts guide' },
  { key: 'Esc', desc: 'Close any active dialog or modal' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 text-xs">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">{s.desc}</span>
              <kbd className="px-2 py-0.5 font-mono text-[11px] rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
