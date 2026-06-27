import { useState, useEffect } from 'react';
import { ResumeData } from '../../types/types';
import { UserCircle, Save, Loader2, Plus, X, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface ProfileEditorProps {
  resume: ResumeData | null;
  onUpdateResume: (data: ResumeData) => void;
}

export default function ProfileEditor({ resume, onUpdateResume }: ProfileEditorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ResumeData | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState({ category: 'languages' as keyof ResumeData['skills'], value: '' });

  useEffect(() => {
    if (resume && !formData) {
      setFormData(JSON.parse(JSON.stringify(resume)));
    }
  }, [resume, formData]);

  if (!formData) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>;
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev!, [field]: value }));
  };

  const handleContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev!,
      contact: { ...prev!.contact, [field]: value }
    }));
  };

  const addSkill = () => {
    const v = skillInput.value.trim();
    if (v && !formData.skills[skillInput.category].includes(v)) {
      setFormData(prev => ({
        ...prev!,
        skills: {
          ...prev!.skills,
          [skillInput.category]: [...prev!.skills[skillInput.category], v]
        }
      }));
    }
    setSkillInput(prev => ({ ...prev, value: '' }));
  };

  const removeSkill = (category: keyof ResumeData['skills'], skill: string) => {
    setFormData(prev => ({
      ...prev!,
      skills: {
        ...prev!.skills,
        [category]: prev!.skills[category].filter(s => s !== skill)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateResume(formData);
      toast({ variant: 'success', title: 'Profile Updated', description: 'Your profile has been successfully saved.' });
    } catch (err: any) {
      toast({ variant: 'error', title: 'Update Failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" id="profile-editor-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <UserCircle size={20} className="text-zinc-400" />
            Profile & Identity
          </h2>
          <p className="text-sm text-zinc-500 font-mono mt-1">Manage your professional presence and contact details.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-mono font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">Basic Info</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Full Name</label>
              <input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Professional Title</label>
              <input
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Professional Summary</label>
              <textarea
                value={formData.summary}
                onChange={e => handleChange('summary', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 text-sm font-sans bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Links */}
        <div className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">Contact Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-1"><Mail size={12} /> Email Address</label>
              <input
                value={formData.contact.email}
                onChange={e => handleContactChange('email', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-1"><Phone size={12} /> Phone Number</label>
              <input
                value={formData.contact.phone}
                onChange={e => handleContactChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-1"><MapPin size={12} /> Location</label>
              <input
                value={formData.contact.location}
                onChange={e => handleContactChange('location', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-1"><Github size={12} /> GitHub URL</label>
                <input
                  value={formData.contact.github}
                  onChange={e => handleContactChange('github', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  placeholder="github.com/username"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-1"><Linkedin size={12} /> LinkedIn URL</label>
                <input
                  value={formData.contact.linkedin}
                  onChange={e => handleContactChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width: Skills Manager */}
        <div className="md:col-span-2 space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">Skills Taxonomy</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={skillInput.category}
              onChange={e => setSkillInput(prev => ({ ...prev, category: e.target.value as any }))}
              className="px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 w-full sm:w-48"
            >
              <option value="languages">Languages</option>
              <option value="frameworks">Frameworks & APIs</option>
              <option value="cloud">Cloud Infrastructure</option>
              <option value="tools">Diagnostics & Tools</option>
            </select>
            <div className="flex gap-2 flex-1">
              <input
                value={skillInput.value}
                onChange={e => setSkillInput(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Enter a skill..."
                className="flex-1 px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-mono font-bold rounded-lg hover:opacity-90 flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['languages', 'frameworks', 'cloud', 'tools'] as const).map(cat => (
              <div key={cat} className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 dark:border-zinc-900 pb-1">
                  {cat}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {formData.skills[cat].map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800">
                      {skill}
                      <button onClick={() => removeSkill(cat, skill)} className="text-zinc-400 hover:text-rose-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {formData.skills[cat].length === 0 && (
                    <span className="text-[10px] font-mono text-zinc-400 italic">No skills added</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
