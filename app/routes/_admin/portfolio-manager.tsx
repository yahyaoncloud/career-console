import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher, Link } from 'react-router';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { z } from 'zod';
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Code, ExternalLink, Loader2, Eye } from 'lucide-react';
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
  await requireAdmin(request);
  const projects = await prisma.portfolio.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { projects };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.portfolio.update({
        where: { id },
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
        where: { id },
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
  const sortedProjects = React.useMemo(() => projects, [projects]);
  const fetcher = useFetcher<typeof action>();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground flex items-center gap-3">
            <Briefcase size={24} className="text-primary" />
            Portfolio CMS
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-1.5 uppercase tracking-wider font-bold">
            Manage public deployments
          </p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-[10px] uppercase tracking-widest rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      {(isAddingNew || editingId) && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
            <h2 className="text-lg font-bold font-sans tracking-tight text-foreground">
              {isAddingNew ? 'Create New Deployment' : 'Edit Deployment'}
            </h2>
            <button onClick={handleCancel} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded">
              <X size={16} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Project Title *</label>
                  <input
                    {...register('title')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.title && "border-destructive")}
                    placeholder="e.g. AWS Migration"
                  />
                  {errors.title && <p className="text-destructive text-xs font-mono mt-1.5">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  >
                    <option value="Full-stack">Full-stack Engineering</option>
                    <option value="Infrastructure">Infrastructure & Platform</option>
                    <option value="DevOps">DevOps & CI/CD</option>
                    <option value="AI & ML">AI & Machine Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Tech Stack (comma separated) *</label>
                  <input
                    {...register('techStack')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.techStack && "border-destructive")}
                    placeholder="React, Node.js, AWS..."
                  />
                  {errors.techStack && <p className="text-destructive text-xs font-mono mt-1.5">{errors.techStack.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">GitHub URL</label>
                    <input
                      {...register('githubLink')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Live Demo URL</label>
                    <input
                      {...register('demoLink')}
                      className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Short Description *</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-foreground", errors.description && "border-destructive")}
                    placeholder="Brief overview of the project..."
                  />
                  {errors.description && <p className="text-destructive text-xs font-mono mt-1.5">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Detailed Case Study</label>
                  <textarea
                    {...register('caseStudy')}
                    rows={12}
                    className="w-full px-4 py-2.5 bg-background/50 border border-border/50 rounded text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-foreground"
                    placeholder="# Project Overview\n\nWrite detailed markdown here..."
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">Supports GitHub Flavored Markdown (H2, H3, Lists, Links, Code Blocks).</p>
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
                {isSubmitting ? 'Saving...' : 'Save Deployment'}
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedProjects.map((proj) => (
          <div key={proj.id} className="flex flex-col bg-card/50 backdrop-blur-sm border border-border/50 rounded-sm hover:border-border transition-colors group">
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold font-serif text-lg text-foreground leading-tight group-hover:text-primary transition-colors">{proj.title}</h3>
                <span className="px-2 py-0.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap">
                  {proj.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                {proj.description}
              </p>
              
              <div className="pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {proj.techStack.slice(0, 4).map((tech, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-background border border-border/50 text-muted-foreground text-[10px] font-mono rounded-sm">
                      {tech}
                    </span>
                  ))}
                  {proj.techStack.length > 4 && (
                    <span className="px-1.5 py-0.5 bg-background border border-border/50 text-muted-foreground text-[10px] font-mono rounded-sm">
                      +{proj.techStack.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex gap-4">
                <Link to={`/project/${proj.id}`} target="_blank" className="text-muted-foreground hover:text-primary transition-colors" title="View Public Page">
                  <Eye size={16} />
                </Link>
                {proj.githubLink && (
                  <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="View Source">
                    <Code size={16} />
                  </a>
                )}
                {proj.demoLink && (
                  <a href={proj.demoLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Live Demo">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(proj)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors"
                  title="Edit Project"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sortedProjects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-sm border border-dashed border-border/50">
            <Briefcase size={24} className="mb-3 text-muted-foreground/50" />
            <p className="font-mono text-sm uppercase tracking-widest font-bold">No deployments found</p>
            <p className="font-sans text-xs mt-1 text-muted-foreground/70">Click "New Project" to catalog your first system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
