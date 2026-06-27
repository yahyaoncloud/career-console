import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calendar, Briefcase, ChevronRight, Loader2, Server } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface JobReport {
  slug: string;
  title: string;
  date: string;
}

interface JobDetail {
  title: string;
  date: string;
  content: string;
}

export default function JobBoard() {
  const { toast } = useToast();
  const [reports, setReports] = useState<JobReport[]>([]);
  const [activeReport, setActiveReport] = useState<JobDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          setReports(data.jobs);
          fetchDetail(data.jobs[0].slug); // auto-load the latest
        }
      } catch (err) {
        console.error('Failed to load job reports', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchReports();
  }, []);

  const fetchDetail = async (slug: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/jobs/${slug}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setActiveReport(data.job);
      }
    } catch (err) {
      console.error('Failed to load report details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const triggerScrape = async () => {
    try {
      toast({ variant: 'info', title: 'Running Scraper...', description: `Fetching jobs using ${selectedModel}` });
      const res = await fetch('/api/scraper/trigger', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.success) {
        toast({ variant: 'success', title: 'Scraper Triggered', description: data.message });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: 'error', title: 'Error', description: err.message || 'Failed to trigger scraper' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            <Server size={18} className="mr-2 text-zinc-400" /> Job Sourcing CMS
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">AI Automated job scraping feeds.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-teal-500"
          >
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Best for JSON)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
          </select>
          <button
            onClick={triggerScrape}
            className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono font-bold rounded shadow-sm transition-colors"
          >
            <span>Run Scraper</span>
          </button>
        </div>
      </div>

      {/* Master Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column: Report List */}
          <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0 space-y-3">
            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Daily Reports</h3>
            
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-zinc-400" size={24} />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-center">
                <Briefcase className="mx-auto text-zinc-400 mb-2" size={24} />
                <p className="text-sm text-zinc-500 font-mono">No reports found yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.slug}
                    onClick={() => fetchDetail(report.slug)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group
                      ${activeReport?.title === report.title 
                        ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 ring-1 ring-teal-500/20' 
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'
                      }`}
                  >
                    <div>
                      <div className={`font-semibold text-sm mb-1 ${activeReport?.title === report.title ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {report.title.replace('Daily Cloud Jobs Report - ', '')}
                      </div>
                      <div className="flex items-center text-xs font-mono text-zinc-500">
                        <Calendar size={12} className="mr-1.5" />
                        {new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${activeReport?.title === report.title ? 'text-teal-500 translate-x-1' : 'text-zinc-400 group-hover:translate-x-1'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Active Report Content */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            {loadingDetail ? (
              <div className="flex justify-center items-center h-64 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Loader2 className="animate-spin text-zinc-400" size={32} />
              </div>
            ) : activeReport ? (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 md:p-12 shadow-sm">
                <div className="mb-8">
                  <h2 className="serif-header text-3xl font-bold text-zinc-900 dark:text-white mb-2">{activeReport.title}</h2>
                  <div className="flex items-center space-x-4 text-sm font-mono text-zinc-500">
                    <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Published: {activeReport.date}</span>
                    <span className="flex items-center"><Briefcase size={14} className="mr-1.5" /> Source: WeWorkRemotely</span>
                  </div>
                </div>

                <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-teal-600 dark:prose-a:text-teal-400 hover:prose-a:text-teal-500 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown>{activeReport.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                <Briefcase size={32} className="mb-4 opacity-50" />
                <p className="font-mono text-sm">Select a report to view details</p>
              </div>
            )}
          </div>

        </div>
    </div>
  );
}
