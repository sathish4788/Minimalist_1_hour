import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Tag,
  Flag,
  Trash2
} from 'lucide-react';
import { PriorityLevel, UserSettings } from '../types/todo';

interface ExtractedTaskItem {
  id: string;
  text: string;
  tag?: string;
  priority: PriorityLevel;
  notes?: string;
  selected: boolean;
}

interface ImageToTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onConfirmTasks: (
    tasksToAdd: {
      text: string;
      tag?: string;
      priority: PriorityLevel;
      notes?: string;
      hasReminder: boolean;
    }[]
  ) => void;
}

export const ImageToTasksModal: React.FC<ImageToTasksModalProps> = ({
  isOpen,
  onClose,
  settings,
  onConfirmTasks,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTaskItem[] | null>(null);
  const [apply1hReminder, setApply1hReminder] = useState(settings.autoReminderEnabled);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select an image under 10MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setExtractedTasks(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreviewUrl(result);
      setBase64Data(result);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!base64Data) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: selectedFile?.type || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract tasks from image.');
      }

      const data = await response.json();
      const rawTasks = data.tasks || [];

      if (rawTasks.length === 0) {
        setErrorMessage('No to-do tasks could be identified in this image. Try another photo or clearer notes.');
        setIsLoading(false);
        return;
      }

      // Map to confirmation list with default selection
      const mapped: ExtractedTaskItem[] = rawTasks.map((t: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx}`,
        text: t.text || 'Untitled task',
        tag: t.tag || undefined,
        priority: (['high', 'medium', 'low'].includes(t.priority?.toLowerCase())
          ? t.priority.toLowerCase()
          : 'none') as PriorityLevel,
        notes: t.notes || undefined,
        selected: true,
      }));

      setExtractedTasks(mapped);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with task extraction service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectTask = (id: string) => {
    setExtractedTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)) : null
    );
  };

  const handleUpdateTaskText = (id: string, text: string) => {
    setExtractedTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, text } : t)) : null
    );
  };

  const handleUpdateTaskPriority = (id: string, priority: PriorityLevel) => {
    setExtractedTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, priority } : t)) : null
    );
  };

  const handleRemoveTaskFromList = (id: string) => {
    setExtractedTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : null));
  };

  const handleFinalConfirm = () => {
    if (!extractedTasks) return;

    const selectedTasks = extractedTasks.filter((t) => t.selected && t.text.trim());
    if (selectedTasks.length === 0) {
      setErrorMessage('Please select at least one task to add.');
      return;
    }

    onConfirmTasks(
      selectedTasks.map((t) => ({
        text: t.text.trim(),
        tag: t.tag,
        priority: t.priority,
        notes: t.notes,
        hasReminder: apply1hReminder,
      }))
    );

    // Reset and close
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setBase64Data(null);
    setExtractedTasks(null);
    setErrorMessage(null);
    setIsLoading(false);
  };

  const selectedCount = extractedTasks ? extractedTasks.filter((t) => t.selected).length : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span>Image to To-Do List</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Convert handwritten notes, whiteboards, or screenshots into tasks with user confirmation.
            </p>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PHASE 1: Image Upload / Preview before extraction */}
          {!extractedTasks && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
                className="hidden"
              />

              {!imagePreviewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-850/50"
                >
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Click or drag & drop an image here
                  </h4>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Supports notebook pages, whiteboards, sticky notes, receipts, and screenshots (PNG, JPG, WebP)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-800 max-h-64 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Source for task extraction"
                      className="max-h-64 w-auto object-contain"
                    />
                    <button
                      onClick={() => {
                        setImagePreviewUrl(null);
                        setSelectedFile(null);
                        setBase64Data(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Choose another image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="truncate max-w-xs">{selectedFile?.name}</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-neutral-700 dark:text-neutral-300 underline font-medium"
                    >
                      Change image
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting Tasks with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Scan & Extract Tasks</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHASE 2: Post-Extraction Confirmation Review Flow */}
          {extractedTasks && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    Review Extracted Tasks ({selectedCount} of {extractedTasks.length} selected)
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Confirm which tasks to add. You can edit text, priority, and tags below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExtractedTasks(null)}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
                >
                  Rescan image
                </button>
              </div>

              {/* Reminder option for imported items */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Schedule default 1-hour reminder for confirmed tasks</span>
                </div>
                <input
                  type="checkbox"
                  checked={apply1hReminder}
                  onChange={(e) => setApply1hReminder(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 dark:accent-white rounded cursor-pointer"
                />
              </div>

              {/* Task confirmation checklist */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {extractedTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`pt-2 flex items-start gap-3 transition-opacity ${
                      t.selected ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={() => handleToggleSelectTask(t.id)}
                      className="mt-1.5 w-4 h-4 accent-neutral-900 dark:accent-white rounded cursor-pointer shrink-0"
                    />

                    <div className="flex-1 space-y-1 min-w-0">
                      <input
                        type="text"
                        value={t.text}
                        onChange={(e) => handleUpdateTaskText(t.id, e.target.value)}
                        className="w-full bg-transparent font-medium text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 border-b border-transparent focus:border-neutral-400 outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        {t.tag && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{t.tag}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Flag className="w-2.5 h-2.5" />
                          <select
                            value={t.priority}
                            onChange={(e) =>
                              handleUpdateTaskPriority(t.id, e.target.value as PriorityLevel)
                            }
                            className="bg-transparent border border-neutral-200 dark:border-neutral-700 rounded px-1 text-[10px]"
                          >
                            <option value="none">No priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </span>

                        {t.notes && <span className="italic truncate max-w-xs">{t.notes}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTaskFromList(t.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Cancel
          </button>

          {extractedTasks && (
            <button
              type="button"
              onClick={handleFinalConfirm}
              disabled={selectedCount === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Confirm & Add ({selectedCount}) Tasks</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
