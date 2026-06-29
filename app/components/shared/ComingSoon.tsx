import { Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export function ComingSoon({ title, description, icon: Icon = Sparkles }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <Icon size={48} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
        Work in Progress
      </div>
      
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
        {title}
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
        {description || "We are currently building this feature. Check back soon for updates!"}
      </p>

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Go Back
      </button>
    </div>
  );
}
