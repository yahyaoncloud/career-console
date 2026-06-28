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

export async function loader() {
  const entries = await prisma.guestbook.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  return { entries };
}

export async function action({ request }: ActionFunctionArgs) {
  // Rate Limiting (Phase 11)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed, remaining } = await checkRateLimit(ip, 5); // 5 requests per minute
  
  if (!allowed) {
    return { success: false, message: 'Too many requests. Please try again later.' };
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const result = GuestbookSchema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Sanitization (Phase 11)
  const entry = await prisma.guestbook.create({
    data: {
      name: sanitizeString(result.data.name),
      message: sanitizeString(result.data.message)
    }
  });

  return { success: true, entry };
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
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-muted-foreground flex items-center">
            <MessageSquare size={14} className="mr-2" /> Digital Guestbook
          </h2>
          <p className="font-serif text-2xl text-foreground leading-relaxed font-light max-w-2xl">
            Drop a message, say hello, or let me know what brought you here.
          </p>
        </div>

        <div className="bg-card p-6 rounded border border-border shadow-sm">
          <fetcher.Form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Your Name</label>
              <input
                {...register('name')}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-background border border-border rounded font-sans text-sm focus:outline-none focus:border-primary text-foreground"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Message</label>
              <textarea
                {...register('message')}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded font-sans text-sm focus:outline-none focus:border-primary text-foreground"
                placeholder="Hello there!"
              />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-foreground text-background text-xs font-mono rounded hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              <Send size={14} className="mr-2" />
              {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
            </button>
            {fetcher.data?.success === false && fetcher.data?.message && (
              <p className="text-sm text-destructive mt-2">{fetcher.data.message}</p>
            )}
          </fetcher.Form>
        </div>

        <div className="space-y-6 pt-8">
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">No entries yet. Be the first!</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border-l-2 border-border pl-4 py-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-lg font-bold text-foreground">{entry.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground font-sans leading-relaxed opacity-80">
                  {entry.message}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
