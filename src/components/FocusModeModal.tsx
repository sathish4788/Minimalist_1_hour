import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Plus,
  Trash2,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { TodoItem, UserSettings, Subtask } from '../types/todo';

interface FocusModeModalProps {
  task: TodoItem | null;
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<TodoItem>) => void;
  onSnooze: (id: string, minutes: number) => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  task,
  isOpen,
  onClose,
  settings,
  onCompleteTask,
  onUpdateTask,
  onSnooze,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(3600); // default 60 mins
  const [isRunning, setIsRunning] = useState(true);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [ambientSound, setAmbientSound] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Initialize timer from task's reminderAt
  useEffect(() => {
    if (!task) return;
    if (task.reminderAt) {
      const diffSecs = Math.max(0, Math.round((task.reminderAt - Date.now()) / 1000));
      setSecondsRemaining(diffSecs > 0 ? diffSecs : 3600);
    } else {
      setSecondsRemaining(settings.defaultReminderOffsetMinutes * 60);
    }
    setIsRunning(true);
  }, [task, settings.defaultReminderOffsetMinutes]);

  // Countdown loop
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning]);

  // Ambient focus sound synthesizer (soft pink noise)
  useEffect(() => {
    if (!ambientSound) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Generate soft pink noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Gentle lowpass filter for relaxing hum
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      noiseNodeRef.current = whiteNoise;
    } catch {
      // Audio context restricted or blocked
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound]);

  if (!isOpen || !task) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSubtask: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    const currentSubtasks = task.subtasks || [];
    onUpdateTask(task.id, { subtasks: [...currentSubtasks, newSubtask] });
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = (task.subtasks || []).filter((s) => s.id !== subtaskId);
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleAddMinutes = (extraMinutes: number) => {
    setSecondsRemaining((prev) => prev + extraMinutes * 60);
    onSnooze(task.id, extraMinutes);
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full shadow-2xl flex flex-col transition-all overflow-hidden ${
          isFullscreen ? 'max-w-4xl h-[92vh]' : 'max-w-xl max-h-[90vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono uppercase tracking-wider font-semibold text-[10px]">
              1-Hour Reminder Focus Session
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmbientSound(!ambientSound)}
              title={ambientSound ? 'Mute ambient pink noise' : 'Play calming focus sound'}
              className={`p-1.5 rounded-lg border transition-colors ${
                ambientSound
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {ambientSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Toggle view size"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Focus Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center text-center space-y-6">
          {/* Tag & Task Title */}
          <div className="space-y-1.5 max-w-md">
            {task.tag && (
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {task.tag}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {task.text}
            </h2>
            {task.notes && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                {task.notes}
              </p>
            )}
          </div>

          {/* Large Tabular Countdown Display */}
          <div className="py-2">
            <div className="font-mono text-5xl sm:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {timeFormatted}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 font-mono">
              {secondsRemaining === 0 ? 'Reminder reached!' : `${isRunning ? 'Focus timer running' : 'Paused'}`}
            </p>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={() => handleAddMinutes(5)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              +5m
            </button>

            <button
              onClick={() => handleAddMinutes(15)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              +15m
            </button>

            <button
              onClick={() => {
                onCompleteTask(task.id);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>

          {/* Subtasks Checklist for Focus Session */}
          <div className="w-full max-w-md pt-6 border-t border-neutral-100 dark:border-neutral-800 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Action Steps ({completedSubtasks}/{subtasks.length})
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {subtasks.length > 0 ? `${Math.round((completedSubtasks / subtasks.length) * 100)}% done` : 'No steps yet'}
              </span>
            </div>

            {/* Subtask input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add step or subtask (Press Enter)..."
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtaskText.trim()}
                className="p-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                {subtasks.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800/60 text-xs"
                  >
                    <button
                      onClick={() => handleToggleSubtask(step.id)}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          step.completed
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`truncate ${
                          step.completed
                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {step.text}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDeleteSubtask(step.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 ml-2"
                      title="Delete step"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Press Esc to exit focus mode</span>
          <button
            onClick={onClose}
            className="text-neutral-700 dark:text-neutral-300 font-medium hover:underline"
          >
            Return to agenda
          </button>
        </div>
      </div>
    </div>
  );
};
