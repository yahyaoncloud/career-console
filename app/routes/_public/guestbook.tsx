import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { prisma } from '../../lib/db.server';
import { checkRateLimit } from '../../lib/rate-limit.server';
import { sanitizeString } from '../../lib/sanitize';
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
import { getCache, setCache, clearCache, CACHE_TTL } from '../../lib/cache.server';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    })
  ]);
}

export async function loader(args: LoaderFunctionArgs) {
  try {
    const cachedEntries = getCache<any[]>('guestbook:entries');
    if (cachedEntries) {
      return { entries: cachedEntries };
    }

    const entries = await withTimeout(prisma.guestbook.findMany({
      select: {
        id: true,
        name: true,
        message: true,
        createdAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }), 2500, []);

    setCache('guestbook:entries', entries, CACHE_TTL.SHORT);
    
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
    clearCache('guestbook:entries');

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
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            Guestbook
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-6 max-w-2xl">
            Leave a trace. Share your thoughts, say hello, or let me know what brought you here.
          </p>
        </div>

        <div className="pt-2 space-y-10">
          <div className="border border-zinc-200 dark:border-zinc-800 p-5">
            <fetcher.Form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-600 dark:text-zinc-400">Your Name</label>
                <input
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors disabled:opacity-50"
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
                  className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-none disabled:opacity-50"
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 text-[11px] font-mono uppercase tracking-widest disabled:opacity-50 transition-colors hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900"
                >
                  {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
                </button>
              </div>
              {fetcher.data?.success === false && fetcher.data?.message && (
                <p className="text-[10px] font-mono text-red-500 text-right">{fetcher.data.message}</p>
              )}
            </fetcher.Form>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
              Signatures <span className="text-zinc-400">{entries.length}</span>
            </h3>
            
            {entries.length === 0 ? (
              <div className="py-12 border-y border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500 font-mono text-sm">No signatures yet. Be the first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0">
                {entries.map((entry) => (
                  <div key={entry.id} className="border-b border-zinc-200 dark:border-zinc-800 py-5 flex flex-col gap-3 last:border-b-0">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-7 font-sans">
                      {entry.message}
                    </p>
                    <div className="flex items-center gap-2">
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
