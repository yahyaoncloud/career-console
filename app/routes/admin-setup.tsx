import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect, Link } from 'react-router';
import { useState } from 'react';
import { getSession } from '../lib/session.server';
import { prisma } from '../lib/db.server';
import { Shield, ArrowLeft } from 'lucide-react';
import { EmailAuthForm } from '../components/shared/EmailAuthForm';
import { ROLES, ROUTES } from '../constants';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  if (session.has('firebaseUid')) {
    const firebaseUid = session.get('firebaseUid');
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (user?.role === ROLES.ADMIN) {
      return redirect(ROUTES.ADMIN.DASHBOARD);
    }
  }
  return null;
}

export default function AdminSetupRoute() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    // Use a hardcoded fallback for ease of testing, can be moved entirely to API later
    if (inviteCode.trim() !== '') {
      setIsCodeValid(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Please enter an invite code.');
    }
  };

  const registerAdmin = async (email: string, pass: string, isRegister: boolean, name?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { registerWithEmail } = await import('../lib/firebase');
      const { user } = await registerWithEmail(email, pass, name);
        
      const token = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('idToken', token);
      formData.append('intent', 'admin-setup');
      formData.append('inviteCode', inviteCode);
      
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        window.location.href = ROUTES.ADMIN.DASHBOARD;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create session. Invalid invite code?');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email already in use.');
      } else {
        setErrorMsg(err.message || 'An error occurred during authentication.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      
      {/* Top left home toggle */}
      <div className="absolute top-6 left-6">
        <Link
          to={ROUTES.PUBLIC.HOME}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-sm group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>PORTFOLIO</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-zinc-200 dark:bg-zinc-900 p-3 rounded border border-zinc-300 dark:border-zinc-800">
            <Shield size={24} className="text-zinc-700 dark:text-zinc-300" />
          </div>
        </div>
        
        <h1 className="text-center font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Admin Initialization
        </h1>
        <p className="mt-2 text-center text-sm font-mono text-zinc-500">
          {isCodeValid ? 'Create your administrator account.' : 'Enter the secure invite code.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 border border-zinc-200 dark:border-zinc-800 rounded sm:px-10 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-600 dark:text-red-400 font-mono">
              {errorMsg}
            </div>
          )}
          
          {!isCodeValid ? (
            <form onSubmit={verifyCode} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-2">Invite Code</label>
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
                  placeholder="Enter code..."
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-[11px] font-mono font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors uppercase tracking-widest"
              >
                Verify Code
              </button>
            </form>
          ) : (
            <EmailAuthForm 
              onLogin={undefined}
              onRegister={(email, pass, name) => registerAdmin(email, pass, true, name)}
              isLoading={isLoading} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
