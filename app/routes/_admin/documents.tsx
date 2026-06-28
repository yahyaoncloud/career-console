import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Download, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const DocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['RESUME', 'COVER_LETTER', 'CERTIFICATE', 'OFFER_LETTER', 'OTHER']).default('OTHER'),
  url: z.string().url("Valid URL is required"),
  version: z.string().optional()
});

type DocumentFormData = z.infer<typeof DocumentSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const documents = await prisma.document.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { documents };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.document.update({
        where: { id, userId: user.id },
        data: { deletedAt: new Date() }
      });
      return { success: true, message: 'Document deleted' };
    }

    const data = Object.fromEntries(formData);
    const result = DocumentSchema.safeParse(data);
    
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { id, ...rest } = result.data;

    if (intent === 'create') {
      await prisma.document.create({
        data: {
          ...rest,
          type: rest.type as any,
          userId: user.id
        }
      });
      return { success: true, message: 'Document added' };
    }

    if (intent === 'update' && id) {
      await prisma.document.update({
        where: { id, userId: user.id },
        data: {
          ...rest,
          type: rest.type as any
        }
      });
      return { success: true, message: 'Document updated' };
    }

    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export default function DocumentsRoute() {
  const { documents } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(DocumentSchema),
    defaultValues: {
      name: '',
      type: 'OTHER',
      url: '',
      version: ''
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === 'idle') {
      alert(fetcher.data.message);
      setEditingId(null);
      setIsAddingNew(false);
      reset();
    } else if (fetcher.data?.message && !fetcher.data.success && fetcher.state === 'idle') {
      alert('Error: ' + fetcher.data.message);
    }
  }, [fetcher.data, fetcher.state, reset]);

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    reset({
      name: '',
      type: 'OTHER',
      url: '',
      version: ''
    });
  };

  const startEdit = (doc: typeof documents[0]) => {
    setIsAddingNew(false);
    setEditingId(doc.id);
    reset({
      id: doc.id,
      name: doc.name,
      type: doc.type as any,
      url: doc.url,
      version: doc.version || ''
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
  };

  const onSubmit = (data: DocumentFormData) => {
    fetcher.submit(
      { ...data, intent: isAddingNew ? 'create' : 'update' },
      { method: 'post' }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      fetcher.submit({ id, intent: 'delete' }, { method: 'post' });
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    'RESUME': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'COVER_LETTER': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'CERTIFICATE': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'OFFER_LETTER': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'OTHER': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <FileText size={20} className="text-muted-foreground" />
            Documents Library
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Manage resumes, cover letters, and certificates.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-mono font-bold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          Upload Document
        </button>
      </div>

      {(isAddingNew || editingId) && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-6">
            <Heading variant="h3">{isAddingNew ? 'Add Document' : 'Edit Document'}</Heading>
            <button onClick={handleCancel} className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Document Name *</label>
                  <input
                    {...register('name')}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40", errors.name && "border-destructive")}
                    placeholder="e.g. Frontend Resume V2"
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Document URL *</label>
                  <input
                    {...register('url')}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40", errors.url && "border-destructive")}
                    placeholder="https://..."
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Provide a direct link to the file (S3, Dropbox, etc).</p>
                  {errors.url && <p className="text-destructive text-xs mt-1">{errors.url.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Type</label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="RESUME">Resume</option>
                    <option value="COVER_LETTER">Cover Letter</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="OFFER_LETTER">Offer Letter</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Version</label>
                  <input
                    {...register('version')}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. v2.1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Saving...' : 'Save Document'}
              </button>
            </div>
          </fetcher.Form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex flex-col border-border/50 bg-card hover:border-border transition-colors group">
            <div className="p-4 flex-1 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText size={20} />
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap", TYPE_COLORS[doc.type] || TYPE_COLORS['OTHER'])}>
                  {doc.type}
                </span>
              </div>
              
              <div>
                <h3 className="font-bold font-sans text-base leading-tight break-words">{doc.name}</h3>
                {doc.version && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Version: {doc.version}
                  </p>
                )}
              </div>
            </div>
            
            <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <a 
                href={doc.url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:opacity-80 transition-opacity"
              >
                <Download size={12} />
                Open
              </a>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(doc)}
                  className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Edit Document"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete Document"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <FileText size={32} className="mb-4 opacity-20" />
            <p className="font-mono text-sm">No documents found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
