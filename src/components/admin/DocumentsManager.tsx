import { useState, useEffect, useRef } from 'react';
import { DocumentAsset } from '../../types/types';
import { FolderOpen, Upload, Pencil, Trash2, X, Check, Loader2, Download, FileText, Plus, Filter } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { uploadFile, deleteFile } from '../../lib/supabase';

const TYPE_COLORS: Record<DocumentAsset['type'], string> = {
  'Resume':       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Cover Letter': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Certificate':  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Offer Letter': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Other':        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const DOC_TYPES: DocumentAsset['type'][] = ['Resume', 'Cover Letter', 'Certificate', 'Offer Letter', 'Other'];

interface DocumentsManagerProps {
  onRefresh: () => void;
}

export default function DocumentsManager({ onRefresh }: DocumentsManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<DocumentAsset['type'] | 'All'>('All');
  const [uploading, setUploading] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentAsset | null>(null);
  const [editForm, setEditForm] = useState<Partial<DocumentAsset>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
    } catch (err) { console.error('[DocumentsManager]', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleFileUpload = async (file: File, meta: { name?: string; type?: DocumentAsset['type']; version?: string } = {}) => {
    setUploading(true);
    try {
      let url = '';
      let storagePath = '';
      let size = `${(file.size / 1024).toFixed(0)} KB`;

      // Try Supabase upload; if not configured, fall back to URL-only entry
      try {
        const docType = meta.type || inferType(file.name);
        // e.g. "Cover Letter" -> "cover-letters"
        const folderName = docType.toLowerCase().replace(/ /g, '-') + 's';
        const result = await uploadFile(file, folderName);
        url = result.url;
        storagePath = result.path;
        size = result.size;
      } catch (uploadErr: any) {
        if (uploadErr.message.includes('not set')) {
          // Supabase not configured — just register metadata
          toast({ variant: 'warning', title: 'Supabase not configured', description: 'File metadata saved without upload.' });
        } else {
          throw uploadErr;
        }
      }

      const payload = {
        name:        meta.name || file.name.replace(/\.[^.]+$/, ''),
        type:        meta.type || inferType(file.name),
        version:     meta.version || 'v1.0',
        url,
        storagePath,
        mimeType:    file.type,
        size,
        uploadedAt:  new Date().toISOString().split('T')[0],
      };

      const res = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast({ variant: 'success', title: 'File registered', description: payload.name });
        loadDocuments();
        onRefresh();
      } else throw new Error(data.error);
    } catch (err: any) {
      toast({ variant: 'error', title: 'Upload failed', description: err.message });
    } finally { setUploading(false); }
  };

  const inferType = (filename: string): DocumentAsset['type'] => {
    const n = filename.toLowerCase();
    if (n.includes('resume') || n.includes('cv')) return 'Resume';
    if (n.includes('cover') || n.includes('letter')) return 'Cover Letter';
    if (n.includes('cert')) return 'Certificate';
    if (n.includes('offer')) return 'Offer Letter';
    return 'Other';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (doc: DocumentAsset) => {
    const id = (doc as any)._id || doc.id;
    try {
      // Delete from Supabase Storage if path exists
      if (doc.storagePath) {
        try { await deleteFile(doc.storagePath); } catch {}
      }
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast({ variant: 'warning', title: 'Deleted', description: doc.name });
        setConfirmDelete(null);
        loadDocuments();
        onRefresh();
      }
    } catch (err: any) {
      toast({ variant: 'error', title: 'Delete failed', description: err.message });
    }
  };

  const openEdit = (doc: DocumentAsset) => { setEditTarget(doc); setEditForm({ name: doc.name, type: doc.type, version: doc.version }); };
  const closeEdit = () => { setEditTarget(null); setEditForm({}); };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const id = (editTarget as any)._id || editTarget.id;
      const res = await fetch('/api/documents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ variant: 'success', title: 'Metadata updated' });
        closeEdit(); loadDocuments();
      } else throw new Error(data.error);
    } catch (err: any) {
      toast({ variant: 'error', title: 'Save failed', description: err.message });
    } finally { setSaving(false); }
  };

  const filtered = documents.filter(d => typeFilter === 'All' || d.type === typeFilter);

  return (
    <div className="space-y-6" id="documents-manager-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FolderOpen size={20} className="text-zinc-400" />
            File Assets
          </h2>
          <p className="text-sm text-zinc-500 font-mono mt-1">{documents.length} documents stored</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-mono font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Upload File
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          dragOver
            ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/20'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <Upload size={24} className={`transition-colors ${dragOver ? 'text-teal-500' : 'text-zinc-400'}`} />
        <div className="text-center">
          <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">Drag & drop a file here, or click to browse</p>
          <p className="text-xs font-mono text-zinc-400 mt-1">PDF, DOCX, PNG, XLSX — uploaded to Supabase Storage</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-zinc-400" />
        {(['All', ...DOC_TYPES] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t as any)}
            className={`mono-text text-xs px-3 py-1 rounded-full border transition-colors ${
              typeFilter === t
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
          <FileText size={36} className="mb-3 opacity-40" />
          <p className="font-mono text-sm">No files yet. Upload your first document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const id = (doc as any)._id || doc.id;
            const isEditing = editTarget && ((editTarget as any)._id || editTarget.id) === id;
            return (
              <div key={id} className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        value={editForm.name || ''}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none font-mono"
                      />
                    ) : (
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate font-mono">{doc.name}</h3>
                    )}
                    <p className="mono-text text-[10px] text-zinc-400 mt-1">
                      {doc.uploadedAt} · {doc.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <select
                      value={editForm.type}
                      onChange={e => setEditForm(f => ({ ...f, type: e.target.value as any }))}
                      className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5"
                    >
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span className={`mono-text text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.type]}`}>{doc.type}</span>
                  )}
                  {isEditing ? (
                    <input
                      value={editForm.version || ''}
                      onChange={e => setEditForm(f => ({ ...f, version: e.target.value }))}
                      placeholder="Version"
                      className="w-20 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5 focus:outline-none"
                    />
                  ) : (
                    <span className="mono-text text-[10px] text-emerald-600 dark:text-emerald-400">{doc.version}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  {isEditing ? (
                    <div className="flex gap-2 w-full">
                      <button onClick={closeEdit} className="flex-1 py-1.5 text-xs font-mono border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</button>
                      <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded font-bold flex items-center justify-center gap-1">
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                      </button>
                    </div>
                  ) : (
                    <>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="mono-text text-[10px] flex items-center gap-1 text-zinc-500 hover:text-teal-600 transition-colors">
                          <Download size={11} /> Download
                        </a>
                      ) : (
                        <span className="mono-text text-[10px] text-zinc-300 dark:text-zinc-700">No file URL</span>
                      )}
                      <div className="flex items-center gap-1">
                        {confirmDelete === id ? (
                          <>
                            <span className="text-[10px] text-rose-500 font-mono">Delete?</span>
                            <button onClick={() => handleDelete(doc)} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Check size={12} /></button>
                            <button onClick={() => setConfirmDelete(null)} className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"><X size={12} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(doc)} className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"><Pencil size={12} /></button>
                            <button onClick={() => setConfirmDelete(id)} className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
