import { useTheme } from '../providers/ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded border border-zinc-200 dark:border-zinc-800" id="theme-toggle-container">
      <button
        id="theme-btn-light"
        onClick={() => setTheme('light')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Light Mode"
      >
        <Sun size={13} />
      </button>
      <button
        id="theme-btn-dark"
        onClick={() => setTheme('dark')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Dark Mode"
      >
        <Moon size={13} />
      </button>
      <button
        id="theme-btn-system"
        onClick={() => setTheme('system')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="System Mode"
      >
        <Laptop size={13} />
      </button>
    </div>
  );
}
