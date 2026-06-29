import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { createLogger } from '../../lib/logger.server';
import { z } from 'zod';
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Calendar, MapPin, Building2, Loader2, ArrowRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APPLICATION_STATUS } from '../../constants';
import { useToast } from '../../providers/ToastProvider';

const ApplicationSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum([APPLICATION_STATUS.WISHLIST, APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.HR_SCREENING, APPLICATION_STATUS.TECHNICAL, APPLICATION_STATUS.OFFER, APPLICATION_STATUS.REJECTED, 'ARCHIVED']).default(APPLICATION_STATUS.APPLIED),
  appliedDate: z.string().min(1, "Applied Date is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  notes: z.string().optional()
});

type ApplicationFormData = z.infer<typeof ApplicationSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const logger = createLogger();
  const startTime = Date.now();
  const url = new URL(request.url);
  
  try {
    const user = await requireAdmin(request);
    const view = url.searchParams.get('view') || 'list';
    
    const applications = await prisma.application.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { appliedDate: 'desc' }
    });
    
    logger.info('Applications loaded successfully', {
      userId: user.id,
      count: applications.length,
      duration: Date.now() - startTime,
      route: '/_admin/applications'
    });
    
    return { applications, view };
  } catch (error: any) {
    logger.error('Failed to load applications', error, { route: '/_admin/applications' });
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const logger = createLogger();
  const startTime = Date.now();
  const user = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  const logContext = {
    userId: user.id,
    intent,
    route: '/_admin/applications',
  };

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.application.update({
        where: { id, userId: user.id },
        data: { deletedAt: new Date() }
      });
      logger.info(`Application deleted`, { ...logContext, applicationId: id, success: true, duration: Date.now() - startTime });
      return { success: true, message: 'Application deleted' };
    }

    const data = Object.fromEntries(formData);
    const result = ApplicationSchema.safeParse(data);
    
    if (!result.success) {
      logger.warn('Application validation failed', { ...logContext, errors: result.error.flatten().fieldErrors });
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { id, appliedDate, ...rest } = result.data;

    if (intent === 'create') {
      const app = await prisma.application.create({
        data: {
          ...rest,
          status: rest.status as any,
          priority: rest.priority as any,
          appliedDate: new Date(appliedDate),
          userId: user.id
        }
      });
      logger.info(`Application created`, { ...logContext, applicationId: app.id, success: true, duration: Date.now() - startTime });
      return { success: true, message: 'Application created' };
    }

    if (intent === 'update' && id) {
      await prisma.application.update({
        where: { id, userId: user.id },
        data: {
          ...rest,
          status: rest.status as any,
          priority: rest.priority as any,
          appliedDate: new Date(appliedDate)
        }
      });
      logger.info(`Application updated`, { ...logContext, applicationId: id, success: true, duration: Date.now() - startTime });
      return { success: true, message: 'Application updated' };
    }

    logger.warn('Invalid intent provided', logContext);
    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    logger.error('Application mutation failed', error, logContext);
    return { success: false, message: error.message };
  }
}

