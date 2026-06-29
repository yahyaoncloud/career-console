import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useFetcher } from 'react-router';
import { cn } from '../../lib/utils';
import type { NotificationType } from '@prisma/client';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher();
  
  // Fetch initial notifications
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load('/api/notifications');
    }
  }, [fetcher]);

  const notifications = fetcher.data?.notifications || [];
  const unreadCount = fetcher.data?.unreadCount || 0;

  const markAsRead = (id: string) => {
    fetcher.submit({ intent: 'markRead', id }, { method: 'post', action: '/api/notifications' });
  };

  const markAllAsRead = () => {
    fetcher.submit({ intent: 'markAllRead' }, { method: 'post', action: '/api/notifications' });
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'ERROR': return <AlertCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-zinc-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-sm font-sans flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-mono">
                  {unreadCount} New
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-mono font-bold text-zinc-500 hover:text-indigo-600 transition-colors uppercase"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm font-mono flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-20" />
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {notifications.map((notif: any) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-3 relative",
                      !notif.read && "bg-indigo-50/30 dark:bg-indigo-900/10"
                    )}
                  >
                    {!notif.read && (
                      <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                    <div className="shrink-0 pt-0.5 ml-2">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={cn("text-sm font-bold font-sans", !notif.read ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-2 uppercase tracking-wider">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      {!notif.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1.5 h-fit rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          title="Acknowledge"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fetcher.submit({ intent: 'dismiss', id: notif.id }, { method: 'post', action: '/api/notifications' });
                        }}
                        className="p-1.5 h-fit rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Click away overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
