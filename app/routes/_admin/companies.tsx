import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { useToast } from '../../providers/ToastProvider';
import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Building2, ExternalLink, Mail, Loader2, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  industry: z.string().optional(),
  hq: z.string().optional(),
  size: z.string().optional(),
  status: z.enum(['TARGET', 'APPLIED', 'INTERVIEWING', 'BLACKLISTED', 'TRACKING']).default('TRACKING'),
  notes: z.string().optional(),
  recruiter: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  tags: z.string().optional()
});

type CompanyFormData = z.infer<typeof CompanySchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companies = await prisma.company.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { companies };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.company.update({
        where: { id, userId: user.id },
        data: { deletedAt: new Date() }
      });
      return { success: true, message: 'Company deleted' };
    }

    const data = Object.fromEntries(formData);
    const result = CompanySchema.safeParse(data);
    
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { id, tags, ...rest } = result.data;
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (intent === 'create') {
      await prisma.company.create({
        data: {
          ...rest,
          status: rest.status as any,
          tags: tagArray,
          userId: user.id
        }
      });
      return { success: true, message: 'Company added' };
    }

    if (intent === 'update' && id) {
      await prisma.company.update({
        where: { id, userId: user.id },
        data: {
          ...rest,
          status: rest.status as any,
          tags: tagArray
        }
      });
      return { success: true, message: 'Company updated' };
    }

    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export default function CompaniesRoute() {
  const { companies } = useLoaderData<typeof loader>();
  
  // Phase 12: Memoize the company list
  const sortedCompanies = React.useMemo(() => companies, [companies]);
  
  const fetcher = useFetcher<typeof action>();
  const { success, error } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      name: '',
      website: '',
      industry: '',
      hq: '',
      size: '',
      status: 'TRACKING' as const,
      notes: '',
      recruiter: '',
      contactEmail: '',
      linkedinUrl: '',
      tags: ''
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        success(fetcher.data.message);
        setEditingId(null);
        setIsAddingNew(false);
        reset();
      } else {
        error(fetcher.data.message);
      }
    }
  }, [fetcher.data, fetcher.state, reset, success, error]);

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    reset({
      name: '',
      website: '',
      industry: '',
      hq: '',
      size: '',
      status: 'TRACKING',
      notes: '',
      recruiter: '',
      contactEmail: '',
      linkedinUrl: '',
      tags: ''
    });
  };

  const startEdit = (company: typeof companies[0]) => {
    setIsAddingNew(false);
    setEditingId(company.id);
    reset({
      id: company.id,
      name: company.name,
      website: company.website || '',
      industry: company.industry || '',
      hq: company.hq || '',
      size: company.size || '',
      status: company.status as any,
      notes: company.notes || '',
      recruiter: company.recruiter || '',
      contactEmail: company.contactEmail || '',
      linkedinUrl: company.linkedinUrl || '',
      tags: company.tags.join(', ')
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
  };

  const onSubmit = (data: CompanyFormData) => {
    fetcher.submit(
      { ...data, intent: isAddingNew ? 'create' : 'update' },
      { method: 'post' }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      fetcher.submit({ id, intent: 'delete' }, { method: 'post' });
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    'TARGET': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'APPLIED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'INTERVIEWING': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'BLACKLISTED': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'TRACKING': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <Building2 size={20} className="text-muted-foreground" />
            Companies List
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Track target companies and recruiter contacts.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-mono font-bold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      {(isAddingNew || editingId) && (
        <Card className="p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
            <h3 className="text-lg font-bold font-sans tracking-tight text-foreground">{isAddingNew ? 'Add New Company' : 'Edit Company'}</h3>
            <button onClick={handleCancel} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
              <X size={16} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Company Name *</label>
                  <input
                    {...register('name')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.name && "border-destructive")}
                    placeholder="e.g. Google"
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Website URL</label>
                  <input
                    {...register('website')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.website && "border-destructive")}
                    placeholder="https://google.com"
                  />
                  {errors.website && <p className="text-destructive text-xs mt-1">{errors.website.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">LinkedIn URL</label>
                  <input
                    {...register('linkedinUrl')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.linkedinUrl && "border-destructive")}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  >
                    <option value="TRACKING">Tracking</option>
                    <option value="TARGET">Target</option>
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEWING">Interviewing</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Industry</label>
                    <input
                      {...register('industry')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Size</label>
                    <input
                      {...register('size')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                      placeholder="10k+"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Headquarters</label>
                  <input
                    {...register('hq')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    placeholder="Mountain View, CA"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Recruiter Name</label>
                  <input
                    {...register('recruiter')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Contact Email</label>
                  <input
                    {...register('contactEmail')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.contactEmail && "border-destructive")}
                  />
                  {errors.contactEmail && <p className="text-destructive text-xs mt-1">{errors.contactEmail.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Tags (comma separated)</label>
                  <input
                    {...register('tags')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    placeholder="FAANG, AI, Remote"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-foreground"
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-border/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSubmitting ? 'Saving...' : 'Save Company'}
              </button>
            </div>
          </fetcher.Form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCompanies.map((company) => (
          <Card key={company.id} className="flex flex-col border-border/50 bg-card hover:border-border transition-colors">
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold font-sans text-lg leading-tight flex items-center gap-2">
                    {company.name}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </h3>
                  {company.industry && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {company.industry} • {company.size || 'Unknown Size'}
                    </p>
                  )}
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap", STATUS_COLORS[company.status] || STATUS_COLORS['TRACKING'])}>
                  {company.status}
                </span>
              </div>

              {(company.recruiter || company.contactEmail) && (
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">Contact</div>
                  {company.recruiter && (
                    <div className="text-sm font-medium">{company.recruiter}</div>
                  )}
                  {company.contactEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      <Mail size={12} />
                      <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>
                    </div>
                  )}
                </div>
              )}
              
              {company.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {company.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-mono rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex gap-3">
                {company.linkedinUrl && (
                  <a href={company.linkedinUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
                    <LinkIcon size={16} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(company)}
                  className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Edit Company"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete Company"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {sortedCompanies.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <Building2 size={32} className="mb-4 opacity-20" />
            <p className="font-mono text-sm">No companies found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
