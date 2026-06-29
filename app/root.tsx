import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/index.css";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { GlobalToast } from "./components/shared/GlobalToast";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "yahyaoncloud" },
    { name: "description", content: "Modern job application tracker and portfolio" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'system') {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GlobalToast />
        <Outlet />
      </ToastProvider>
    </ThemeProvider>
  );
}

import { TriangleAlert, ArrowLeft } from 'lucide-react';

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred while loading this page.";
  let stack: string | undefined;

  if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
        <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <TriangleAlert size={48} className="text-red-600 dark:text-red-400" />
        </div>
      </div>
      
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-4">
        Application Error
      </div>
      
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
        {message}
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
        {details}
      </p>

      {stack && (
        <div className="w-full max-w-2xl bg-zinc-900 text-zinc-300 p-4 rounded-md text-left overflow-x-auto mb-8 shadow-sm">
          <pre className="text-xs font-mono">
            <code>{stack}</code>
          </pre>
        </div>
      )}

      <button
        onClick={() => window.location.href = '/'}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to Home
      </button>
    </main>
  );
}
