import { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, Zap, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '../ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enableAiMentor, setEnableAiMentor] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        setEnableAiMentor(data.enableAiMentor);
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAiMentor = async () => {
    setSaving(true);
    const newValue = !enableAiMentor;
    setEnableAiMentor(newValue); // Optimistic update
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableAiMentor: newValue })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ variant: 'success', title: 'Settings Saved', description: 'Preferences updated successfully.' });
    } catch (err: any) {
      setEnableAiMentor(!newValue); // Rollback
      toast({ variant: 'error', title: 'Update Failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl" id="settings-panel">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Settings size={24} className="text-zinc-400" />
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50">Platform Settings</h2>
          <p className="text-sm text-zinc-500 font-mono mt-1">Configure integrations, telemetry, and platform behavior.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: AI Config */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              AI Integrations
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">AI Learning Mentor (Dashboard)</h4>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    Enable the daily Gemini AI mentor on your dashboard. Generates a new Cloud/DevOps fundamental learning topic each day. Stored securely in MongoDB.
                  </p>
                </div>
                <button
                  onClick={toggleAiMentor}
                  disabled={saving}
                  className="shrink-0 pt-1 text-zinc-400 hover:text-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {enableAiMentor ? <ToggleRight size={32} className="text-indigo-500" /> : <ToggleLeft size={32} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal-500" />
              System Status
            </h3>
            
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Database Engine</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Database size={10} /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Gemini Gateway</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Platform Build</span>
              <span className="text-zinc-700 dark:text-zinc-300">v1.2.0-stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
