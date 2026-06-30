import React from 'react';
import { NavLink, Outlet, Form } from 'react-router';
import { Menu, X, LogOut } from 'lucide-react';
import { useUIStore } from '../../lib/stores/ui-store';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '../../lib/utils';
import { ROLES } from '../../constants';

export interface NavLinkItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  section?: string;  // Optional section header that appears before this item
  comingSoon?: boolean; // Optional badge on the nav item
}

interface DashboardLayoutProps {
  navLinks: NavLinkItem[];
  userEmail: string;
  userRole: string;
  brandTitle: string;
  brandIcon: React.ElementType;
  brandLink: string;
  brandIconWrapperClass?: string;
}

export function DashboardLayout({
  navLinks,
  userEmail,
  userRole,
  brandTitle,
  brandIcon: BrandIcon,
  brandLink,
  brandIconWrapperClass
}: DashboardLayoutProps) {
  const { sidebarOpen, mobileMenuOpen, toggleSidebar, toggleMobileMenu, setMobileMenuOpen } = useUIStore();

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Sidebar (Left side, full height on desktop) */}
      {sidebarOpen && (
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
            <NavLink to={brandLink} className="flex items-center space-x-2.5 cursor-pointer">
              <div className={cn("p-1.5 rounded border", brandIconWrapperClass || "bg-zinc-200 dark:bg-black border-zinc-300 dark:border-zinc-800")}>
                <BrandIcon className={brandIconWrapperClass ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300"} size={16} />
              </div>
              <span className="font-serif font-semibold text-lg tracking-tight">{brandTitle}</span>
            </NavLink>
          </div>
          
          <div className="p-4 space-y-1 flex-1 overflow-y-auto">
            <div className="mb-4 px-3 pt-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">
                {userRole === ROLES.ADMIN ? 'Documentation & Tools' : 'Workspace'}
              </span>
            </div>

            {navLinks.map((link, i) => {
              const Icon = link.icon;
              const showSection = link.section && (i === 0 || navLinks[i - 1].section !== link.section);
              return (
                <React.Fragment key={link.to}>
                  {showSection && (
                    <div className={`${i > 0 ? 'mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80' : ''} mb-1 px-3`}>
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">
                        {link.section}
                      </span>
                    </div>
                  )}
                  <NavLink
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
                        <span className="flex-1">{link.label}</span>
                        {link.comingSoon && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            Soon
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </React.Fragment>
              );
            })}
          </div>

          {/* Sidebar Footer - User Info */}
          <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Signed In As</span>
                <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                  {userEmail || (userRole === ROLES.ADMIN ? 'Admin User' : 'Author')}
                </span>
              </div>
              <Form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  className={cn(
                    "flex items-center justify-center space-x-2 w-full px-3 py-1.5 border rounded text-xs font-mono transition-colors cursor-pointer",
                    userRole === ROLES.AUTHOR
                      ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}
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
              <NavLink to={brandLink} className="flex items-center space-x-2.5 cursor-pointer">
                <div className={cn("p-1.5 rounded border", brandIconWrapperClass || "bg-zinc-200 dark:bg-black border-zinc-300 dark:border-zinc-800")}>
                  <BrandIcon className={brandIconWrapperClass ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300"} size={16} />
                </div>
                <span className="font-serif font-semibold text-lg tracking-tight">{brandTitle}</span>
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
                  {userEmail?.split('@')[0] || userRole}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Form method="post" action="/api/auth/logout" onSubmit={() => setMobileMenuOpen(false)}>
                  <button
                    type="submit"
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-1.5 border rounded text-xs font-mono transition-colors cursor-pointer",
                      userRole === ROLES.AUTHOR
                        ? "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 hover:border-red-200 text-zinc-600 dark:text-zinc-400"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </Form>
              </div>
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
          <div className="w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
