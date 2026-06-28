import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { LayoutDashboard, Calendar, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { useState, useEffect } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const applications = await prisma.application.findMany({
    where: { userId: user.firebaseUid },
    orderBy: { updatedAt: 'desc' }
  });

  const logs = await prisma.log.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  // Server-side fetching of AI recommendation
  // Returning disabled for now to save API tokens
  const recommendation = {
    disabled: true,
    data: null
  };

  return { applications, logs, recommendation };
}

export default function DashboardOverview() {
  const { applications, logs, recommendation } = useLoaderData<typeof loader>();
  const [minutesToMidnight, setMinutesToMidnight] = useState(0);
  const [timeRemainingStr, setTimeRemainingStr] = useState('');

  const total = applications.length;
  const pending = applications.filter((a) => !['OFFER', 'REJECTED'].includes(a.status)).length;
  const offers = applications.filter((a) => a.status === 'OFFER').length;
  const rejected = applications.filter((a) => a.status === 'REJECTED').length;

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
    Wishlist: applications.filter((a) => a.status === 'WISHLIST').length,
    Applied: applications.filter((a) => a.status === 'APPLIED').length,
    Screening: applications.filter((a) => a.status === 'HR_SCREENING').length,
    Technical: applications.filter((a) => a.status === 'TECHNICAL').length,
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-border pb-2">
        <Heading variant="h2" className="flex items-center gap-2">
          <LayoutDashboard size={24} className="text-muted-foreground" />
          Dashboard Overview
        </Heading>
        <span className="mono-text text-xs text-muted-foreground block">
          Real-time telemetry and pipeline metrics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-1 !p-4">
          <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">TELEMETRY_PIPELINE</span>
          <div className="flex justify-between items-baseline">
            <Heading variant="h2" className="text-3xl md:text-4xl font-bold">{total}</Heading>
            <span className="mono-text text-base text-muted-foreground">Total Apps</span>
          </div>
          <div className="w-full bg-muted h-1 rounded overflow-hidden">
            <div className="bg-foreground h-full" style={{ width: '100%' }} />
          </div>
        </Card>

        <Card className="space-y-1 !p-4">
          <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">ACTIVE_PROCESSES</span>
          <div className="flex justify-between items-baseline">
            <Heading variant="h2" className="text-3xl md:text-4xl font-bold">{pending}</Heading>
            <span className="mono-text text-base text-muted-foreground">In Progress</span>
          </div>
          <div className="w-full bg-muted h-1 rounded overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }} />
          </div>
        </Card>

        <Card className="space-y-1 !p-4">
          <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">SUCCESS_TERMINATION</span>
          <div className="flex justify-between items-baseline">
            <Heading variant="h2" className="text-3xl md:text-4xl font-bold text-emerald-500">{offers}</Heading>
            <span className="mono-text text-base text-emerald-600">Offers Recvd</span>
          </div>
          <div className="w-full bg-muted h-1 rounded overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${total > 0 ? (offers / total) * 100 : 0}%` }} />
          </div>
        </Card>

        <Card className="space-y-1 !p-4">
          <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">OFFER_CONVERSION</span>
          <div className="flex justify-between items-baseline">
            <Heading variant="h2" className="text-3xl md:text-4xl font-bold">{offerRate}%</Heading>
            <span className="mono-text text-base text-muted-foreground">Offer Rate</span>
          </div>
          <div className="w-full bg-muted h-1 rounded overflow-hidden">
            <div className="bg-foreground h-full" style={{ width: `${offerRate}%` }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">PIPELINE_LOAD</span>
                <Heading variant="h3">Application Distribution</Heading>
              </div>
            </div>

            <div className="pt-2">
              <svg viewBox="0 0 500 180" className="w-full h-auto text-foreground">
                <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" opacity="0.15" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.5" />

                <text x="30" y="24" className="mono-text text-[8px] fill-muted-foreground text-right">{chartMax}</text>
                <text x="30" y="74" className="mono-text text-[8px] fill-muted-foreground text-right">{Math.round(chartMax / 2)}</text>
                <text x="30" y="154" className="mono-text text-[8px] fill-muted-foreground text-right">0</text>

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
                        fill="currentColor"
                        className="text-primary hover:text-primary/80 transition-colors"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className="mono-text text-[9px] fill-foreground font-bold"
                      >
                        {count}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y="165"
                        textAnchor="middle"
                        className="mono-text text-[8px] fill-muted-foreground uppercase tracking-tight"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="mono-text text-sm text-muted-foreground uppercase tracking-widest block">SCHEDULED_EVENTS</span>
                <Heading variant="h4">Upcoming Interviews</Heading>
              </div>
              <Calendar size={16} className="text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {upcomingInterviews.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded">
                  <p className="mono-text text-sm text-muted-foreground">No interviews scheduled yet</p>
                </div>
              ) : (
                upcomingInterviews.map((app) => (
                  <div
                    key={app.id}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="serif-header font-bold text-base">{app.company}</span>
                        <span className="mono-text text-xs bg-card border border-border px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                          {app.status}
                        </span>
                      </div>
                      <p className="mono-text text-sm text-muted-foreground">{app.position}</p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="mono-text text-sm font-bold">
                        {new Date(app.interviewDate!).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="mono-text text-xs text-muted-foreground block">
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
          </Card>
        </div>

        <div className="space-y-6">
          {!recommendation.disabled && recommendation.data && (
            <div className="bg-primary/5 p-5 rounded border border-primary/20 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-primary" />
              </div>
              <div className="flex justify-between items-center border-b border-primary/20 pb-2 relative z-10">
                <div>
                  <span className="mono-text text-sm text-primary uppercase tracking-widest block font-bold flex items-center gap-1">
                    <Sparkles size={12} /> AI_MENTOR_SYNC
                  </span>
                  <Heading variant="h4" className="text-lg">What to Learn Today</Heading>
                </div>
                <div className="flex items-center gap-2" title={`Expires in ${timeRemainingStr}`}>
                  <span className="mono-text text-[9px] text-muted-foreground">{timeRemainingStr}</span>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold flex items-center gap-1.5 text-base">
                      <BookOpen size={16} className="text-primary" />
                      {recommendation.data.topic}
                    </h5>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {recommendation.data.description}
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded border border-border">
                    <span className="mono-text text-xs text-primary font-bold block mb-1">ACTION_ITEM</span>
                    <p className="text-sm font-medium">
                      {recommendation.data.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="mono-text text-xs text-muted-foreground uppercase block">ALERT_QUEUE</span>
                <Heading variant="h4">Looming Deadlines</Heading>
              </div>
              <AlertCircle size={14} className="text-destructive" />
            </div>

            <div className="space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <p className="mono-text text-sm text-muted-foreground text-center py-4">No critical deadlines pending</p>
              ) : (
                upcomingDeadlines.map((app) => (
                  <div key={app.id} className="p-2.5 bg-destructive/10 border border-destructive/30 rounded text-sm space-y-1">
                    <div className="flex justify-between font-bold">
                      <Heading as="span" variant="h4" className="text-base">{app.company}</Heading>
                      <span className="mono-text text-destructive">
                        {new Date(app.deadline!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mono-text text-xs text-muted-foreground truncate">{app.position}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="bg-card p-4 rounded border border-border space-y-3 overflow-hidden">
            <div className="flex justify-between items-center border-b border-border pb-1.5">
              <span className="mono-text text-xs text-muted-foreground uppercase font-bold">System Audit Logs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="font-mono text-xs space-y-2 max-h-[220px] overflow-y-auto">
              {logs.map((log: any, index: number) => (
                <div key={index} className="space-y-0.5 leading-normal">
                  <div className="flex justify-between text-muted-foreground">
                    <span>[{new Date(log.createdAt).toISOString().split('T')[1].substring(0, 8)}]</span>
                    <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'WARNING' ? 'text-amber-500' : 'text-muted-foreground'}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-foreground pr-2 block truncate">
                    <span className="text-muted-foreground">{log.module} //</span> {log.event}
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
