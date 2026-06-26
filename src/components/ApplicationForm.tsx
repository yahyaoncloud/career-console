import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types/types';
import { Save, X } from 'lucide-react';
import { useToast } from './ui/Toast';

interface ApplicationFormProps {
  application?: JobApplication | null;
  onSave: (app: Omit<JobApplication, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function ApplicationForm({
  application,
  onSave,
  onCancel,
}: ApplicationFormProps) {
  const { toast } = useToast();
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Contract' | 'Part-time' | 'Remote' | 'Hybrid'>('Full-time');
  const [appliedDate, setAppliedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [referral, setReferral] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<ApplicationStatus>('Wishlist');
  const [interviewDate, setInterviewDate] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeUsed, setResumeUsed] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (application) {
      setCompany(application.company || '');
      setPosition(application.position || '');
      setLocation(application.location || '');
      setSalary(application.salary || '');
      setEmploymentType(application.employmentType || 'Full-time');
      setAppliedDate(application.appliedDate || '');
      setDeadline(application.deadline || '');
      setReferral(application.referral || '');
      setRecruiter(application.recruiter || '');
      setContact(application.contact || '');
      setWebsite(application.website || '');
      setPriority(application.priority || 'Medium');
      setStatus(application.status || 'Wishlist');
      setInterviewDate(application.interviewDate ? application.interviewDate.split('T')[0] : '');
      setNotes(application.notes || '');
      setResumeUsed(application.resumeUsed || '');
      setCoverLetter(application.coverLetter || '');
      setTags(application.tags || []);
    }
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !position) {
      toast({ variant: 'warning', title: 'Required fields missing', description: 'Company and Position are required.' });
      return;
    }
    onSave({
      id: application?.id,
      company,
      position,
      location,
      salary,
      employmentType,
      appliedDate,
      deadline,
      referral,
      recruiter,
      contact,
      website,
      priority,
      status,
      interviewDate: interviewDate ? new Date(interviewDate).toISOString() : undefined,
      notes,
      resumeUsed,
      coverLetter,
      tags,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded border border-zinc-200 dark:border-zinc-850 space-y-6 max-w-2xl mx-auto" id="application-form-panel">
      <div className="border-b border-zinc-200 dark:border-zinc-900 pb-2 flex justify-between items-center">
        <div>
          <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {application ? 'Update Application Record' : 'Log New Job Application'}
          </h3>
          <span className="mono-text text-[10px] text-zinc-400">
            Database Write Session · ID: {application?.id || 'New Record'}
          </span>
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Company *</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none focus:border-zinc-500"
              placeholder="e.g. Stripe"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Position *</label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none focus:border-zinc-500"
              placeholder="e.g. Staff Infrastructure Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none focus:border-zinc-500"
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Salary Bracket</label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none focus:border-zinc-500"
              placeholder="e.g. $220k - $250k"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
            >
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* State/Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
            >
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="HR Screening">HR Screening</option>
              <option value="Technical">Technical</option>
              <option value="Manager Round">Manager Round</option>
              <option value="Final Round">Final Round</option>
              <option value="Offer">Offer</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Applied Date</label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic Interviews / Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Interview Date</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Contact Recruiter</label>
            <input
              type="text"
              value={recruiter}
              onChange={(e) => setRecruiter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="Sarah Jenkins"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Recruiter Email/Link</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="sjenkins@stripe.com"
            />
          </div>
        </div>

        {/* Links & Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 col-span-1 sm:col-span-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Referral / Source</label>
            <input
              type="text"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="Nikhil (Staff)"
            />
          </div>

          <div className="space-y-1 col-span-1 sm:col-span-2">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Job Spec URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="https://stripe.com/jobs/..."
            />
          </div>
        </div>

        {/* Resumes & Cover letters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Resume Version Tied</label>
            <input
              type="text"
              value={resumeUsed}
              onChange={(e) => setResumeUsed(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="Staff_Infrastructure_Resume_v4.pdf"
            />
          </div>

          <div className="space-y-1">
            <label className="mono-text text-[10px] text-zinc-400 uppercase">Cover Letter Version</label>
            <input
              type="text"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="Stripe_Cover_Letter.pdf"
            />
          </div>
        </div>

        {/* Dynamic Tags */}
        <div className="space-y-1.5">
          <label className="mono-text text-[10px] text-zinc-400 uppercase">Security/Technical Tags</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
              placeholder="Type tag (e.g. Golang) and press Enter or Add"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs mono-text text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
            >
              ADD
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
               <span
                key={t}
                className="inline-flex items-center space-x-1 mono-text text-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
              >
                <span>{t}</span>
                <button type="button" onClick={() => handleRemoveTag(t)} className="text-red-500 font-bold ml-1 hover:opacity-85">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="mono-text text-[10px] text-zinc-400 uppercase">Engineering Notes & Preparation Log</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none focus:border-zinc-500"
            placeholder="Log technical milestones, interview debriefs, Paxos details, Raft questions..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-200 dark:border-zinc-900">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
          >
            ABORT
          </button>
          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-2 border border-zinc-800 dark:border-zinc-200 rounded text-xs mono-text font-medium hover:opacity-90 cursor-pointer"
          >
            <Save size={12} />
            <span>COMMIT_RECORDS</span>
          </button>
        </div>
      </form>
    </div>
  );
}
