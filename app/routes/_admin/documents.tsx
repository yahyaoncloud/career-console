import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireAdmin } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { z } from 'zod';
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Download, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadFile } from '../../lib/supabase';

const DocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['RESUME', 'COVER_LETTER', 'CERTIFICATE', 'OFFER_LETTER', 'OTHER']).default('OTHER'),
  url: z.string().url("Valid URL is required"),
  version: z.string().optional()
});

type DocumentFormData = z.infer<typeof DocumentSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const documents = await prisma.document.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { documents };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.document.update({
        where: { id },
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
          type: rest.type as any
        }
      });
      return { success: true, message: 'Document added' };
    }

    if (intent === 'update' && id) {
      await prisma.document.update({
        where: { id },
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

export default function DocumentsManagerRoute() {
  const { documents } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(DocumentSchema),
    defaultValues: {
      name: '',
      type: 'OTHER',
      url: '',
      version: ''
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Use 'documents' bucket, store in a folder named after the user to avoid collisions
      const { url } = await uploadFile(file, `user_${user.id}`, 'documents');
      setValue('url', url, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      console.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
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
        <Card className="p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
            <h3 className="text-lg font-bold font-sans tracking-tight text-foreground">{isAddingNew ? 'Add Document' : 'Edit Document'}</h3>
            <button onClick={handleCancel} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
              <X size={16} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editingId && <input type="hidden" {...register('id')} value={editingId} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Document Name *</label>
                  <input
                    {...register('name')}
                    className={cn("w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.name && "border-destructive")}
                    placeholder="e.g. Frontend Resume V2"
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Document URL *</label>
                  <div className="flex gap-2">
                    <input
                      {...register('url')}
                      className={cn("flex-1 px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground", errors.url && "border-destructive")}
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center px-4 py-2 bg-muted/50 border border-border/50 rounded cursor-pointer hover:bg-muted transition-colors text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload File'}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Provide a direct link or upload a file directly to your secure vault.</p>
                  {errors.url && <p className="text-destructive text-xs mt-1">{errors.url.message}</p>}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Type</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  >
                    <option value="RESUME">Resume</option>
                    <option value="COVER_LETTER">Cover Letter</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="OFFER_LETTER">Offer Letter</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Version</label>
                  <input
                    {...register('version')}
                    className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    placeholder="e.g. v2.1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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
