import { useTheme } from '../../providers/ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center space-x-1 bg-muted/50 p-0.5 rounded-md border border-border shadow-sm w-fit", className)} id="theme-toggle-container">
      <button
        id="theme-btn-light"
        onClick={() => setTheme('light')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors",
          theme === 'light'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Light Mode"
      >
        <Sun size={14} />
      </button>
      <button
        id="theme-btn-dark"
        onClick={() => setTheme('dark')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors",
          theme === 'dark'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Dark Mode"
      >
        <Moon size={14} />
      </button>
      <button
        id="theme-btn-system"
        onClick={() => setTheme('system')}
        className={cn(
          "p-1.5 rounded-sm text-xs transition-colors",
          theme === 'system'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="System Mode"
      >
        <Laptop size={14} />
      </button>
    </div>
  );
}