export default function ApplicationsRoute() {
  const { applications, view } = useLoaderData<typeof loader>();
  const sortedApplications = React.useMemo(() => applications, [applications]);
  const fetcher = useFetcher<typeof action>();
  const { success, error } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sortedApplications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      company: '',
      position: '',
      location: '',
      salary: '',
      employmentType: 'Full-time',
      priority: 'MEDIUM',
      status: APPLICATION_STATUS.APPLIED,
      appliedDate: new Date().toISOString().split('T')[0],
      website: '',
      notes: ''
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    reset({
      company: '',
      position: '',
      location: '',
      salary: '',
      employmentType: 'Full-time',
      priority: 'MEDIUM',
      status: APPLICATION_STATUS.APPLIED,
      appliedDate: new Date().toISOString().split('T')[0],
      website: '',
      notes: ''
    });
  };

  const startEdit = (app: typeof applications[0]) => {
    setIsAddingNew(false);
    setEditingId(app.id);
    reset({
      id: app.id,
      company: app.company,
      position: app.position,
      location: app.location || '',
      salary: app.salary || '',
      employmentType: (app.employmentType as any) || 'Full-time',
      priority: app.priority as any,
      status: app.status as any,
      appliedDate: new Date(app.appliedDate).toISOString().split('T')[0],
      website: app.website || '',
      notes: app.notes || ''
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
  };

  const onSubmit = (data: ApplicationFormData) => {
    fetcher.submit(
      { ...data, intent: isAddingNew ? 'create' : 'update' },
      { method: 'post' }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      fetcher.submit({ id, intent: 'delete' }, { method: 'post' });
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    [APPLICATION_STATUS.WISHLIST]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    [APPLICATION_STATUS.APPLIED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    [APPLICATION_STATUS.HR_SCREENING]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    [APPLICATION_STATUS.TECHNICAL]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    [APPLICATION_STATUS.OFFER]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    [APPLICATION_STATUS.REJECTED]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <Briefcase size={20} className="text-muted-foreground" />
            Job Tracker
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Manage and track your job applications.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-mono font-bold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          Add Application
        </button>
      </div>

      {(isAddingNew || editingId) && (
        <Card className="p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
            <h3 className="text-lg font-bold font-sans tracking-tight text-foreground">{isAddingNew ? 'Create New Application' : 'Edit Application'}</h3>
            <button onClick={handleCancel} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
              <X size={16} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Company *</label>
                  <input
                    {...register('company')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.company && "border-destructive")}
                    placeholder="e.g. Google"
                  />
                  {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Position *</label>
                  <input
                    {...register('position')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.position && "border-destructive")}
                    placeholder="e.g. Frontend Engineer"
                  />
                  {errors.position && <p className="text-destructive text-xs mt-1">{errors.position.message}</p>}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  >
                    <option value={APPLICATION_STATUS.WISHLIST}>Wishlist</option>
                    <option value={APPLICATION_STATUS.APPLIED}>Applied</option>
                    <option value={APPLICATION_STATUS.HR_SCREENING}>HR Screening</option>
                    <option value={APPLICATION_STATUS.TECHNICAL}>Technical Interview</option>
                    <option value={APPLICATION_STATUS.OFFER}>Offer Received</option>
                    <option value={APPLICATION_STATUS.REJECTED}>Rejected</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Priority</label>
                    <select
                      {...register('priority')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Date *</label>
                    <input
                      type="date"
                      {...register('appliedDate')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Location</label>
                  <input
                    {...register('location')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Salary</label>
                    <input
                      {...register('salary')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                      placeholder="$120k - $150k"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Type</label>
                    <select
                      {...register('employmentType')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSubmitting ? 'Saving...' : 'Save Application'}
              </button>
            </div>
          </fetcher.Form>
        </Card>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[600px]">
        {/* Table Header */}
        <div className="flex bg-muted/50 border-b border-border font-mono text-xs font-bold text-muted-foreground px-4 py-3 shrink-0">
          <div className="w-[30%]">Company</div>
          <div className="w-[30%]">Role</div>
          <div className="w-[15%] hidden md:block">Status</div>
          <div className="w-[15%] hidden lg:block">Date</div>
          <div className="flex-1 text-right">Actions</div>
        </div>
        
        {/* Virtualized Body */}
        <div 
          ref={parentRef} 
          className="flex-1 overflow-auto relative"
        >
          {sortedApplications.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <Briefcase size={32} className="mx-auto mb-4 opacity-20" />
              <p className="font-mono text-sm">No applications found.</p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const app = sortedApplications[virtualRow.index];
                return (
                  <div
                    key={app.id}
                    className="absolute top-0 left-0 w-full flex items-center px-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors bg-card"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="w-[30%] pr-2">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 size={16} className="text-muted-foreground shrink-0" />
                        <span className="font-semibold truncate">{app.company}</span>
                      </div>
                    </div>
                    <div className="w-[30%] pr-2">
                      <span className="text-sm truncate block">{app.position}</span>
                    </div>
                    <div className="w-[15%] hidden md:block pr-2">
                      <span className={cn("px-2 py-1 rounded text-[10px] font-mono font-bold whitespace-nowrap", STATUS_COLORS[app.status] || STATUS_COLORS[APPLICATION_STATUS.APPLIED])}>
                        {app.status}
                      </span>
                    </div>
                    <div className="w-[15%] hidden lg:block pr-2 text-sm text-muted-foreground font-mono truncate">
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(app)}
                          className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
