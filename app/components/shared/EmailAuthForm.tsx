import React from 'react';
import { Mail, Lock, LogIn, UserPlus, User } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../lib/utils';

interface EmailAuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister?: (email: string, password: string, name: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().optional()
});

type AuthFormData = z.infer<typeof authSchema>;

export function EmailAuthForm({ onLogin, onRegister, isLoading, className }: EmailAuthFormProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  
  React.useEffect(() => {
    if (!onRegister && !isLogin) {
      setIsLogin(true);
    }
  }, [onRegister, isLogin]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: AuthFormData) => {
    clearErrors();
    if (isLogin) {
      await onLogin(data.email, data.password);
    } else if (onRegister) {
      if (!data.name || data.name.trim() === '') {
        setError('name', { type: 'manual', message: 'Name is required' });
        return;
      }
      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
        return;
      }
      await onRegister(data.email, data.password, data.name);
    }
  };

  return (
    <div className={cn("w-full max-w-sm mx-auto space-y-4", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {!isLogin && (
          <div>
            <label className="block text-xs font-mono font-semibold text-muted-foreground mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                {...register('name')}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 bg-transparent border-b text-sm focus:outline-none focus:border-primary text-card-foreground transition-colors",
                  errors.name ? "border-destructive" : "border-border"
                )}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="text-destructive text-xs mt-1 text-left">{errors.name.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono font-semibold text-muted-foreground mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="email"
              {...register('email')}
              className={cn(
                "block w-full pl-10 pr-3 py-2 bg-transparent border-b text-sm focus:outline-none focus:border-primary text-card-foreground transition-colors",
                errors.email ? "border-destructive" : "border-border"
              )}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-destructive text-xs mt-1 text-left">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-muted-foreground mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              {...register('password')}
              className={cn(
                "block w-full pl-10 pr-3 py-2 bg-transparent border-b text-sm focus:outline-none focus:border-primary text-card-foreground transition-colors",
                errors.password ? "border-destructive" : "border-border"
              )}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1 text-left">{errors.password.message}</p>}
        </div>

        {!isLogin && (
          <div>
            <label className="block text-xs font-mono font-semibold text-muted-foreground mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="password"
                {...register('confirmPassword')}
                className={cn(
                  "block w-full pl-10 pr-3 py-2 bg-transparent border-b text-sm focus:outline-none focus:border-primary text-card-foreground transition-colors",
                  errors.confirmPassword ? "border-destructive" : "border-border"
                )}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1 text-left">{errors.confirmPassword.message}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-foreground text-background px-4 py-2.5 rounded font-mono text-xs font-semibold tracking-wider transition-all duration-150 shadow-sm disabled:opacity-50 hover:bg-foreground/90 mt-6"
        >
          {isLoading ? (
            <span className="animate-pulse">{isLogin ? 'Authenticating...' : 'Registering...'}</span>
          ) : (
            <>
              {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
              <span>{isLogin ? 'Sign In' : 'Register'}</span>
            </>
          )}
        </button>
      </form>

      {onRegister && (
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-0.5"
          >
            {isLogin ? "Create an account" : "Back to login"}
          </button>
        </div>
      )}
    </div>
  );
}
