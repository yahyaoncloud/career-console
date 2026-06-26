import { useState, useEffect } from 'react';
import { ResumeData } from '../../types/types';
import PublicNavbar from './PublicNavbar';
import { MessageSquare, Send } from 'lucide-react';

interface GuestbookProps {
  resume: ResumeData;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

interface GuestEntry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

export default function Guestbook({ resume, onEnterConsole, isAuthenticated }: GuestbookProps) {
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/guestbook')
      .then(r => r.json())
      .then(data => {
        if (data.entries) setEntries(data.entries);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (data.success && data.entry) {
        setEntries([data.entry, ...entries]);
        setName('');
        setMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16" id="guestbook-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={onEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center">
            <MessageSquare size={14} className="mr-2" /> Digital Guestbook
          </h2>
          <p className="serif-header text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed font-light max-w-2xl">
            Drop a message, say hello, or let me know what brought you here.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] mono-text text-zinc-500 mb-1 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded font-sans text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-[10px] mono-text text-zinc-500 mb-1 uppercase tracking-wider">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded font-sans text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                placeholder="Hello there!"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !name || !message}
              className="flex items-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs mono-text rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send size={14} className="mr-2" />
              {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
            </button>
          </form>
        </div>

        <div className="space-y-4 pt-8">
          {entries.length === 0 ? (
            <p className="text-xs text-zinc-500 mono-text italic">No entries yet. Be the first!</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-100">{entry.name}</span>
                  <span className="text-[10px] mono-text text-zinc-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                  {entry.message}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-500 space-y-4 md:space-y-0 pb-16">
        <div className="space-y-1 text-center md:text-left">
          <p className="serif-header italic font-light">© {new Date().getFullYear()} {resume.name}. Built with React & Tailwind.</p>
        </div>
      </footer>
    </div>
  );
}
