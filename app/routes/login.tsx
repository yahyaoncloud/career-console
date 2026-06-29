import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect, Link } from 'react-router';
import { useState } from 'react';
import { getSession } from '../lib/session.server';
import { prisma } from '../lib/db.server';
import { Terminal, ShieldAlert, PenTool, Shield, ArrowLeft } from 'lucide-react';
import { EmailAuthForm } from '../components/shared/EmailAuthForm';
import { cn } from '../lib/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  if (session.has('firebaseUid')) {
    const firebaseUid = session.get('firebaseUid');
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (user?.role === 'ADMIN') {
      return redirect('/dashboard');
    } else if (user) {
      return redirect(`/author/${user.id}/dashboard`);
    }
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  return null;
}

export default function LoginRoute() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const authenticate = async (email: string, pass: string, isRegister: boolean, name?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { loginWithEmail, registerWithEmail } = await import('../lib/firebase');
      const { user } = isRegister 
        ? await registerWithEmail(email, pass, name)
        : await loginWithEmail(email, pass);
        
      const token = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('idToken', token);
      
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.role === 'ADMIN' ? '/dashboard' : `/author/${data.userId}/dashboard`;
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
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
          to="/"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-sm group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>PORTFOLIO</span>
        </Link>
      </div>

      {/* Top right admin toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setIsAdminMode(!isAdminMode)}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border rounded-sm"
        >
          {isAdminMode ? <PenTool size={12} /> : <Terminal size={12} />}
          <span>{isAdminMode ? 'AUTHOR_MODE' : 'ADMIN_MODE'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-zinc-200 dark:bg-zinc-900 p-3 rounded border border-zinc-300 dark:border-zinc-800">
            {isAdminMode ? (
              <Terminal size={24} className="text-zinc-700 dark:text-zinc-300" />
            ) : (
              <PenTool size={24} className="text-zinc-700 dark:text-zinc-300" />
            )}
          </div>
        </div>
        
        <h1 className="text-center font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {isAdminMode ? 'Yahya Space' : 'Author Studio'}
        </h1>
        <p className="mt-2 text-center text-sm font-mono text-zinc-500">
          {isAdminMode ? 'Welcome back.' : 'Publish your insights.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 border border-zinc-200 dark:border-zinc-800 rounded sm:px-10 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-600 dark:text-red-400 font-mono">
              {errorMsg}
            </div>
          )}
          
          <EmailAuthForm 
            onLogin={(email, pass) => authenticate(email, pass, false)}
            onRegister={isAdminMode ? undefined : (email, pass, name) => authenticate(email, pass, true, name)}
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}
