import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Settings, Shield, Key, Bell, User as UserIcon } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return { user, profile };
}

export default function AdminSettingsRoute() {
  const { user, profile } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Settings size={24} className="text-zinc-400" />
          System Settings
        </h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">Configure platform preferences and security</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Sidebar Nav (Simulated settings tabs) */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-sans text-sm font-medium rounded-sm border border-zinc-200 dark:border-zinc-700 transition-colors">
            <UserIcon size={16} /> General Account
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-sans text-sm rounded-sm transition-colors cursor-not-allowed opacity-50">
            <Shield size={16} /> Security & 2FA
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-sans text-sm rounded-sm transition-colors cursor-not-allowed opacity-50">
            <Key size={16} /> API Keys
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-sans text-sm rounded-sm transition-colors cursor-not-allowed opacity-50">
            <Bell size={16} /> Notifications
          </button>
        </div>

        {/* Main Settings Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-3">Identity Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="flex">
                  <input
                    disabled
                    value={user.email}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-sm text-sm font-mono text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 font-sans">Primary email associated with this administration account.</p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider mb-1.5">System Role</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-[11px] font-bold uppercase tracking-widest rounded-sm">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-sm p-6">
            <h3 className="text-lg font-serif font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm font-sans text-red-600/80 dark:text-red-400/80 mb-4 leading-relaxed">
              Permanently delete this account and all of its associated data. This action cannot be undone.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed">
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
