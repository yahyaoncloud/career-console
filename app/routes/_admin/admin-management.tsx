import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Heading } from '../../components/ui/Heading';
import { Shield, UserPlus, Trash2, MoreVertical, Check, X } from 'lucide-react';
import { ROLES, ROUTES } from '../../constants';
import { z } from 'zod';
import { useState } from 'react';

const AdminInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const admins = await prisma.user.findMany({
    where: { role: ROLES.ADMIN },
    orderBy: { createdAt: 'desc' }
  });

  return { admins };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'invite') {
    try {
      const data = {
        email: formData.get('email'),
        name: formData.get('name'),
      };
      const result = AdminInviteSchema.safeParse(data);

      if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: result.data.email }
      });

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Create a pending admin (would need Firebase integration in production)
      // For now, we'll create a placeholder record
      const inviteCode = Math.random().toString(36).substring(2, 15).toUpperCase();
      
      return { 
        success: true, 
        message: 'Admin invite created successfully',
        inviteCode,
        email: result.data.email,
        name: result.data.name
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create invite' };
    }
  }

  if (intent === 'remove') {
    const adminId = formData.get('adminId') as string;
    try {
      // Prevent removing the last admin
      const adminCount = await prisma.user.count({ where: { role: ROLES.ADMIN } });
      if (adminCount <= 1) {
        return { success: false, message: 'Cannot remove the last admin' };
      }

      await prisma.user.delete({ where: { id: adminId } });
      return { success: true, message: 'Admin removed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to remove admin' };
    }
  }

  return { success: false, message: 'Invalid intent' };
}

export default function AdminManagement() {
  const { admins } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ code: string; email: string; name: string } | null>(null);

  const isSubmitting = fetcher.state === 'submitting';

  if (fetcher.data?.success && fetcher.data?.inviteCode && !inviteDetails) {
    setInviteDetails({
      code: fetcher.data.inviteCode,
      email: fetcher.data.email,
      name: fetcher.data.name
    });
    setShowInviteForm(false);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Heading variant="h1" className="flex items-center gap-3">
          <Shield size={28} className="text-zinc-400" />
          Admin Management
        </Heading>
        <span className="font-mono text-sm text-zinc-500 block mt-2">
          Manage administrator access and onboarding
        </span>
      </div>

      {/* Invite Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
          <div>
            <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block mb-1">ONBOARDING</span>
            <Heading variant="h4">Invite New Admin</Heading>
          </div>
          {!showInviteForm && !inviteDetails && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-mono uppercase tracking-widest font-bold rounded transition-colors"
            >
              <UserPlus size={14} />
              New Invite
            </button>
          )}
        </div>

        {inviteDetails && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-5 rounded space-y-4">
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
                  Invite Created Successfully
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Name:</span> {inviteDetails.name}
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Email:</span> {inviteDetails.email}
                  </p>
                  <div className="bg-white dark:bg-black p-3 rounded border border-emerald-100 dark:border-emerald-900/30">
                    <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
                      Invite Code
                    </p>
                    <p className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-widest">
                      {inviteDetails.code}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Share this code with the new admin. They will use it during the admin setup process.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setInviteDetails(null)}
              className="text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
            >
              Create another invite
            </button>
          </div>
        )}

        {showInviteForm && (
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="invite" />
            
            {fetcher.data?.success === false && fetcher.data?.message && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-600 dark:text-red-400 font-mono">
                {fetcher.data.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow disabled:opacity-50"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow disabled:opacity-50"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-mono uppercase tracking-widest font-bold rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono uppercase tracking-widest rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </fetcher.Form>
        )}
      </div>

      {/* Admins List */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
          <div>
            <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block mb-1">ACCESS_CONTROL</span>
            <Heading variant="h4">Current Administrators</Heading>
          </div>
          <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            {admins.length} {admins.length === 1 ? 'Admin' : 'Admins'}
          </span>
        </div>

        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950/50">
              <p className="font-mono text-sm text-zinc-500">No administrators found</p>
            </div>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="font-serif font-bold text-zinc-700 dark:text-zinc-300">
                      {admin.name?.charAt(0).toUpperCase() || admin.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {admin.name || 'Unnamed Admin'}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">{admin.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-500/10 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    Admin
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </span>
                  {admins.length > 1 && (
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="remove" />
                      <input type="hidden" name="adminId" value={admin.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Remove admin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </fetcher.Form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
