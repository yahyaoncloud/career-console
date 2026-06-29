import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { prisma } from '../../lib/db.server';
import { checkRateLimit } from '../../lib/rate-limit.server';
import { sanitizeString } from '../../lib/sanitize';
import { MessageSquare, Send } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';

const GuestbookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

type GuestbookFormData = z.infer<typeof GuestbookSchema>;

import { jsonResponse, errorResponse } from '../../lib/api.server';

export async function loader(args: LoaderFunctionArgs) {
  try {
    const entries = await prisma.guestbook.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return { entries };
  } catch (error) {
    return { entries: [] };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = await checkRateLimit(ip, 5);
  
  if (!allowed) {
    return errorResponse(new Error('Rate limit exceeded'), { status: 429, message: 'Too many requests. Please try again later.' });
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const result = GuestbookSchema.safeParse(data);

    if (!result.success) {
      return errorResponse(result.error, { status: 400 });
    }

    const entry = await prisma.guestbook.create({
      data: {
        name: sanitizeString(result.data.name),
        message: sanitizeString(result.data.message)
      }
    });

    return jsonResponse(entry, { message: 'Guestbook signed successfully' });
  } catch (error: any) {
    return errorResponse(error, { status: 500, message: 'Failed to add guestbook entry' });
  }
}

export default function GuestbookRoute() {
  const { entries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === 'submitting';
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<GuestbookFormData>({
    resolver: zodResolver(GuestbookSchema)
  });

  const onSubmit = (data: GuestbookFormData) => {
    fetcher.submit(data, { method: 'post' });
  };

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-sans font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <MessageSquare size={20} className="text-zinc-400 dark:text-zinc-500" />
            Guestbook
          </h1>
          <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
            Leave a trace. Share your thoughts, say hello, or let me know what brought you here.
          </p>
        </div>

        <div className="max-w-2xl pt-2 space-y-12">
          {/* Form Section */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-6">
            <fetcher.Form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400">Your Name</label>
                <input
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow disabled:opacity-50"
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-1 font-mono">{errors.name.message}</p>}
                {fetcher.data?.success === false && fetcher.data?.details?.name && (
                  <p className="text-[10px] text-red-500 mt-1 font-mono">{fetcher.data.details.name[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400">Message</label>
                <textarea
                  {...register('message')}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow resize-none disabled:opacity-50"
                  placeholder="Leave a message..."
                />
                {errors.message && <p className="text-[10px] text-red-500 mt-1 font-mono">{errors.message.message}</p>}
                {fetcher.data?.success === false && fetcher.data?.details?.message && (
                  <p className="text-[10px] text-red-500 mt-1 font-mono">{fetcher.data.details.message[0]}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-mono uppercase tracking-widest font-bold rounded-md disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
                </button>
              </div>
              {fetcher.data?.success === false && fetcher.data?.message && (
                <p className="text-[10px] font-mono text-red-500 text-right">{fetcher.data.message}</p>
              )}
            </fetcher.Form>
          </div>

          {/* Entries Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-sans font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Signatures <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">{entries.length}</span>
            </h3>
            
            {entries.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 border-dashed">
                <p className="text-zinc-500 font-mono text-sm">No signatures yet. Be the first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-md border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                      {entry.message}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">{entry.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
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
