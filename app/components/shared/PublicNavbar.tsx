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
        <nav className="flex space-x-6 pt-2 overflow-x-auto whitespace-nowrap scrollbar-hide w-full max-w-full">
          {links.map((link) => {
            const isActive = path === link.path || (link.path !== '/' && path.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "group relative mono-text text-xs tracking-wider transition-colors pb-1",
                  isActive 
                    ? "text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current",
                  isActive 
                    ? "" 
                    : "after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out"
                )}>
                  {link.name}
                </span>
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
          Publish?
        </button>
      </div>
    </header>
  );
}
