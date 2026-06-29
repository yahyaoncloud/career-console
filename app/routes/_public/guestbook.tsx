import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { prisma } from '../../lib/db.server';
import { checkRateLimit } from '../../lib/rate-limit.server';
import { sanitizeString } from '../../lib/sanitize';
import { MessageSquare, Send } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';

const GuestbookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

type GuestbookFormData = z.infer<typeof GuestbookSchema>;

import { loader as guestbookApiLoader } from '../api.guestbook';

export async function loader(args: LoaderFunctionArgs) {
  try {
    const res = await guestbookApiLoader(args);
    const result = await res.json();
    return { entries: result.success ? result.data : [] };
  } catch (error) {
    return { entries: [] };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const origin = new URL(request.url).origin.replace('localhost', '127.0.0.1');
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  try {
    // Pass along the forwarded-for header for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    const res = await fetch(`${origin}/api/guestbook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    if (!result.success && result.errors) {
       return { success: false, errors: result.errors };
    }
    
    return result; // return the API response directly
  } catch (error: any) {
    return { success: false, message: 'Failed to connect to API' };
  }
}

export default function GuestbookRoute() {
  const { entries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === 'submitting';
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GuestbookFormData>({
    resolver: zodResolver(GuestbookSchema)
  });

  useEffect(() => {
    if (fetcher.data?.success) {
      reset();
    }
  }, [fetcher.data, reset]);

  const onSubmit = (data: GuestbookFormData) => {
    fetcher.submit(data, { method: 'post' });
  };

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-sans font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <MessageSquare size={20} className="text-zinc-400 dark:text-zinc-500" />
            Sign the Guestbook
          </h1>
          <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
            Leave a trace. Share your thoughts, say hello, or let me know what brought you here.
          </p>
        </div>

        <div className="max-w-2xl pt-4 space-y-16">
          <div className="relative">
            <fetcher.Form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-widest font-bold">Your Name</label>
                <input
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 pb-2 font-sans text-sm focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 disabled:opacity-50"
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-2 font-mono">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-widest font-bold">Message</label>
                <textarea
                  {...register('message')}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 pb-2 font-sans text-sm focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 resize-none disabled:opacity-50"
                  placeholder="Leave a message..."
                />
                {errors.message && <p className="text-[10px] text-red-500 mt-2 font-mono">{errors.message.message}</p>}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-mono uppercase tracking-widest font-bold rounded-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
                </button>
              </div>
              {fetcher.data?.success === false && fetcher.data?.message && (
                <p className="text-[10px] font-mono text-red-500 mt-2 text-right">{fetcher.data.message}</p>
              )}
            </fetcher.Form>
          </div>

          <div className="space-y-10">
            <h3 className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest font-bold mb-8">
              Signatures ({entries.length})
            </h3>
            
            {entries.length === 0 ? (
              <p className="text-zinc-500 font-mono text-[11px] italic">No signatures yet. Be the first.</p>
            ) : (
              <div className="space-y-10">
                {entries.map((entry) => (
                  <div key={entry.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm font-sans text-zinc-900 dark:text-zinc-100">{entry.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
