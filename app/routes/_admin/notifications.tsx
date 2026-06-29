import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { useEffect } from 'react';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Bell, Check, X, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { ROLES } from '../../constants';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  
  if (user.role !== ROLES.ADMIN) {
    throw new Response('Unauthorized', { status: 403 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false }
  });

  return { notifications, unreadCount };
}

export default function NotificationsRoute() {
  const { notifications, unreadCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleMarkAsRead = (id: string) => {
    fetcher.submit({ intent: 'markRead', id }, { method: 'post', action: '/api/notifications' });
  };

  const handleDismiss = (id: string) => {
    fetcher.submit({ intent: 'dismiss', id }, { method: 'post', action: '/api/notifications' });
  };

  const handleMarkAllAsRead = () => {
    fetcher.submit({ intent: 'markAllRead' }, { method: 'post', action: '/api/notifications' });
  };

  const handleDismissAll = () => {
    fetcher.submit({ intent: 'dismissAll' }, { method: 'post', action: '/api/notifications' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'ERROR': return <AlertCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-primary" />;
    }
  };

  // When fetcher completes successfully, we might want to show a toast (handled by the dropdown already silently, but here we could)
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && (fetcher.data as any).success && fetcher.formMethod) {
      // Just silently updates
    }
  }, [fetcher]);

  // Merge server notifications with optimistic updates if any
  const currentNotifications = fetcher.data?.notifications || notifications;
  const currentUnreadCount = fetcher.data?.unreadCount ?? unreadCount;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-2 border-b border-border/50">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <Bell size={20} className="text-muted-foreground" />
            Notifications
          </Heading>
          <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
            Manage your alerts, announcements, and system messages.
          </p>
        </div>
        
        <div className="flex gap-2">
          {currentUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-[10px] font-mono font-bold uppercase tracking-widest rounded hover:bg-muted/80 transition-colors"
            >
              <Check size={14} />
              Mark All Read
            </button>
          )}
          {currentNotifications.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-[10px] font-mono font-bold uppercase tracking-widest rounded hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      <Card className="p-0 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        {currentNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Bell size={32} className="text-muted-foreground/30 mb-4" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">You have no notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {currentNotifications.map((notif: any) => (
              <div 
                key={notif.id}
                className={cn(
                  "p-4 sm:p-6 transition-colors flex gap-4 relative hover:bg-muted/30",
                  !notif.read && "bg-primary/5"
                )}
              >
                {!notif.read && (
                  <span className="absolute top-6 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
                <div className="shrink-0 pt-0.5 ml-2">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className={cn("text-sm font-bold font-sans", !notif.read ? "text-foreground" : "text-muted-foreground")}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/70 mt-3 uppercase tracking-wider">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  {!notif.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Acknowledge"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDismiss(notif.id)}
                    className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
