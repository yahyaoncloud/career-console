import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { useToast } from '../../providers/ToastProvider';
import { User, Shield, Mail, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useEffect } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  if (user.role !== 'ADMIN') {
    throw new Response('Unauthorized', { status: 403 });
  }

  const authors = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { profile: true },
    orderBy: { createdAt: 'desc' }
  });

  return { authors, currentUserUid: user.firebaseUid };
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireUser(request);
  
  if (admin.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  const formData = await request.formData();
  const intent = formData.get('intent');
  const targetUid = formData.get('uid') as string;

  if (intent !== 'announce') {
    if (!targetUid) {
      return { success: false, message: 'Target user ID is required' };
    }

    if (targetUid === admin.firebaseUid) {
      return { success: false, message: 'You cannot perform this action on yourself' };
    }
  }

  try {
    if (intent === 'delete') {
      await prisma.user.update({
        where: { firebaseUid: targetUid },
        data: { deletedAt: new Date() }
      });
      return { success: true, message: 'User deleted successfully' };
    }

    if (intent === 'toggleRole') {
      const user = await prisma.user.findUnique({ where: { firebaseUid: targetUid } });
      if (!user) return { success: false, message: 'User not found' };
      
      const newRole = user.role === 'ADMIN' ? 'AUTHOR' : 'ADMIN';
      
      await prisma.user.update({
        where: { firebaseUid: targetUid },
        data: { role: newRole }
      });
      
      return { success: true, message: `User role updated to ${newRole}` };
    }

    if (intent === 'announce') {
      const message = formData.get('message') as string;
      if (!message) return { success: false, message: 'Message is required' };
      
      const allUsers = await prisma.user.findMany({ where: { deletedAt: null } });
      const notifications = allUsers.map(u => ({
        userId: u.id,
        title: 'Admin Announcement',
        message,
        type: 'INFO' as any
      }));
      
      await prisma.notification.createMany({ data: notifications });
      return { success: true, message: `Announcement sent to ${notifications.length} users` };
    }

    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export default function AuthorManagerRoute() {
  const { authors, currentUserUid } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { success, error } = useToast();

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        success(fetcher.data.message);
      } else {
        error(fetcher.data.message);
      }
    }
  }, [fetcher.data, fetcher.state, success, error]);

  const handleDeleteAuthor = (uid: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}'s account? This action cannot be undone.`)) {
      fetcher.submit({ intent: 'delete', uid }, { method: 'post' });
    }
  };

  const handleToggleRole = (uid: string) => {
    fetcher.submit({ intent: 'toggleRole', uid }, { method: 'post' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <User size={20} className="text-muted-foreground" />
            Author Management
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Manage user roles, access, and announcements.</p>
        </div>
      </div>

      <Card className="p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="bg-primary/10 p-3 rounded text-primary shrink-0 self-start md:self-center">
            <Mail size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold font-sans text-lg tracking-tight text-foreground">Broadcast Announcement</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
              Send a push notification to all users (Admins and Authors) in their dashboard.
            </p>
            <fetcher.Form method="post" className="mt-6 flex flex-col sm:flex-row gap-4">
              <input type="hidden" name="intent" value="announce" />
              <input 
                name="message" 
                required 
                placeholder="Type your announcement here..." 
                className="flex-1 px-4 py-2.5 text-sm rounded bg-background/50 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
              <button 
                type="submit" 
                disabled={fetcher.state !== 'idle'}
                className="px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-mono font-bold text-xs uppercase tracking-widest rounded disabled:opacity-50 transition-opacity whitespace-nowrap flex items-center justify-center"
              >
                Send Broadcast
              </button>
            </fetcher.Form>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authors.map((author) => {
          const isSelf = author.firebaseUid === currentUserUid;
          
          return (
            <Card key={author.id} className={cn(
              "flex flex-col border-border/50 bg-card hover:border-border transition-colors",
              isSelf && "border-primary/50 bg-primary/5"
            )}>
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                      {author.image || author.profile?.avatar ? (
                        <img 
                          src={author.profile?.avatar || author.image || ''} 
                          alt={author.name || 'User'} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold font-sans text-lg leading-tight">
                        {author.name || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5 text-xs font-mono text-muted-foreground">
                        <Mail size={10} />
                        <span className="truncate max-w-[150px]">{author.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1",
                    author.role === 'ADMIN' 
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" 
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {author.role === 'ADMIN' ? <ShieldAlert size={10} /> : <Shield size={10} />}
                    {author.role}
                  </span>
                  
                  {isSelf && (
                    <span className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                      YOU
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                <div className="text-xs text-muted-foreground font-mono">
                  Joined {new Date(author.createdAt).toLocaleDateString()}
                </div>
                {!isSelf && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(author.firebaseUid)}
                      disabled={fetcher.state !== 'idle'}
                      className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                      title={author.role === 'ADMIN' ? "Demote to Author" : "Promote to Admin"}
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAuthor(author.firebaseUid, author.name || 'User')}
                      disabled={fetcher.state !== 'idle'}
                      className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
