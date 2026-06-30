import { useTheme } from '../../providers/ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-sm border border-zinc-200 dark:border-zinc-800 w-fit shrink-0", className)} id="theme-toggle-container">
      <button
        id="theme-btn-light"
        onClick={() => setTheme('light')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors border",
          theme === 'light'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border-zinc-200 dark:border-zinc-700"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent"
        )}
        title="Light Mode"
      >
        <Sun size={14} />
      </button>
      <button
        id="theme-btn-dark"
        onClick={() => setTheme('dark')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors border",
          theme === 'dark'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border-zinc-200 dark:border-zinc-700"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent"
        )}
        title="Dark Mode"
      >
        <Moon size={14} />
      </button>
      <button
        id="theme-btn-system"
        onClick={() => setTheme('system')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors border",
          theme === 'system'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border-zinc-200 dark:border-zinc-700"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent"
        )}
        title="System Mode"
      >
        <Laptop size={14} />
      </button>
    </div>
  );
}

export function MobileThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("inline-flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 w-fit shrink-0", className)}>
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-full transition-all",
          theme === 'light'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-full transition-all",
          theme === 'dark'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-full transition-all",
          theme === 'system'
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        System
      </button>
    </div>
  );
}
