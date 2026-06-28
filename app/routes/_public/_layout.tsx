import { Outlet, NavLink } from 'react-router';
import { Database, LogIn } from 'lucide-react';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { Heading } from '../../components/ui/Heading';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      <nav className="border-b border-border bg-card px-6 py-3 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-6">
          <NavLink to="/" className="flex items-center space-x-2 cursor-pointer">
            <Database className="text-foreground" size={20} />
            <Heading as="span" variant="h3" className="tracking-tight">Portfolio</Heading>
          </NavLink>
          
          <div className="hidden md:flex space-x-4 ml-4">
            <NavLink to="/blog" className={({ isActive }) => `text-sm font-mono ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
              Blog
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => `text-sm font-mono ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
              Projects
            </NavLink>
            <NavLink to="/guestbook" className={({ isActive }) => `text-sm font-mono ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
              Guestbook
            </NavLink>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <NavLink to="/dashboard" className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs font-mono font-bold transition-colors">
            <LogIn size={14} />
            <span>LOGIN</span>
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
