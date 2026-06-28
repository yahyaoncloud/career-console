import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher, Form } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Code, Network, Eye, ExternalLink, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const PortfolioSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  architectureDiagram: z.string().optional(),
  techStack: z.string().min(1, "At least one technology is required"), // We will split by comma
  githubLink: z.string().url().optional().or(z.literal('')),
  demoLink: z.string().url().optional().or(z.literal('')),
  caseStudy: z.string().optional(),
  category: z.enum(['Infrastructure', 'Full-stack', 'DevOps', 'AI & ML'])
});

type PortfolioFormData = z.infer<typeof PortfolioSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const projects = await prisma.portfolio.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { projects };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.portfolio.update({
        where: { id, userId: user.id },
        data: { deletedAt: new Date() }
      });
      return { success: true, message: 'Project deleted' };
    }

    const data = Object.fromEntries(formData);
    const result = PortfolioSchema.safeParse(data);
    
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { id, techStack, githubLink, demoLink, ...rest } = result.data;
    const techArray = techStack.split(',').map(t => t.trim()).filter(Boolean);
    const cleanGithub = githubLink || null;
    const cleanDemo = demoLink || null;

    if (intent === 'create') {
      await prisma.portfolio.create({
        data: {
          ...rest,
          techStack: techArray,
          githubLink: cleanGithub,
          demoLink: cleanDemo,
          userId: user.id
        }
      });
      return { success: true, message: 'Project created' };
    }

    if (intent === 'update' && id) {
      await prisma.portfolio.update({
        where: { id, userId: user.id },
        data: {
          ...rest,
          techStack: techArray,
          githubLink: cleanGithub,
          demoLink: cleanDemo
        }
      });
      return { success: true, message: 'Project updated' };
    }

    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export default function PortfolioManagerRoute() {
  const { projects } = useLoaderData<typeof loader>();
  
  // Phase 12: Memoize the portfolio projects list
  const sortedProjects = React.useMemo(() => projects, [projects]);
  
  const fetcher = useFetcher<typeof action>();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(PortfolioSchema),
    defaultValues: {
      title: '',
      description: '',
      architectureDiagram: '',
      techStack: '',
      githubLink: '',
      demoLink: '',
      caseStudy: '',
      category: 'Full-stack' as const
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === 'idle') {
      alert(fetcher.data.message);
      setEditingId(null);
      setIsAddingNew(false);
      reset();
    } else if (fetcher.data?.message && !fetcher.data.success && fetcher.state === 'idle') {
      alert('Error: ' + fetcher.data.message);
    }
  }, [fetcher.data, fetcher.state, reset]);

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    reset({
      title: '',
      description: '',
      architectureDiagram: '',
      techStack: '',
      githubLink: '',
      demoLink: '',
      caseStudy: '',
      category: 'Full-stack'
    });
  };

  const startEdit = (project: typeof projects[0]) => {
    setIsAddingNew(false);
    setEditingId(project.id);
    reset({
      id: project.id,
      title: project.title,
      description: project.description,
      architectureDiagram: project.architectureDiagram || '',
      techStack: project.techStack.join(', '),
      githubLink: project.githubLink || '',
      demoLink: project.demoLink || '',
      caseStudy: project.caseStudy || '',
      category: project.category as any
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
  };

  const onSubmit = (data: PortfolioFormData) => {
    fetcher.submit(
      { ...data, intent: isAddingNew ? 'create' : 'update' },
      { method: 'post' }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      fetcher.submit({ id, intent: 'delete' }, { method: 'post' });
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    'Infrastructure': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Full-stack': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'DevOps': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'AI & ML': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <Briefcase size={20} className="text-muted-foreground" />
            Portfolio CMS
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Manage public projects.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-mono font-bold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {(isAddingNew || editingId) && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-6">
            <Heading variant="h3">{isAddingNew ? 'Create New Project' : 'Edit Project'}</Heading>
            <button onClick={handleCancel} className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Project Title *</label>
                  <input
                    {...register('title')}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40", errors.title && "border-destructive")}
                    placeholder="e.g. AWS Migration"
                  />
                  {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Full-stack">Full-stack Engineering</option>
                    <option value="Infrastructure">Infrastructure & Platform</option>
                    <option value="DevOps">DevOps & CI/CD</option>
                    <option value="AI & ML">AI & Machine Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Tech Stack (comma separated) *</label>
                  <input
                    {...register('techStack')}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40", errors.techStack && "border-destructive")}
                    placeholder="React, Node.js, AWS..."
                  />
                  {errors.techStack && <p className="text-destructive text-xs mt-1">{errors.techStack.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">GitHub URL</label>
                    <input
                      {...register('githubLink')}
                      className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Live Demo URL</label>
                    <input
                      {...register('demoLink')}
                      className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Short Description *</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40 resize-none", errors.description && "border-destructive")}
                    placeholder="Brief overview of the project..."
                  />
                  {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Detailed Case Study</label>
                  <textarea
                    {...register('caseStudy')}
                    rows={5}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40 resize-none font-mono text-xs"
                    placeholder="Markdown supported..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </fetcher.Form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedProjects.map((proj) => (
          <Card key={proj.id} className="flex flex-col border-border/50 bg-card hover:border-border transition-colors group">
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold font-sans text-lg leading-tight">{proj.title}</h3>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap", CATEGORY_COLORS[proj.category] || CATEGORY_COLORS['Full-stack'])}>
                  {proj.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {proj.description}
              </p>
              
              <div className="pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {proj.techStack.slice(0, 4).map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-mono rounded">
                      {tech}
                    </span>
                  ))}
                  {proj.techStack.length > 4 && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-mono rounded">
                      +{proj.techStack.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex gap-3">
                {proj.githubLink && (
                  <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="View Source">
                    <Code size={16} />
                  </a>
                )}
                {proj.demoLink && (
                  <a href={proj.demoLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Live Demo">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(proj)}
                  className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Edit Project"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {sortedProjects.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <Briefcase size={32} className="mb-4 opacity-20" />
            <p className="font-mono text-sm">No portfolio projects found.</p>
            <p className="font-mono text-xs opacity-50 mt-1">Click "New Project" to add your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
