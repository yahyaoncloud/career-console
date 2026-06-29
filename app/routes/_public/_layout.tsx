import { Outlet, NavLink, Link } from 'react-router';
import { Database, LogIn, Monitor, BookOpen, MessageSquare, Terminal, Menu, X, PenTool } from 'lucide-react';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { useState } from 'react';
import { ROUTES } from '../../constants';
import Logo from "../../assets/logo.png"

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30">

      {/* Minimalist Documentation Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <NavLink to={ROUTES.PUBLIC.HOME} className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={Logo} alt="Logo" className="h-8 w-auto" />
              <span className="font-serif font-bold text-lg tracking-tight">YahyaOnCloud.</span>
            </NavLink>

            <nav className="hidden sm:flex items-center space-x-6">
              <NavLink to={ROUTES.PUBLIC.HOME} end className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
                <Database size={14} /> Portfolio
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.BLOG} className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
                <PenTool size={14} /> Writings
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.GUESTBOOK} className={({ isActive }) => `flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold'}`}>
                <MessageSquare size={14} /> Guestbook
              </NavLink>
            </nav>

            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeToggle />
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></div>
              <NavLink to={ROUTES.AUTH.LOGIN} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/50 rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-all">
                <LogIn size={14} /> Login
              </NavLink>

              <button
                className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-sm transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
            <nav className="flex flex-col px-4 py-4 space-y-4">
              <NavLink to={ROUTES.PUBLIC.HOME} end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <Database size={16} /> Portfolio
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.BLOG} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <PenTool size={16} /> Writings
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.GUESTBOOK} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                <MessageSquare size={16} /> Guestbook
              </NavLink>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full my-2"></div>
              <NavLink to={ROUTES.AUTH.LOGIN} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-mono uppercase tracking-widest font-bold text-zinc-600 dark:text-zinc-400">
                <LogIn size={16} /> Login
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      {/* Main Document Content */}
      <main className="flex-1 w-full max-w-[900px] mx-auto py-8 px-4 sm:px-6">
        <Outlet />
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 mt-auto">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            yahyaoncloud
          </span>
          
          <div className="flex gap-6">
            <a href="https://github.com/yahyaoncloud" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com/in/yahyaoncloud" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
