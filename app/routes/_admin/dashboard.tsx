import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { LayoutDashboard, Calendar, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Heading } from '../../components/ui/Heading';
import { StatCard } from '../../components/shared/StatCard';
import { APPLICATION_STATUS } from '../../constants';
import React, { useState, useEffect } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireAdmin(request);

    // Fault tolerant data fetching with fallbacks
    let applications: any[] = [];
    let logs: any[] = [];
    let dbError: any = null;

    try {
      applications = await prisma.application.findMany({
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      dbError = dbError || { applications: error.message };
      applications = []; // Fallback to empty array
    }

    try {
      logs = await prisma.log.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      dbError = dbError || { logs: error.message };
      logs = []; // Fallback to empty array
    }

    const geminiTopics = [
      { topic: "Zero Trust Architecture in Multi-Cloud", description: "Implement identity-aware proxies and micro-segmentation for improved security posture across AWS and GCP environments.", action: "Review IAM policies and network boundaries." },
      { topic: "Optimizing Kubernetes Resources", description: "Leverage Vertical Pod Autoscaler and right-sizing techniques to reduce cluster costs while maintaining application performance.", action: "Audit pod resource requests and limits." },
      { topic: "Automating Incident Response", description: "Use Serverless functions (AWS Lambda/GCP Cloud Functions) to automatically remediate common alerts and reduce MTTR.", action: "Build a prototype runbook automation." },
      { topic: "eBPF for Deep Network Observability", description: "Deploy eBPF-based tooling like Cilium to gain granular insights into network flows and application performance without sidecars.", action: "Evaluate Cilium for the next cluster upgrade." }
    ];
    
    const randomTopic = geminiTopics[Math.floor(Math.random() * geminiTopics.length)];

    const recommendation: { disabled: boolean; data: { topic: string; description: string; action: string } | null } = {
      disabled: false,
      data: {
        topic: randomTopic.topic,
        description: randomTopic.description,
        action: randomTopic.action
      }
    };

    return { applications, logs, recommendation, dbError };
  } catch (error: any) {
    // Handle authentication/authorization errors
    if (error.status === 401 || error.status === 403) {
      throw error; // Let the error boundary handle auth errors
    }
    
    // For other errors, return a degraded state instead of failing completely
    console.error('Dashboard loader error:', error);
    return {
      applications: [],
      logs: [],
      recommendation: { disabled: true, data: null },
      dbError: { general: error.message }
    };
  }
}

