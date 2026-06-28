import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Heading } from '../ui/Heading';
import ThemeToggle from '../ThemeToggle';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

interface AuthorLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function AuthorLogin({ onLogin }: AuthorLoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!auth) {
      setError('Authentication is not configured.');
      return;
    }

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(formattedErrors);
      return;
    }
    
    setLoading(true);

    try {
      await onLogin(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className="max-w-md w-full space-y-6 text-center shadow-lg relative !p-8 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono transition-colors"
          >
            <span>← HOME</span>
          </button>
          <ThemeToggle />
        </div>

        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-center mx-auto text-zinc-700 dark:text-zinc-300 pb-2">
            <LogIn size={32} />
          </div>
          <Heading variant="h2" className="text-xl">Author Login</Heading>
          <p className="text-zinc-500 text-sm mt-1">Access your author dashboard to manage content.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-3 text-left">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border ${validationErrors.email ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-sans transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
                required
              />
              {validationErrors.email && <p className="text-rose-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border ${validationErrors.password ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-sans transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
                required
              />
              {validationErrors.password && <p className="text-rose-500 text-xs mt-1">{validationErrors.password}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-xs text-zinc-500 font-mono">
          New author? <button onClick={() => navigate('/signup')} className="text-zinc-900 dark:text-zinc-200 hover:underline">Apply as Author</button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 rounded text-left space-y-1 font-sans text-xs">
            <p className="text-rose-700 dark:text-rose-300 text-xs leading-normal font-mono">
              {error}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
