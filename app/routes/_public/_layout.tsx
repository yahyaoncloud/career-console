import { Outlet, NavLink, useLocation } from 'react-router';
import { Database, LogIn, MessageSquare, Menu, X, PenTool } from 'lucide-react';
import { ThemeToggle, MobileThemeToggle } from '../../components/shared/ThemeToggle';
import { useState } from 'react';
import { ROUTES } from '../../constants';
import Logo from "../../assets/logo.png"

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="public-shell min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900/10 dark:selection:bg-zinc-100/20">

      <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <NavLink to={ROUTES.PUBLIC.HOME} className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="flex h-8 w-8 items-center justify-center">
                <img src={Logo} alt="Logo" />
              </span>
              <span className="font-sans font-semibold text-sm tracking-tight">YahyaOnCloud</span>
            </NavLink>

            <nav className="hidden sm:flex items-center space-x-5">
              <NavLink to={ROUTES.PUBLIC.HOME} end className={({ isActive }) => `link-underline flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
                <Database size={14} /> Portfolio
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.BLOG} className={({ isActive }) => `link-underline flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
                <PenTool size={14} /> Writings
              </NavLink>
              <NavLink to={ROUTES.PUBLIC.GUESTBOOK} className={({ isActive }) => `link-underline flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
                <MessageSquare size={14} /> Guestbook
              </NavLink>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle className="hidden sm:flex" />
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
              <NavLink to={ROUTES.AUTH.LOGIN} className="link-underline hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-sm text-[11px] font-mono uppercase tracking-widest transition-colors">
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

        {isMobileMenuOpen && (
          <>
            <button
              className="fixed top-14 inset-0 bg-zinc-950/30 z-40 md:hidden"
              aria-label="Close navigation"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed top-14 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <nav className="flex flex-col px-4 py-4 space-y-4">
                <NavLink to={ROUTES.PUBLIC.HOME} end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      <Database size={16} /> Portfolio
                    </NavLink>
                <NavLink to={ROUTES.PUBLIC.BLOG} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      <PenTool size={16} /> Writings
                    </NavLink>
                <NavLink to={ROUTES.PUBLIC.GUESTBOOK} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 text-sm font-mono uppercase tracking-widest transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      <MessageSquare size={16} /> Guestbook
                    </NavLink>
                <div className="flex justify-start">
                  <MobileThemeToggle />
                </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full my-2"></div>
                <NavLink to={ROUTES.AUTH.LOGIN} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-colors">
                      <LogIn size={16} /> Login
                    </NavLink>
                </nav>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 w-full max-w-[860px] mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div
          key={location.pathname}
          className="animate-public-page"
        >
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            yahyaoncloud
          </span>

          <div className="flex gap-6">
            <a href="https://github.com/yahyaoncloud" target="_blank" rel="noreferrer" className="link-underline text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com/in/yahyaoncloud" target="_blank" rel="noreferrer" className="link-underline text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
