import { JobApplication, SystemLog } from '../types/types';
import { LayoutDashboard, Calendar, AlertCircle, FileText, CheckSquare, Layers, Clock, TrendingUp, Info, Sparkles, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
interface DashboardOverviewProps {
  applications: JobApplication[];
  logs: SystemLog[];
  onSelectTab: (tab: string) => void;
  onViewApplication: (app: JobApplication) => void;
}

export default function DashboardOverview({
  applications,
  logs,
  onSelectTab,
  onViewApplication,
}: DashboardOverviewProps) {
  // Compute analytics
  const total = applications.length;
  const pending = applications.filter((a) => !['Offer', 'Accepted', 'Rejected', 'Archived'].includes(a.status)).length;
  const offers = applications.filter((a) => ['Offer', 'Accepted'].includes(a.status)).length;
  const rejected = applications.filter((a) => a.status === 'Rejected').length;

  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const conversionRate = total > 0 ? Math.round(((total - pending - rejected) / total) * 100) : 0;

  // Filter interviews coming up (valid dates)
  const upcomingInterviews = applications
    .filter((a) => a.interviewDate && new Date(a.interviewDate) >= new Date())
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  // Filter looming deadlines
  const upcomingDeadlines = applications
    .filter((a) => a.deadline && new Date(a.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // SVG Chart data representation (applications count by status)
  const statusCounts = {
    Wishlist: applications.filter((a) => a.status === 'Wishlist').length,
    Applied: applications.filter((a) => a.status === 'Applied').length,
    Screening: applications.filter((a) => a.status === 'HR Screening').length,
    Technical: applications.filter((a) => a.status === 'Technical' || a.status === 'Manager Round' || a.status === 'Final Round').length,
    Offer: offers,
    Rejected: rejected,
  };

  const chartMax = Math.max(...Object.values(statusCounts), 1);

  // Gemini Learning Recommendation State
  const [learningRec, setLearningRec] = useState<{ topic: string, description: string, action: string } | null>(null);
  const [loadingRec, setLoadingRec] = useState(true);
  const [aiMentorDisabled, setAiMentorDisabled] = useState(false);
  const [minutesToMidnight, setMinutesToMidnight] = useState(0);
  const [timeRemainingStr, setTimeRemainingStr] = useState('');

  useEffect(() => {
    fetch('/api/gemini/recommend-learning')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.disabled) {
            setAiMentorDisabled(true);
          } else if (data.recommendation) {
            setLearningRec(data.recommendation);
          }
        }
      })
      .catch(err => console.error('Failed to load recommendation:', err))
      .finally(() => setLoadingRec(false));
  }, []);

  useEffect(() => {
    const updateExpiry = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      setMinutesToMidnight(diffMins);
      
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      setTimeRemainingStr(`${hours}h ${mins}m`);
    };
    updateExpiry();
    const interval = setInterval(updateExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6" id="dashboard-overview-module">
      {/* Top Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
          <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">TELEMETRY_PIPELINE</span>
          <div className="flex justify-between items-baseline">
            <span className="serif-header text-4xl font-bold text-zinc-900 dark:text-zinc-50">{total}</span>
            <span className="mono-text text-base text-zinc-500">Total Applications</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded overflow-hidden">
            <div className="bg-zinc-800 dark:bg-white h-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
          <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">ACTIVE_PROCESSES</span>
          <div className="flex justify-between items-baseline">
            <span className="serif-header text-4xl font-bold text-zinc-900 dark:text-zinc-50">{pending}</span>
            <span className="mono-text text-base text-zinc-500">In Progress</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded overflow-hidden">
            <div className="bg-zinc-800 dark:bg-zinc-500 h-full" style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
          <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">SUCCESS_TERMINATION</span>
          <div className="flex justify-between items-baseline">
            <span className="serif-header text-4xl font-bold text-emerald-800 dark:text-emerald-400">{offers}</span>
            <span className="mono-text text-base text-emerald-600 dark:text-emerald-400">Offers Recvd</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded overflow-hidden">
            <div className="bg-emerald-600 dark:bg-emerald-400 h-full" style={{ width: `${total > 0 ? (offers / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
          <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">OFFER_CONVERSION</span>
          <div className="flex justify-between items-baseline">
            <span className="serif-header text-4xl font-bold text-zinc-900 dark:text-zinc-50">{offerRate}%</span>
            <span className="mono-text text-base text-zinc-500">Offer Rate</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded overflow-hidden">
            <div className="bg-zinc-800 dark:bg-white h-full" style={{ width: `${offerRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Core Layout: Analytical Visualization and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Metrics & Timeline Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom SVG Data Visualization (Bypassing D3 complex rendering for flawless container size matching) */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
              <div>
                <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">PIPELINE_LOAD</span>
                <h4 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50">Application Distribution</h4>
              </div>
              <span className="mono-text text-sm text-zinc-400">Current Metrics</span>
            </div>

            {/* Custom high-density responsive SVG bar chart */}
            <div className="pt-2">
              <svg viewBox="0 0 500 180" className="w-full h-auto text-zinc-900 dark:text-zinc-100" id="pipeline-distribution-svg">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#888" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="#888" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#888" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="#888" strokeWidth="1" opacity="0.5" />

                {/* Y-axis Ticks */}
                <text x="30" y="24" className="mono-text text-[8px] fill-zinc-400 text-right">{chartMax}</text>
                <text x="30" y="74" className="mono-text text-[8px] fill-zinc-400 text-right">{Math.round(chartMax / 2)}</text>
                <text x="30" y="154" className="mono-text text-[8px] fill-zinc-400 text-right">0</text>

                {/* Column Render loops */}
                {Object.entries(statusCounts).map(([label, count], idx) => {
                  const barWidth = 40;
                  const xGap = 65;
                  const x = 55 + idx * xGap;
                  const barHeight = chartMax > 0 ? (count / chartMax) * 120 : 0;
                  const y = 150 - barHeight;

                  return (
                    <g key={label}>
                      {/* Interactive Bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="currentColor"
                        className="text-zinc-300 dark:text-zinc-800 hover:text-zinc-400 dark:hover:text-zinc-700 transition-colors"
                      />
                      {/* Active Indicator Top Text */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className="mono-text text-[9px] fill-zinc-800 dark:fill-zinc-300 font-bold"
                      >
                        {count}
                      </text>
                      {/* X-axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y="165"
                        textAnchor="middle"
                        className="mono-text text-[8px] fill-zinc-500 uppercase tracking-tight"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Looming Interview Events / Upcoming Timelines */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
              <div>
                <span className="mono-text text-sm text-zinc-400 uppercase tracking-widest block">SCHEDULED_EVENTS</span>
                <h4 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50">Upcoming Interviews</h4>
              </div>
              <Calendar size={16} className="text-zinc-400" />
            </div>

            <div className="space-y-3">
              {upcomingInterviews.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                  <p className="mono-text text-sm text-zinc-400">No interviews scheduled yet</p>
                </div>
              ) : (
                upcomingInterviews.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onViewApplication(app)}
                    className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="serif-header font-bold text-base text-zinc-900 dark:text-zinc-100">{app.company}</span>
                        <span className="mono-text text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 uppercase">
                          {app.status}
                        </span>
                      </div>
                      <p className="mono-text text-sm text-zinc-500 dark:text-zinc-400">{app.position}</p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="mono-text text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {new Date(app.interviewDate!).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="mono-text text-xs text-zinc-400 block">
                        {new Date(app.interviewDate!).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Looms & System Telemetry CLI Log */}
        <div className="space-y-6">
          {/* Gemini Learning Recommendation */}
          {!aiMentorDisabled && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 rounded border border-indigo-100 dark:border-indigo-900/30 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-indigo-500" />
              </div>
              <div className="flex justify-between items-center border-b border-indigo-200/50 dark:border-indigo-800/30 pb-2 relative z-10">
                <div>
                  <span className="mono-text text-sm text-indigo-500 uppercase tracking-widest block font-bold flex items-center gap-1">
                    <Sparkles size={12} /> AI_MENTOR_SYNC
                  </span>
                  <h4 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50">What to Learn Today</h4>
                </div>
                {!loadingRec && learningRec && (
                  <div className="flex items-center gap-2" title={`Expires in ${timeRemainingStr}`}>
                    <span className="mono-text text-[9px] text-zinc-500">{timeRemainingStr}</span>
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-indigo-100 dark:stroke-indigo-900/50" strokeWidth="4" />
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-indigo-500" strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - (minutesToMidnight / (24 * 60)) * 100} strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 relative z-10">
                {loadingRec ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-50">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                    <span className="mono-text text-xs text-indigo-600 dark:text-indigo-400">Synthesizing curriculum...</span>
                  </div>
                ) : learningRec ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <h5 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-base">
                        <BookOpen size={16} className="text-purple-500" />
                        {learningRec.topic}
                      </h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        {learningRec.description}
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-zinc-900/60 p-3 rounded border border-indigo-100 dark:border-indigo-900/50">
                      <span className="mono-text text-xs text-indigo-500 font-bold block mb-1">ACTION_ITEM</span>
                      <p className="text-sm text-zinc-800 dark:text-zinc-300 font-medium">
                        {learningRec.action}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">Unable to load recommendation.</p>
                )}
              </div>
            </div>
          )}

          {/* Priority action items/deadlines */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
              <div>
                <span className="mono-text text-xs text-zinc-400 uppercase block">ALERT_QUEUE</span>
                <h4 className="serif-header text-base font-bold text-zinc-900 dark:text-zinc-50">Looming Deadlines</h4>
              </div>
              <AlertCircle size={14} className="text-red-500" />
            </div>

            <div className="space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <p className="mono-text text-sm text-zinc-400 text-center py-4">No critical deadlines pending</p>
              ) : (
                upcomingDeadlines.map((app) => (
                  <div key={app.id} className="p-2.5 bg-red-50/30 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded text-sm space-y-1">
                    <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                      <span className="serif-header text-base">{app.company}</span>
                      <span className="mono-text text-red-600 dark:text-red-400">
                        {new Date(app.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mono-text text-xs text-zinc-500 dark:text-zinc-400 truncate">{app.position}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real CLI System Log representation */}
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3 text-[#e3e4e5] overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="mono-text text-xs text-zinc-400 uppercase font-bold">System Audit Logs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="font-mono text-xs space-y-2 max-h-[220px] overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="space-y-0.5 leading-normal">
                  <div className="flex justify-between text-zinc-500">
                    <span>[{log.timestamp.split('T')[1].substring(0, 8)}]</span>
                    <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'WARNING' ? 'text-amber-500' : 'text-zinc-400'}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-zinc-300 pr-2 block truncate">
                    <span className="text-zinc-500">{log.module} //</span> {log.event}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
