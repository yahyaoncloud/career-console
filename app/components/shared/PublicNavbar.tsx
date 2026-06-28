import { Link, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/utils';

interface PublicNavbarProps {
  resumeName: string;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
  className?: string;
}

export function PublicNavbar({ resumeName, onEnterConsole, isAuthenticated, className }: PublicNavbarProps) {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { name: 'Portfolio', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Guestbook', path: '/guestbook' },
  ];

  return (
    <header className={cn("flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center border-b border-border pb-4 gap-4", className)}>
      <div className="space-y-1">
        <span className="mono-text text-[10px] uppercase tracking-widest text-muted-foreground">
          Cloud Engineer
        </span>
        <h1 className="serif-header text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {resumeName}
        </h1>
        
        {/* Navigation Links */}
        <nav className="flex space-x-6 pt-2">
          {links.map((link) => {
            const isActive = path === link.path || (link.path !== '/' && path.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "mono-text text-xs tracking-wider transition-colors border-b-2 pb-1",
                  isActive 
                    ? "border-foreground text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
        <ThemeToggle />
        <button
          onClick={onEnterConsole}
          className="mono-text text-xs bg-primary text-primary-foreground px-3.5 py-2 rounded border border-primary hover:bg-primary/90 transition-colors cursor-pointer font-semibold w-full sm:w-auto text-center tracking-wider shadow-sm"
        >
          {isAuthenticated ? 'Dashboard →' : 'Sign In →'}
        </button>
      </div>
    </header>
  );
}
