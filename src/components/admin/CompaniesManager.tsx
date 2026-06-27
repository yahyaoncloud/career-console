import { useState, useEffect } from 'react';
import { Company } from '../../types/types';
import { Building2, Plus, Pencil, Trash2, X, Check, ExternalLink, Search, Loader2, Globe, Users } from 'lucide-react';
import { useToast } from '../ui/Toast';

const STATUS_COLORS: Record<Company['status'], string> = {
  Target:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Applied:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Interviewing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Blacklisted:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Tracking:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const EMPTY_COMPANY: Omit<Company, 'id'> = {
  name: '', website: '', industry: '', hq: '', size: '', status: 'Tracking',
  notes: '', recruiter: '', contactEmail: '', linkedinUrl: '', tags: [],
};

interface CompaniesManagerProps {
  externalCompanies?: Company[]; // derived from applications if no dedicated DB entries
  onRefresh: () => void;
}

export default function CompaniesManager({ externalCompanies = [], onRefresh }: CompaniesManagerProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Company['status'] | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [form, setForm] = useState<Omit<Company, 'id'>>(EMPTY_COMPANY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error('[CompaniesManager] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  // Merge DB companies with application-derived ones (deduped by name)
  const dbNames = new Set(companies.map(c => c.name.toLowerCase()));
  const derived: Company[] = externalCompanies
    .filter(c => !dbNames.has(c.name.toLowerCase()))
    .map(c => ({ ...c, status: 'Tracking' as const }));
  const allCompanies = [...companies, ...derived];

  const filtered = allCompanies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setForm(EMPTY_COMPANY); setEditTarget(null); setShowForm(true); };
  const openEdit   = (c: Company) => { setForm({ ...c }); setEditTarget(c); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditTarget(null); setTagInput(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ variant: 'error', title: 'Name required', description: 'Company name cannot be empty.' }); return; }
    setSaving(true);
    try {
      const endpoint = editTarget ? '/api/companies/update' : '/api/companies/create';
      const body = editTarget ? { id: (editTarget as any)._id || editTarget.id, ...form } : form;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast({ variant: 'success', title: editTarget ? 'Company updated' : 'Company added', description: form.name });
        closeForm();
        loadCompanies();
        onRefresh();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: 'error', title: 'Save failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/companies/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast({ variant: 'warning', title: 'Deleted', description: `${name} removed.` });
        setConfirmDelete(null);
        loadCompanies();
        onRefresh();
      }
    } catch (err: any) {
      toast({ variant: 'error', title: 'Delete failed', description: err.message });
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !(form.tags || []).includes(t)) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    }
    setTagInput('');
  };
  const removeTag = (t: string) => setForm(f => ({ ...f, tags: (f.tags || []).filter(x => x !== t) }));

  return (
    <div className="space-y-6" id="companies-manager-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Building2 size={20} className="text-zinc-400" />
            Companies Database
          </h2>
          <p className="text-sm text-zinc-500 font-mono mt-1">{allCompanies.length} employers tracked</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-mono font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or industry..."
            className="w-full pl-9 pr-4 py-2 text-sm font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none"
        >
          {['All', 'Target', 'Applied', 'Interviewing', 'Tracking', 'Blacklisted'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
          <Building2 size={36} className="mb-3 opacity-40" />
          <p className="font-mono text-sm">No companies found. Add your first target employer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((company) => {
            const id = (company as any)._id || company.id;
            return (
              <div key={id || company.name} className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="serif-header font-bold text-zinc-900 dark:text-zinc-50 text-base truncate">{company.name}</h3>
                    {company.industry && <p className="text-xs font-mono text-zinc-400 mt-0.5">{company.industry}</p>}
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold mono-text px-2 py-0.5 rounded-full ${STATUS_COLORS[company.status]}`}>
                    {company.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs font-mono text-zinc-500">
                  {company.hq && <p>📍 {company.hq}</p>}
                  {company.size && <p><Users size={11} className="inline mr-1" />{company.size} employees</p>}
                  {company.recruiter && <p>👤 {company.recruiter}</p>}
                  {company.contactEmail && <p>✉ {company.contactEmail}</p>}
                  {company.notes && <p className="text-zinc-400 italic line-clamp-2">"{company.notes}"</p>}
                </div>

                {/* Tags */}
                {(company.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(company.tags || []).map(t => (
                      <span key={t} className="mono-text text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded">{t}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-2">
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-teal-500 transition-colors" title="Website">
                        <Globe size={14} />
                      </a>
                    )}
                    {company.linkedinUrl && (
                      <a href={company.linkedinUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-500 transition-colors" title="LinkedIn">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {id ? (
                    <div className="flex items-center gap-1">
                      {confirmDelete === id ? (
                        <>
                          <span className="text-[10px] text-rose-500 font-mono mr-1">Sure?</span>
                          <button onClick={() => handleDelete(id, company.name)} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Check size={13} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"><X size={13} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEdit(company)} className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"><Pencil size={13} /></button>
                          <button onClick={() => setConfirmDelete(id)} className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-400">from tracker</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeForm}>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50">{editTarget ? 'Edit Company' : 'Add Company'}</h3>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Company Name *', key: 'name', span: 2 },
                { label: 'Industry', key: 'industry' },
                { label: 'Headquarters', key: 'hq' },
                { label: 'Website', key: 'website' },
                { label: 'Company Size', key: 'size', placeholder: 'e.g. 50-200' },
                { label: 'Recruiter Name', key: 'recruiter' },
                { label: 'Contact Email', key: 'contactEmail' },
                { label: 'LinkedIn URL', key: 'linkedinUrl', span: 2 },
              ].map(({ label, key, span, placeholder }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-mono text-zinc-500 mb-1">{label}</label>
                  <input
                    value={(form as any)[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-xs font-mono text-zinc-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none"
                >
                  {['Tracking', 'Target', 'Applied', 'Interviewing', 'Blacklisted'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-mono text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-mono text-zinc-500 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag + Enter"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none"
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono rounded-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(form.tags || []).map(t => (
                    <span key={t} className="flex items-center gap-1 mono-text text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 rounded">
                      {t}<button onClick={() => removeTag(t)} className="text-zinc-400 hover:text-rose-500"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeForm} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 text-sm font-mono rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-mono font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
