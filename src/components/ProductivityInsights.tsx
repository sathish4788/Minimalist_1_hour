import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { TodoItem, UserSettings } from '../types/todo';
import { CheckCircle2, TrendingUp, Calendar, Zap, ArrowLeft, Clock } from 'lucide-react';

interface ProductivityInsightsProps {
  tasks: TodoItem[];
  settings: UserSettings;
  onBackToTasks: () => void;
}

export const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({
  tasks,
  settings,
  onBackToTasks,
}) => {
  // Compute last 7 days metrics
  const { trendData, tagData, stats } = useMemo(() => {
    const days: { dateStr: string; label: string; startMs: number; endMs: number }[] = [];
    const now = new Date();

    // Generate last 7 days starting from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
      const endMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      days.push({ dateStr, label, startMs, endMs });
    }

    let completedInLast7Days = 0;
    let createdInLast7Days = 0;
    const tagCountMap: Record<string, number> = {};

    const trendData = days.map((day) => {
      let completedCount = 0;
      let createdCount = 0;

      tasks.forEach((task) => {
        // Count completions on this day
        if (task.completed && task.completedAt && task.completedAt >= day.startMs && task.completedAt <= day.endMs) {
          completedCount++;
        }
        // Count tasks created on this day
        if (task.createdAt >= day.startMs && task.createdAt <= day.endMs) {
          createdCount++;
        }
      });

      completedInLast7Days += completedCount;
      createdInLast7Days += createdCount;

      return {
        date: day.dateStr,
        fullLabel: day.label,
        completed: completedCount,
        created: createdCount,
      };
    });

    // Tag distribution for completed tasks
    tasks.forEach((t) => {
      if (t.completed) {
        const tagName = t.tag || 'General';
        tagCountMap[tagName] = (tagCountMap[tagName] || 0) + 1;
      }
    });

    const tagData = Object.entries(tagCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Productivity rate & best day
    let bestDay = trendData[0];
    trendData.forEach((d) => {
      if (d.completed > bestDay.completed) {
        bestDay = d;
      }
    });

    const totalTasks = tasks.length;
    const completedAllTime = tasks.filter((t) => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedAllTime / totalTasks) * 100) : 0;

    return {
      trendData,
      tagData,
      stats: {
        completedInLast7Days,
        createdInLast7Days,
        completionRate,
        bestDay: bestDay.completed > 0 ? `${bestDay.fullLabel} (${bestDay.completed})` : 'None yet',
        activeReminders: tasks.filter((t) => t.hasReminder && !t.completed).length,
      },
    };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header with Back Action */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <button
            onClick={onBackToTasks}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Agenda</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Productivity Insights</span>
            <span className="text-xs font-mono font-normal text-neutral-400 dark:text-neutral-500 tabular-nums">
              (Last 7 Days)
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Visualizing velocity, completion trends, and category distribution.
          </p>
        </div>

        <button
          onClick={onBackToTasks}
          className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Close Insights
        </button>
      </div>

      {/* Quantitative Summary Strip (Zero-Pill Compliance) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            7-Day Completions
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 flex items-baseline gap-1">
            <span>{stats.completedInLast7Days}</span>
            <span className="text-xs font-sans font-normal text-neutral-400">tasks</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Overall Completion Rate
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {stats.completionRate}%
          </div>
        </div>

        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Most Productive Day
          </span>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {stats.bestDay}
          </div>
        </div>

        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Active 1h Reminders
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-5 h-5" />
            <span>{stats.activeReminders}</span>
          </div>
        </div>
      </div>

      {/* 7-Day Completion Trend Chart */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Task Velocity: Completed vs. Created
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white inline-block" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600 inline-block" />
              <span>Created</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={settings.theme === 'obsidian' ? '#FFFFFF' : '#171717'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={settings.theme === 'obsidian' ? '#FFFFFF' : '#171717'} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: settings.theme === 'obsidian' ? '#18181B' : '#FFFFFF',
                  borderColor: settings.theme === 'obsidian' ? '#27272A' : '#E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Tasks Completed"
                stroke={settings.theme === 'obsidian' ? '#FFFFFF' : '#171717'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#completedGrad)"
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Tasks Created"
                stroke="#9CA3AF"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#createdGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Habit Consistency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Completed Categories */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>Completions by Tag</span>
          </h3>

          {tagData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: settings.theme === 'obsidian' ? '#18181B' : '#FFFFFF',
                      borderColor: settings.theme === 'obsidian' ? '#27272A' : '#E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Completed" fill={settings.theme === 'obsidian' ? '#E4E4E7' : '#262626'} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400">
              No completed tasks with tags yet.
            </div>
          )}
        </div>

        {/* 1-Hour Reminder Efficiency Card */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Reminder Automation Health</span>
          </h3>

          <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>Default Auto-Reminder</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {settings.autoReminderEnabled ? `Active (${settings.defaultReminderOffsetMinutes}m)` : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>Sound Feedback</span>
              <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                {settings.soundEnabled ? `${settings.soundTone} chime` : 'Off'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>Desktop Notifications</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {settings.browserNotificationsEnabled ? 'Enabled' : 'Off / In-App Only'}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 pt-1">
              Automated 1-hour reminders keep pending items from slipping through the cracks. Configure timing anytime in preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
