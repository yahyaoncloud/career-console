import { type LoaderFunctionArgs } from 'react-router';
import { NavLink, Outlet, useLoaderData, useSubmit, Form } from 'react-router';
import { Menu, X, Database, LogOut, Briefcase, FileText, Table, Kanban as KanbanIcon, Building2, UserCircle, Settings, FileCode, Activity, Bell } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { useUIStore } from '../../lib/stores/ui-store';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { NotificationDropdown } from '../../components/shared/NotificationDropdown';
import { cn } from '../../lib/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== 'ADMIN') {
    throw new Response("Unauthorized", { status: 403 });
  }
  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const { sidebarOpen, mobileMenuOpen, toggleSidebar, toggleMobileMenu, setMobileMenuOpen } = useUIStore();

  const handleLogout = () => {
    submit(null, { method: "post", action: "/api/auth/logout" });
  };

  const navLinks = [
    { to: '/', label: 'Public Portfolio', icon: Database, exact: true },
    { to: '/dashboard', label: 'Dashboard Overview', icon: Activity },
    { to: '/portfolio-manager', label: 'Portfolio CMS', icon: Briefcase },
    { to: '/blog-manager', label: 'Blog CMS', icon: FileText },
    { to: '/applications', label: 'Job Tracker', icon: Table },
    { to: '/kanban', label: 'Kanban Pipeline', icon: KanbanIcon },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/authors', label: 'Authors', icon: UserCircle },
    { to: '/documents', label: 'Documents', icon: FileCode },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Sidebar (Left side, full height on desktop) */}
      {sidebarOpen && (
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col overflow-y-auto hidden md:flex shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
            <NavLink to="/dashboard" className="flex items-center space-x-2.5 cursor-pointer">
              <div className="bg-zinc-200 dark:bg-black p-1.5 rounded border border-zinc-300 dark:border-zinc-800">
                <Database className="text-zinc-700 dark:text-zinc-300" size={16} />
              </div>
              <span className="font-serif font-semibold text-lg tracking-tight">Admin Console</span>
            </NavLink>
          </div>
          
          <div className="p-4 space-y-1">
            <div className="mb-4 px-3 pt-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">Documentation & Tools</span>
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
                  {user.email || 'Admin User'}
                </span>
              </div>
              <Form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  className="flex items-center justify-center space-x-2 w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
              <NavLink to="/dashboard" className="flex items-center space-x-2.5 cursor-pointer">
                <div className="bg-zinc-200 dark:bg-black p-1.5 rounded border border-zinc-300 dark:border-zinc-800">
                  <Database className="text-zinc-700 dark:text-zinc-300" size={16} />
                </div>
                <span className="font-serif font-semibold text-lg tracking-tight">Admin Console</span>
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
                  {user.email?.split('@')[0] || 'ADMIN'}
                </span>
              </div>
              <Form method="post" action="/api/auth/logout" onSubmit={() => setMobileMenuOpen(false)}>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
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
          <div className="w-full max-w-none p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
