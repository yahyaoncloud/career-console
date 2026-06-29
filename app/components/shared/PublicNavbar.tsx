import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/utils';

interface PublicNavbarProps {
  resumeName: string;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
  className?: string;
}

export function PublicNavbar({
  resumeName,
  onEnterConsole,
  isAuthenticated,
  className,
}: PublicNavbarProps) {
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  const links = [
    { name: 'Portfolio', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Guestbook', path: '/guestbook' },
  ];

  // Measure header bottom for perfect overlay alignment
  useEffect(() => {
    if (mobileMenuOpen && headerRef.current) {
      setHeaderBottom(headerRef.current.getBoundingClientRect().bottom);
    }
  }, [mobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={cn(
        'relative flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center border-b border-border pb-4 gap-4',
        className
      )}
    >
      {/* Title + hamburger (mobile) */}
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="space-y-1">
          <span className="mono-text text-[10px] uppercase tracking-widest text-muted-foreground">
            Cloud Engineer
          </span>
          <h1 className="serif-header text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {resumeName}
          </h1>
        </div>

        {/* Hamburger – visible only on mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center gap-1.5 p-2 -mr-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle navigation menu"
        >
          <span
            className={cn(
              'block w-5 h-0.5 bg-foreground transition-transform duration-300',
              mobileMenuOpen && 'translate-y-[3px] rotate-45'
            )}
          />
          <span
            className={cn(
              'block w-5 h-0.5 bg-foreground transition-opacity duration-300',
              mobileMenuOpen && 'opacity-0'
            )}
          />
          <span
            className={cn(
              'block w-5 h-0.5 bg-foreground transition-transform duration-300',
              mobileMenuOpen && '-translate-y-[3px] -rotate-45'
            )}
          />
        </button>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden sm:flex space-x-6 pt-2">
        {links.map((link) => {
          const isActive =
            path === link.path || (link.path !== '/' && path.startsWith(link.path));
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'group relative mono-text text-xs tracking-wider transition-colors pb-1',
                isActive
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current',
                  isActive
                    ? ''
                    : 'after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out'
                )}
              >
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Right side controls – hidden on mobile, shown on desktop */}
      <div className="hidden sm:flex items-center space-x-3">
        <ThemeToggle />
        <button
          onClick={onEnterConsole}
          className="mono-text text-xs bg-primary text-primary-foreground px-3.5 py-2 rounded border border-primary hover:bg-primary/90 transition-colors cursor-pointer font-semibold text-center tracking-wider shadow-sm"
        >
          Publish?
        </button>
      </div>

      {/* Mobile overlay – portal with links + controls */}
      {mobileMenuOpen &&
        createPortal(
          <div
            className="fixed inset-x-0 z-50 sm:hidden"
            style={{ top: headerBottom }}
          >
            <nav className="flex flex-col bg-background border border-border rounded-b-lg shadow-lg p-4 mx-4 space-y-4">
              {/* Navigation links */}
              <div className="space-y-2">
                {links.map((link) => {
                  const isActive =
                    path === link.path || (link.path !== '/' && path.startsWith(link.path));
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'group relative mono-text text-sm tracking-wider transition-colors py-1 px-2 rounded-md block',
                        isActive
                          ? 'text-foreground font-bold bg-muted/50'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Theme toggle and Publish button */}
              <div className="flex items-center justify-between px-2">
                <ThemeToggle />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onEnterConsole();
                  }}
                  className="mono-text text-xs bg-primary text-primary-foreground px-3.5 py-2 rounded border border-primary hover:bg-primary/90 transition-colors cursor-pointer font-semibold tracking-wider shadow-sm"
                >
                  Publish?
                </button>
              </div>
            </nav>
          </div>,
          document.body
        )}
    </header>
  );
}