import { type LoaderFunctionArgs } from 'react-router';
import { NavLink, Outlet, useLoaderData, useSubmit, Form } from 'react-router';
import { Menu, X, Database, LogOut, Briefcase, FileText, Table, Kanban as KanbanIcon, Building2, UserCircle, Settings, FileCode, Activity } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { useUIStore } from '../../lib/stores/ui-store';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { Heading } from '../../components/ui/Heading';
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
    { to: '/jobs', label: 'Job Sourcing', icon: Briefcase },
    { to: '/kanban', label: 'Kanban Pipeline', icon: KanbanIcon },
    { to: '/resume', label: 'LaTeX Resume', icon: FileText },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/authors', label: 'Authors', icon: UserCircle },
    { to: '/documents', label: 'Documents', icon: FileCode },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      {/* Global Header Navbar */}
      <nav className="border-b border-border bg-card px-6 py-3 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <NavLink to="/" className="flex items-center space-x-2 cursor-pointer">
            <Database className="text-foreground" size={20} />
            <Heading as="span" variant="h3" className="tracking-tight">Admin Console</Heading>
            <span className="mono-text text-[9px] bg-rose-500/20 text-rose-500 border border-rose-500/30 px-1.5 py-0.5 rounded font-semibold uppercase">
              ADMIN
            </span>
          </NavLink>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border px-6 py-4 space-y-3 z-10 sticky top-[53px] shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] mono-text text-muted-foreground">TELEMETRY_SESSION: ACTIVE</span>
              <span className="text-xs font-bold mono-text text-card-foreground">
                {user.email?.split('@')[0] || 'ADMIN'}
              </span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center space-x-1 px-2 py-1 border border-destructive/30 rounded text-[10px] mono-text text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut size={12} />
              <span>DISCONNECT</span>
            </button>
          </div>

          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors uppercase border",
                  isActive 
                    ? "bg-muted text-foreground font-bold border-border" 
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-card border-r border-border flex-col overflow-y-auto hidden md:flex">
            <div className="p-4 space-y-1">
              <div className="mb-4 px-3">
                <span className="text-[9px] mono-text text-muted-foreground uppercase tracking-wider">Navigation</span>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    className={({ isActive }) => cn(
                      "flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer w-full border",
                      isActive
                        ? "bg-muted text-foreground font-bold border-border/60 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                    )}
                  >
                    <Icon size={14} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Sidebar Footer - User Info */}
            <div className="mt-auto p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] mono-text text-muted-foreground">TELEMETRY_SESSION: ACTIVE</span>
                  <span className="text-xs font-bold mono-text text-card-foreground">
                    {user.email?.split('@')[0] || 'ADMIN'}
                  </span>
                </div>
                <Form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="flex items-center space-x-1 px-2 py-1 border border-destructive/30 rounded text-[10px] mono-text text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                  >
                    <LogOut size={12} />
                    <span>DISCONNECT</span>
                  </button>
                </Form>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