export default function DashboardOverview() {
  const { applications, logs, recommendation, dbError } = useLoaderData<typeof loader>();
  const [minutesToMidnight, setMinutesToMidnight] = useState(0);
  const [timeRemainingStr, setTimeRemainingStr] = useState('');

  const total = applications.length;
  const pending = applications.filter((a) => ![APPLICATION_STATUS.OFFER, APPLICATION_STATUS.REJECTED].includes(a.status as any)).length;
  const offers = applications.filter((a) => a.status === APPLICATION_STATUS.OFFER).length;
  const rejected = applications.filter((a) => a.status === APPLICATION_STATUS.REJECTED).length;

  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const conversionRate = total > 0 ? Math.round(((total - pending - rejected) / total) * 100) : 0;

  const upcomingInterviews = applications
    .filter((a) => a.interviewDate && new Date(a.interviewDate) >= new Date())
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  const upcomingDeadlines = applications
    .filter((a) => a.deadline && new Date(a.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const statusCounts = {
    Wishlist: applications.filter((a) => a.status === APPLICATION_STATUS.WISHLIST).length,
    Applied: applications.filter((a) => a.status === APPLICATION_STATUS.APPLIED).length,
    Screening: applications.filter((a) => a.status === APPLICATION_STATUS.HR_SCREENING).length,
    Technical: applications.filter((a) => a.status === APPLICATION_STATUS.TECHNICAL).length,
    Offer: offers,
    Rejected: rejected,
  };

  const chartMax = Math.max(...Object.values(statusCounts), 1);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Error Banner for Fault Tolerance */}
      {dbError && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                Degraded Service Mode
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Some dashboard data is unavailable. The system is operating in a limited capacity.
              </p>
              {dbError.general && (
                <p className="text-xs font-mono text-amber-600 dark:text-amber-500 mt-1">
                  Error: {dbError.general}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Heading variant="h1" className="flex items-center gap-3">
          <LayoutDashboard size={28} className="text-zinc-400" />
          Dashboard Overview
        </Heading>
        <span className="font-mono text-sm text-zinc-500 block mt-2">
          Real-time telemetry and pipeline metrics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="TELEMETRY_PIPELINE"
          value={total}
          subtitle="Total Apps"
          progress={100}
          progressColor="bg-zinc-900 dark:bg-zinc-100"
        />

        <StatCard
          title="ACTIVE_PROCESSES"
          value={pending}
          subtitle="In Progress"
          progress={total > 0 ? (pending / total) * 100 : 0}
          progressColor="bg-indigo-500 dark:bg-indigo-400"
        />

        <StatCard
          title="SUCCESS_TERMINATION"
          value={offers}
          subtitle="Offers Recvd"
          valueColorClass="text-emerald-600 dark:text-emerald-500"
          progress={total > 0 ? (offers / total) * 100 : 0}
          progressColor="bg-emerald-500"
        />

        <StatCard
          title="OFFER_CONVERSION"
          value={`${offerRate}%`}
          subtitle="Offer Rate"
          progress={offerRate}
          progressColor="bg-zinc-900 dark:bg-zinc-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
              <div>
                <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block mb-1">PIPELINE_LOAD</span>
                <Heading variant="h4">Application Distribution</Heading>
              </div>
            </div>

            <div className="pt-2">
              <svg viewBox="0 0 500 180" className="w-full h-auto text-zinc-900 dark:text-zinc-100">
                <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2" opacity="0.1" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="currentColor" strokeWidth="1" strokeDasharray="2" opacity="0.1" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="2" opacity="0.1" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.2" />

                <text x="30" y="24" className="font-mono text-[9px] fill-zinc-500 text-right">{chartMax}</text>
                <text x="30" y="74" className="font-mono text-[9px] fill-zinc-500 text-right">{Math.round(chartMax / 2)}</text>
                <text x="30" y="154" className="font-mono text-[9px] fill-zinc-500 text-right">0</text>

                {Object.entries(statusCounts).map(([label, count], idx) => {
                  const barWidth = 40;
                  const xGap = 65;
                  const x = 55 + idx * xGap;
                  const barHeight = chartMax > 0 ? (count / chartMax) * 120 : 0;
                  const y = 150 - barHeight;

                  return (
                    <g key={label}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        className="fill-zinc-300 dark:fill-zinc-700 hover:fill-indigo-500 dark:hover:fill-indigo-400 transition-colors"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="font-mono text-[10px] fill-zinc-900 dark:fill-zinc-100 font-bold"
                      >
                        {count}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y="168"
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-zinc-500 uppercase tracking-tight"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
              <div>
                <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block mb-1">SCHEDULED_EVENTS</span>
                <Heading variant="h4">Upcoming Interviews</Heading>
              </div>
              <Calendar size={18} className="text-zinc-400" />
            </div>

            <div className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950/50">
                  <p className="font-mono text-sm text-zinc-500">No interviews scheduled yet</p>
                </div>
              ) : (
                upcomingInterviews.map((app) => (
                  <div
                    key={app.id}
                    className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-3">
                        <span className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">{app.company}</span>
                        <span className="font-mono text-[10px] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold tracking-wider">
                          {app.status}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">{app.position}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {new Date(app.interviewDate!).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500 block">
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

        <div className="space-y-8">
          {!recommendation.disabled && recommendation.data && (
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded border border-indigo-200 dark:border-indigo-900/50 space-y-4">
              <div className="flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} /> AI_MENTOR_SYNC
                  </span>
                  <Heading variant="h4">What to Learn Today</Heading>
                </div>
                <div className="flex items-center gap-2" title={`Expires in ${timeRemainingStr}`}>
                  <span className="font-mono text-[10px] text-zinc-500">{timeRemainingStr}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-sans">
                    <BookOpen size={16} className="text-indigo-500" />
                    {recommendation.data.topic}
                  </h5>
                  <p className="text-sm text-zinc-700 dark:text-zinc-400 mt-2 leading-relaxed">
                    {recommendation.data.description}
                  </p>
                </div>
                <div className="bg-white dark:bg-black p-4 rounded border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block mb-2 uppercase tracking-wider">ACTION_ITEM</span>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {recommendation.data.action}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <div>
                <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block mb-1">ALERT_QUEUE</span>
                <Heading variant="h4">Looming Deadlines</Heading>
              </div>
              <AlertCircle size={16} className="text-red-500" />
            </div>

            <div className="space-y-3 pt-1">
              {upcomingDeadlines.length === 0 ? (
                <p className="font-mono text-[13px] text-zinc-500 text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950/50">No critical deadlines pending</p>
              ) : (
                upcomingDeadlines.map((app) => (
                  <div key={app.id} className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{app.company}</span>
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        {new Date(app.deadline!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate uppercase tracking-wide">{app.position}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <span className="font-mono text-[11px] text-zinc-500 uppercase font-bold tracking-widest">System Audit Logs</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="font-mono text-[11px] space-y-2.5 max-h-[220px] overflow-y-auto pt-1 pb-1">
              {logs.map((log: any, index: number) => (
                <div key={index} className="space-y-1 leading-normal border-l-2 border-zinc-200 dark:border-zinc-800 pl-3 py-0.5">
                  <div className="flex justify-between text-zinc-500">
                    <span>[{new Date(log.createdAt).toISOString().split('T')[1].substring(0, 8)}]</span>
                    <span className={log.status === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-500' : log.status === 'WARNING' ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500'}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-300 pr-2 truncate">
                    <span className="text-zinc-400 dark:text-zinc-600">{log.module} //</span> {log.event}
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
