import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface EmailAuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
}

export default function EmailAuthForm({ onLogin, isLoading }: EmailAuthFormProps) {
  const [email] = useState('ykinwork1@gmail.com');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="email"
              value={email}
              readOnly
              className="block w-full pl-10 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm shadow-sm text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm shadow-sm placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-zinc-900 dark:text-zinc-100"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded font-mono text-xs font-semibold tracking-wider transition-all duration-150 shadow-xs disabled:opacity-50"
        >
          {isLoading ? (
            <span className="animate-pulse">Signing In...</span>
          ) : (
            <>
              <LogIn size={16} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
