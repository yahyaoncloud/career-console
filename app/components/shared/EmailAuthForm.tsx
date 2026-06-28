import React from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../lib/utils';

interface EmailAuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export function EmailAuthForm({ onLogin, isLoading, className }: EmailAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'ykinwork1@gmail.com', // Default to admin for convenience
      password: ''
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormData) => {
    await onLogin(data.email, data.password);
  };

  return (
    <div className={cn("w-full max-w-sm mx-auto space-y-4", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                "block w-full pl-10 pr-3 py-2 bg-card border rounded-md text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-card-foreground transition-colors",
                errors.email ? "border-destructive focus:border-destructive focus:ring-destructive" : "border-border"
              )}
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
                "block w-full pl-10 pr-3 py-2 bg-card border rounded-md text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-card-foreground transition-colors",
                errors.password ? "border-destructive focus:border-destructive focus:ring-destructive" : "border-border"
              )}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1 text-left">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-4 py-2.5 rounded font-mono text-xs font-semibold tracking-wider transition-all duration-150 shadow-sm disabled:opacity-50 hover:bg-primary/90"
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
