import { type LoaderFunctionArgs } from 'react-router';
import { NavLink, Outlet, useLoaderData, useSubmit, Form } from 'react-router';
import { Menu, X, Database, LogOut, FileText, UserCircle, Activity, PenTool } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { useUIStore } from '../../lib/stores/ui-store';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { NotificationDropdown } from '../../components/shared/NotificationDropdown';
import { cn } from '../../lib/utils';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== 'AUTHOR' && user.role !== 'ADMIN') {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  if (params.id && params.id !== user.id && user.role !== 'ADMIN') {
    throw new Response("Forbidden", { status: 403 });
  }

  return { user, urlId: params.id || user.id };
}

export default function AuthorLayout() {
  const { user, urlId } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const { sidebarOpen, mobileMenuOpen, toggleSidebar, toggleMobileMenu, setMobileMenuOpen } = useUIStore();

  const navLinks = [
    { to: `/author/${urlId}/dashboard`, label: 'Dashboard', icon: Activity, exact: true },
    { to: `/author/${urlId}/blogs`, label: 'My Blogs', icon: FileText },
    { to: `/author/${urlId}/profile`, label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Sidebar (Left side, full height on desktop) */}
      {sidebarOpen && (
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col overflow-y-auto hidden md:flex shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
            <NavLink to={`/author/${urlId}/dashboard`} className="flex items-center space-x-2.5 cursor-pointer">
              <div className="bg-indigo-100 dark:bg-indigo-500/10 p-1.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                <PenTool className="text-indigo-600 dark:text-indigo-400" size={16} />
              </div>
              <span className="font-serif font-semibold text-lg tracking-tight">Author Studio</span>
            </NavLink>
          </div>
          
          <div className="p-4 space-y-1">
            <div className="mb-4 px-3 pt-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">Workspace</span>
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 text-[13px] font-sans rounded transition-all cursor-pointer w-full",
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? "text-indigo-600 dark:text-indigo-400" : ""} />
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer - User Info */}
          <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Signed In As</span>
                <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                  {user.email || 'Author'}
                </span>
              </div>
              <Form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  className="flex items-center justify-center space-x-2 w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </Form>
            </div>
          </div>
        </aside>
      )}

      {/* Main Right Area (Navbar + Content) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-3 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            
            {/* Mobile Logo (visible only when sidebar is hidden on small screens) */}
            <div className="md:hidden flex items-center">
              <NavLink to={`/author/${urlId}/dashboard`} className="flex items-center space-x-2.5 cursor-pointer">
                <div className="bg-indigo-100 dark:bg-indigo-500/10 p-1.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  <PenTool className="text-indigo-600 dark:text-indigo-400" size={16} />
                </div>
                <span className="font-serif font-semibold text-lg tracking-tight">Author Studio</span>
              </NavLink>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <NotificationDropdown />
            <ThemeToggle />

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 space-y-4 z-10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Session</span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {user.email?.split('@')[0] || 'AUTHOR'}
                </span>
              </div>
              <Form method="post" action="/api/auth/logout" onSubmit={() => setMobileMenuOpen(false)}>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 hover:border-red-200 cursor-pointer transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </Form>
            </div>

            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-sans rounded transition-colors",
                      isActive 
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium" 
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content (scrollable) */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
