import { Outlet, NavLink } from 'react-router';
import { Database, LogIn, Monitor, BookOpen, MessageSquare, Terminal, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { useState } from 'react';
import Logo from "../../assets/logo.png"
export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30">

      {/* Minimalist Documentation Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={Logo} alt="Logo" className="h-8 w-auto mr-2" />
            <span className="font-serif font-bold text-lg tracking-tight">YahyaOnCloud.</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
              <Monitor size={14} /> Portfolio
            </NavLink>
            <NavLink to="/blog" className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
              <BookOpen size={14} /> Blog
            </NavLink>
            <NavLink to="/guestbook" className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
              <MessageSquare size={14} /> Guestbook
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
            <NavLink to="/login" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/50 rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-all">
              <LogIn size={14} /> <span>Console</span>
            </NavLink>

            <button
              className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-sm transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
            <nav className="flex flex-col px-4 py-4 space-y-4">
              <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <Monitor size={16} /> Portfolio
              </NavLink>
              <NavLink to="/blog" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <BookOpen size={16} /> Blog
              </NavLink>
              <NavLink to="/guestbook" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <MessageSquare size={16} /> Guestbook
              </NavLink>
              <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-900">
                <NavLink to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-mono uppercase tracking-widest font-bold text-zinc-600 dark:text-zinc-400">
                  <LogIn size={16} /> Console Access
                </NavLink>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Document Content */}
      <main className="flex-1 w-full max-w-[900px] mx-auto py-8 px-4 sm:px-6">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/30 mt-auto">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            © {new Date().getFullYear()} yahyaoncloud
          </span>
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
            Minimalist Docs Edition
          </span>
        </div>
      </footer>
    </div>
  );
}
