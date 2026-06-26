import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface PublicNavbarProps {
  resumeName: string;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

export default function PublicNavbar({ resumeName, onEnterConsole, isAuthenticated }: PublicNavbarProps) {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { name: 'Portfolio', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Guestbook', path: '/guestbook' },
  ];

  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
      <div className="space-y-1">
        <span className="mono-text text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Cloud Engineer
        </span>
        <h1 className="serif-header text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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
                className={`mono-text text-xs tracking-wider transition-colors border-b-2 pb-1 ${
                  isActive 
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
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
          className="mono-text text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-3.5 py-2 rounded border border-zinc-850 dark:border-zinc-200 hover:opacity-85 transition-opacity cursor-pointer font-semibold w-full sm:w-auto text-center tracking-wider"
        >
          {isAuthenticated ? 'Dashboard →' : 'Sign In →'}
        </button>
      </div>
    </header>
  );
}
