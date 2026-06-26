import React, { useState } from 'react';
import { PortfolioProject } from '../types/types';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Code, Network, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from './ui/Toast';

interface PortfolioManagerProps {
  portfolio: PortfolioProject[];
  onUpdatePortfolio: (updatedPortfolio: PortfolioProject[]) => Promise<void>;
}

export default function PortfolioManager({
  portfolio,
  onUpdatePortfolio,
}: PortfolioManagerProps) {
  const { toast, confirm } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [architectureDiagram, setArchitectureDiagram] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [caseStudy, setCaseStudy] = useState('');
  const [category, setCategory] = useState<'Infrastructure' | 'Full-stack' | 'DevOps' | 'AI & ML'>('Full-stack');

  const startEdit = (project: PortfolioProject) => {
    setEditingId(project.id);
    setIsAddingNew(false);
    setTitle(project.title);
    setDescription(project.description);
    setArchitectureDiagram(project.architectureDiagram || '');
    setTechStackInput(project.techStack.join(', '));
    setGithubLink(project.githubLink || '');
    setDemoLink(project.demoLink || '');
    setCaseStudy(project.caseStudy);
    setCategory(project.category);
  };

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setArchitectureDiagram('');
    setTechStackInput('');
    setGithubLink('');
    setDemoLink('');
    setCaseStudy('');
    setCategory('Full-stack');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ variant: 'warning', title: 'Validation failed', description: 'Title and Description are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const techStack = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      let updatedPortfolio: PortfolioProject[];

      if (isAddingNew) {
        const newProject: PortfolioProject = {
          id: `proj-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          architectureDiagram: architectureDiagram.trim() || undefined,
          techStack,
          githubLink: githubLink.trim() || undefined,
          demoLink: demoLink.trim() || undefined,
          caseStudy: caseStudy.trim(),
          category,
        };
        updatedPortfolio = [...portfolio, newProject];
      } else {
        updatedPortfolio = portfolio.map((p) => {
          if (p.id === editingId) {
            return {
              ...p,
              title: title.trim(),
              description: description.trim(),
              architectureDiagram: architectureDiagram.trim() || undefined,
              techStack,
              githubLink: githubLink.trim() || undefined,
              demoLink: demoLink.trim() || undefined,
              caseStudy: caseStudy.trim(),
              category,
            };
          }
          return p;
        });
      }

      await onUpdatePortfolio(updatedPortfolio);
      setEditingId(null);
      setIsAddingNew(false);
      toast({ variant: 'success', title: isAddingNew ? 'Project added' : 'Project updated', description: `"${title.trim()}" saved to portfolio.` });
    } catch (err) {
      console.error(err);
      toast({ variant: 'error', title: 'Save failed', description: 'Failed to update portfolio. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const project = portfolio.find((p) => p.id === id);
    confirm({
      title: 'Delete project?',
      description: `"${project?.title ?? 'This project'}" will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const updatedPortfolio = portfolio.filter((p) => p.id !== id);
          await onUpdatePortfolio(updatedPortfolio);
          toast({ variant: 'success', title: 'Project deleted', description: 'Portfolio updated.' });
        } catch (err) {
          console.error(err);
          toast({ variant: 'error', title: 'Delete failed', description: 'Failed to delete project.' });
        }
      },
    });
  };

  return (
    <div className="space-y-6" id="portfolio-manager-module">
      {/* View Header */}
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            <Briefcase size={18} className="mr-2 text-zinc-500" />
            Portfolio Content Manager
          </h3>
          <span className="mono-text text-[10px] text-zinc-500 block">
            End-to-End CMS · {portfolio.length} Live Projects Published
          </span>
        </div>
        {!editingId && !isAddingNew && (
          <button
            onClick={startAdd}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded text-xs font-medium hover:opacity-90 transition-opacity font-mono cursor-pointer"
          >
            <Plus size={14} />
            <span>ADD_PROJECT</span>
          </button>
        )}
      </div>

      {/* Editor Form for Add/Edit */}
      {(isAddingNew || editingId) && (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-950 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-900 pb-2">
            <h4 className="mono-text text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300">
              {isAddingNew ? 'Create New Portfolio Project' : 'Edit Project Details'}
            </h4>
            <button
              type="button"
              onClick={handleCancel}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Project Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                placeholder="e.g. Real-Time Distributed Transcoder"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Full-stack">Full-stack</option>
                <option value="DevOps">DevOps</option>
                <option value="AI & ML">AI & ML</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1 md:col-span-2">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-sans resize-y"
                placeholder="Brief summary of the architecture and utility..."
              />
            </div>

            {/* Tech Stack */}
            <div className="space-y-1 md:col-span-2">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Tech Stack (comma-separated)</label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                placeholder="Go, Raft, gRPC, LevelDB, Docker"
              />
            </div>

            {/* Github Link */}
            <div className="space-y-1">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">GitHub Link</label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                placeholder="https://github.com/username/project"
              />
            </div>

            {/* Demo Link */}
            <div className="space-y-1">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Demo Link</label>
              <input
                type="url"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                placeholder="https://demo.project.com"
              />
            </div>

            {/* Architectural Data Flow */}
            <div className="space-y-1 md:col-span-2">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Architectural Data Flow diagram (ASCII/Text)</label>
              <textarea
                rows={2}
                value={architectureDiagram}
                onChange={(e) => setArchitectureDiagram(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                placeholder="Client -> Edge Gateway -> Service A <-> Redis Cache"
              />
            </div>

            {/* Case Study */}
            <div className="space-y-1 md:col-span-2">
              <label className="mono-text text-[10px] text-zinc-500 uppercase block">Case Study / Implementation Details</label>
              <textarea
                rows={4}
                value={caseStudy}
                onChange={(e) => setCaseStudy(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-sans resize-y"
                placeholder="Detailed problem statement, architectural tradeoffs, custom optimizations..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-150 dark:border-zinc-900">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded text-xs font-mono hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={12} />
                  <span>SAVING_DATA...</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>COMMIT_CHANGES</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Existing Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolio.map((project) => (
          <div
            key={project.id}
            className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-150 group shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="mono-text text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 uppercase font-medium">
                  {project.category}
                </span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(project)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    title="Edit project"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h4 className="serif-header text-base font-bold text-zinc-900 dark:text-zinc-50">{project.title}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">{project.description}</p>

              {project.architectureDiagram && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded border border-zinc-150 dark:border-zinc-900 font-mono text-[9px] text-zinc-400 truncate">
                  <span className="text-[8px] uppercase tracking-wider block text-zinc-500 font-bold mb-0.5">FLOW_DIAGRAM</span>
                  {project.architectureDiagram}
                </div>
              )}

              <div className="flex flex-wrap gap-1 pt-1">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="mono-text text-[9px] bg-zinc-150/50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-transparent"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-xs">
              <div className="flex space-x-3">
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center space-x-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mono-text text-[10px]"
                  >
                    <Code size={11} />
                    <span>Source</span>
                  </a>
                )}
                {project.demoLink && (
                  <a
                    href={project.demoLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center space-x-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mono-text text-[10px]"
                  >
                    <Eye size={11} />
                    <span>Demo</span>
                  </a>
                )}
              </div>
              <span className="mono-text text-[9px] text-zinc-400 uppercase">PROD_LIVE</span>
            </div>
          </div>
        ))}

        {portfolio.length === 0 && (
          <div className="col-span-2 text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500">No portfolio projects published yet.</p>
            <button
              onClick={startAdd}
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-mono rounded"
            >
              <Plus size={12} />
              <span>ADD_FIRST_PROJECT</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
