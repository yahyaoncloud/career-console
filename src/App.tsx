import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Link } from 'react-router-dom';
import { JobApplication, PortfolioProject, ResumeData, DocumentAsset, SystemLog, ApplicationStatus } from './types/types';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import EmailAuthForm from './components/EmailAuthForm';
import LandingPortfolio from './components/LandingPortfolio';
import DashboardOverview from './components/DashboardOverview';
import ApplicationsTable from './components/ApplicationsTable';
import InteractiveKanban from './components/InteractiveKanban';
import ApplicationForm from './components/ApplicationForm';
import ResumeBuilder from './components/ResumeBuilder';
import PortfolioManager from './components/PortfolioManager';
import BlogManager from './components/admin/BlogManager';
import BlogList from './components/public/BlogList';
import BlogPost from './components/public/BlogPost';
import Guestbook from './components/public/Guestbook';
import ProjectsPage from './components/public/ProjectsPage';
import JobBoard from './components/admin/JobBoard';
import ProfileEditor from './components/admin/ProfileEditor';
import CompaniesManager from './components/admin/CompaniesManager';
import DocumentsManager from './components/admin/DocumentsManager';
import SettingsPage from './components/admin/SettingsPage';
import { loginWithEmail, logout, initAuth } from './lib/firebase';
import { getStorageUsage } from './lib/supabase';
import { useToast } from './components/ui/Toast';
import { Briefcase, LayoutDashboard, Table, Kanban, FileText, Settings, Database, LogOut, ChevronRight, ShieldCheck, FolderOpen, Info, Sparkles, Building2, X, AlertTriangle, XCircle, Menu, Eye, UserCircle } from 'lucide-react';

export default function App() {
  return (
    <ThemeProvider>
      <CareerConsoleEngine />
    </ThemeProvider>
  );
}

function CareerConsoleEngine() {
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Navigation state mapped to React Router
  const navigate = useNavigate();
  const location = useLocation();
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'landing';
    if (path === '/login') return 'login';
    if (path === '/guestbook') return 'guestbook';
    if (path.startsWith('/blog')) return 'blog';
    if (path.startsWith('/jobs')) return 'jobs';
    if (path.startsWith('/projects')) return 'projects';
    if (path.startsWith('/admin')) {
      const sub = path.replace('/admin/', '').replace('/admin', '');
      return sub || 'dashboard';
    }
    return path.substring(1);
  };
  const activeTab = getActiveTab();
  
  const setActiveTab = (tab: string) => {
    if (tab === 'landing') navigate('/');
    else if (tab === 'login') navigate('/login');
    else if (tab === 'guestbook') navigate('/guestbook');
    else if (tab === 'blog') navigate('/blog');
    else if (tab === 'jobs') navigate('/jobs');
    else if (tab === 'projects') navigate('/projects');
    else navigate(`/admin/${tab}`);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data states (seeded on mount with server database, then synced dynamically)
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(() => {
    // Start with false (no spinner) if we already have cached data — instant paint on repeat visits
    try { return !localStorage.getItem('cc-db-cache'); } catch { return true; }
  });

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true); // true until Firebase resolves session
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [needsAuthPrompt, setNeedsAuthPrompt] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states
  const [activeFormApp, setActiveFormApp] = useState<JobApplication | null>(null);
  const [isAddingNewApp, setIsAddingNewApp] = useState(false);

  // Sheets Syncing state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);

  // AI Interview Prep modal states
  const [aiPrepApp, setAiPrepApp] = useState<JobApplication | null>(null);
  const [aiPrepQuestions, setAiPrepQuestions] = useState<Array<{ question: string; hint: string }> | null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);

  // Inspect detail modal states
  const [inspectedApp, setInspectedApp] = useState<JobApplication | null>(null);

  // Supabase Storage state
  const [storageUsageMb, setStorageUsageMb] = useState<number | null>(null);

  // Stale-While-Revalidate: paint from cache immediately, then refresh from server in background.
  // First visit: fetches from /api/db, shows spinner briefly, then caches.
  // Every visit after: reads cache instantly (0ms paint), silently revalidates in background.
  const loadDatabase = async () => {
    const CACHE_KEY = 'cc-db-cache';

    const hydrate = (data: any) => {
      if (!data) return;
      setApplications(data.applications || []);
      setPortfolio(data.portfolio || []);
      setResume(data.resume || null);
      setDocuments(data.documents || []);
      setLogs(data.logs || []);
    };

    // 1️⃣ Instant paint from localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        hydrate(JSON.parse(cached));
        setIsDbLoading(false); // unblock render NOW — no spinner
      }
    } catch {}

    // 2️⃣ Fetch fresh data from server (runs regardless, updates silently if already painted)
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      hydrate(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[DB] Failed to load from server:', err);
    } finally {
      setIsDbLoading(false); // always unblock on completion or error
    }
  };

  const loadStorageUsage = async () => {
    try {
      const mb = await getStorageUsage();
      setStorageUsageMb(mb);
    } catch (err) {
      console.error('[Storage] Failed to track usage:', err);
    }
  };

  useEffect(() => {
    loadDatabase();
    loadStorageUsage();

    // Auth bypassed for local development
    setUser({ email: 'admin@local', uid: '123' } as any);
    setAuthLoading(false);
    setNeedsAuthPrompt(false);
    
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/login') {
      setActiveTab('dashboard');
    }
  }, []);

  const handleEmailLogin = async (email: string, pass: string) => {
    if (email !== 'ykinwork1@gmail.com') {
      setAuthError('Unauthorized user. Only the system owner can access this portal.');
      return;
    }
    
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await loginWithEmail(email, pass);
      if (res) {
        setUser(res.user);
        setNeedsAuthPrompt(false);
        setAuthError(null);
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      console.error('Auth failed:', err);
      setAuthError(err?.message || String(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setActiveTab('landing');
  };

  const handleNavigation = (tab: string) => {
    setMobileMenuOpen(false);
    // Don't redirect while Firebase is still resolving the session
    if (authLoading) return;
    if (tab !== 'landing' && !user) {
      setNeedsAuthPrompt(true);
      setActiveTab('landing');
    } else {
      setActiveTab(tab);
      setNeedsAuthPrompt(false);
    }
  };

  // Add / Update Applications in state and sync with local filesystem
  const handleSaveApplication = async (newAppData: Omit<JobApplication, 'id'> & { id?: string }) => {
    try {
      const isEdit = !!newAppData.id;
      const endpoint = isEdit ? '/api/applications/update' : '/api/applications/create';
      const body = isEdit ? { id: newAppData.id, ...newAppData } : newAppData;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        await loadDatabase(); // reload full list & logs
        setIsAddingNewApp(false);
        setActiveFormApp(null);
      }
    } catch (err) {
      console.error('Failed to save application:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      const res = await fetch('/api/applications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await loadDatabase();
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const res = await fetch('/api/applications/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        await loadDatabase();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdateResume = async (updatedResume: ResumeData) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: updatedResume }),
      });
      if (res.ok) {
        await loadDatabase();
      }
    } catch (err) {
      console.error('Failed to save resume updates:', err);
    }
  };

  const handleUpdatePortfolio = async (updatedPortfolio: PortfolioProject[]) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: updatedPortfolio }),
      });
      if (res.ok) {
        await loadDatabase();
      }
    } catch (err) {
      console.error('Failed to save portfolio updates:', err);
    }
  };

  // Proxy to Backend Express Gemini AI model
  const handleParseResumeWithAI = async (rawText: string) => {
    try {
      const res = await fetch('/api/gemini/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: rawText }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleTriggerAIInterviewPrep = async (app: JobApplication) => {
    setAiPrepApp(app);
    setAiPrepQuestions(null);
    setIsGeneratingPrep(true);
    try {
      const res = await fetch('/api/gemini/suggest-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: app.company,
          position: app.position,
          notes: app.notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setAiPrepQuestions(data.suggestions);
      } else {
        toast({ variant: 'error', title: 'AI prep failed', description: data.error || 'Failed to generate prep questions.' });
      }
    } catch (err: any) {
      console.error('AI Prep error:', err);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  // Google Sheets Direct Client Integration via OAuth Access Token
  const handlePushToGoogleSheets = async () => {
    toast({ variant: 'info', title: 'Sheets sync unavailable', description: 'Google Sheets sync is disabled with Email/Password auth.' });
  };

  // Calculate unique companies in the database
  const uniqueCompaniesCount = new Set(applications.map((a) => a.company)).size;

  const isPublicRoute = activeTab === 'landing' || activeTab === 'login' || activeTab === 'projects' || activeTab === 'guestbook' || activeTab === 'blog';

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] font-sans antialiased">
      {/* 1. Global Header Navbar (Admin mode only) */}
      {!isPublicRoute && (
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-3 flex justify-between items-center z-10 sticky top-0" id="main-navigation-bar">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('landing')}>
              <span className="serif-header font-bold text-lg tracking-tight">Career Console</span>
              <span className="mono-text text-[9px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-semibold uppercase">
                PROD
              </span>
            </div>
          </div>
  
          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
  

  
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              id="mobile-menu-toggle-btn"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Menu Dropdown Panel - Only shown in CMS mode */}
      {!isPublicRoute && mobileMenuOpen && (
        <div className="md:hidden bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 space-y-3 z-10 sticky top-[53px] shadow-lg animate-in fade-in slide-in-from-top-4 duration-200" id="mobile-dropdown-menu">
          {/* Mobile User Status / Auth Action */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] mono-text text-zinc-400">TELEMETRY_SESSION: ACTIVE</span>
              <span className="text-xs font-bold mono-text text-zinc-800 dark:text-zinc-200">
                {user?.email?.split('@')[0] || 'ADMIN'}
              </span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center space-x-1 px-2 py-1 border border-red-200 dark:border-red-900/30 rounded text-[10px] mono-text text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
            >
              <LogOut size={12} />
              <span>DISCONNECT</span>
            </button>
          </div>

          <div className="flex flex-col space-y-1.5">
            <button
              onClick={() => handleNavigation('landing')}
              className="w-full text-left px-3 py-2 text-xs mono-text rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
            >
              PORTFOLIO PUBLIC PAGE
            </button>
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'dashboard' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              DASHBOARD OVERVIEW
            </button>
            <button
              onClick={() => handleNavigation('portfolio-manager')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'portfolio-manager' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              PORTFOLIO CONTENT CMS
            </button>
            <button
              onClick={() => handleNavigation('profile')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'profile' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              PROFILE UPDATE
            </button>
            <button
              onClick={() => handleNavigation('applications')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'applications' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              JOB TRACKER TABLE
            </button>
            <button
              onClick={() => handleNavigation('jobs')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'jobs' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              JOB SOURCING
            </button>
            <button
              onClick={() => handleNavigation('kanban')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'kanban' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              KANBAN PIPELINE
            </button>
            <button
              onClick={() => handleNavigation('resume')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'resume' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              LaTeX_RESUME BUILDER
            </button>
            <button
              onClick={() => handleNavigation('companies')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'companies' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              COMPANIES DATABASE
            </button>
            <button
              onClick={() => handleNavigation('documents')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'documents' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              ASSETS REPOSITORY
            </button>
            <button
              onClick={() => handleNavigation('admin')}
              className={`w-full text-left px-3 py-2 text-xs mono-text rounded transition-colors ${
                activeTab === 'admin' ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
              }`}
            >
              SYSTEM TELEMETRY LOGS
            </button>
          </div>
        </div>
      )}

      {/* 2. Main structure: we have a sidebar + main content wrapper if not on public routes */}
      <div className={`flex-1 flex ${isPublicRoute ? 'flex-col' : 'flex-row'}`}>
        
        {/* Admin Sidebar */}
        {!isPublicRoute && (
          <aside className="hidden md:flex flex-col w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4 shrink-0 h-[calc(100vh-53px)] sticky top-[53px]" id="desktop-cms-sidebar">
            <div className="space-y-6 flex-1">
              <div className="px-3">
                <span className="mono-text text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">CMS_NAVIGATION</span>
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => handleNavigation('landing')}
                  className="flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Public Portfolio</span>
                </button>
                <div className="border-t border-zinc-200 dark:border-zinc-800/60 my-2" />
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard Overview</span>
                </button>
                <button
                  onClick={() => handleNavigation('portfolio-manager')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'portfolio-manager'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Portfolio CMS</span>
                </button>

                <button
                  onClick={() => handleNavigation('blog-manager')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'blog-manager'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <FileText size={14} />
                  <span>Blog CMS</span>
                </button>
                <button
                  onClick={() => handleNavigation('applications')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'applications'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Table size={14} />
                  <span>Job Tracker</span>
                </button>
                <button
                  onClick={() => handleNavigation('jobs')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'jobs'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Job Sourcing</span>
                </button>
                <button
                  onClick={() => handleNavigation('kanban')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'kanban'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Kanban size={14} />
                  <span>Kanban Pipeline</span>
                </button>
                <button
                  onClick={() => handleNavigation('resume')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'resume'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <FileText size={14} />
                  <span>LaTeX Resume</span>
                </button>
                <button
                  onClick={() => handleNavigation('companies')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'companies'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Building2 size={14} />
                  <span>Companies DB</span>
                </button>
                <button
                  onClick={() => handleNavigation('documents')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'documents'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <FolderOpen size={14} />
                  <span>File Assets</span>
                </button>
                <button
                  onClick={() => handleNavigation('admin')}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 font-bold border border-zinc-300/60 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Database size={14} />
                  <span>System Logs</span>
                </button>
              </div>
            </div>
            {/* User card at bottom of sidebar */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex flex-col space-y-2">
              <div 
                onClick={() => handleNavigation('profile')}
                className="flex items-center justify-between px-3 py-2 mx-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 group"
              >
                <div className="flex items-center space-x-2">
                  {resume?.profileImage ? (
                    <img src={resume.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[80px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {resume?.name || user?.email?.split('@')[0] || 'ADMIN'}
                    </span>
                    <span className="text-[9px] mono-text text-zinc-400 truncate max-w-[80px]">
                      {resume?.title || 'System Owner'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('settings');
                    }}
                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    title="Settings"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Disconnect CMS Console"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>

              {/* Storage Tracker */}
              <div className="px-5 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="mono-text text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                    <Database size={10} /> S3 Storage
                  </span>
                  <span className="mono-text text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                    {storageUsageMb !== null ? `${storageUsageMb.toFixed(2)} MB` : '...'} / 50 MB
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${storageUsageMb && storageUsageMb > 40 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${storageUsageMb ? Math.min((storageUsageMb / 50) * 100, 100) : 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content View Port */}
        <main className={`flex-1 ${isPublicRoute ? 'w-full' : 'p-4 md:p-6'}`}>
          {isDbLoading ? (
            <div className="flex items-center justify-center min-h-[60vh] w-full">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-200 animate-spin" />
                </div>
                <span className="mono-text text-[10px] tracking-[0.2em] uppercase text-zinc-400">Initializing Console...</span>
              </div>
            </div>
          ) : (
          <>
          <Routes>
            <Route path="/" element={
              resume && (
                <LandingPortfolio
                  portfolio={portfolio}
                  resume={resume}
                  onEnterConsole={() => {
                    if (!authLoading && user) setActiveTab('dashboard');
                    else setActiveTab('login');
                  }}
                  isAuthenticated={!!user}
                />
              )
            } />
            
            <Route path="/projects" element={
              resume && (
                <ProjectsPage
                  portfolio={portfolio}
                  resume={resume}
                  onEnterConsole={() => {
                    if (!authLoading && user) setActiveTab('dashboard');
                    else setActiveTab('login');
                  }}
                  isAuthenticated={!!user}
                />
              )
            } />

            <Route path="/blog" element={
              resume && (
                <BlogList
                  resume={resume}
                  onEnterConsole={() => {
                    if (!authLoading && user) setActiveTab('dashboard');
                    else setActiveTab('login');
                  }}
                  isAuthenticated={!!user}
                />
              )
            } />

            <Route path="/blog/:slug" element={
              resume && (
                <BlogPost
                  resume={resume}
                  onEnterConsole={() => {
                    if (!authLoading && user) setActiveTab('dashboard');
                    else setActiveTab('login');
                  }}
                  isAuthenticated={!!user}
                />
              )
            } />

            <Route path="/guestbook" element={
              resume && (
                <Guestbook
                  resume={resume}
                  onEnterConsole={() => {
                    if (!authLoading && user) setActiveTab('dashboard');
                    else setActiveTab('login');
                  }}
                  isAuthenticated={!!user}
                />
              )
            } />
          </Routes>

          {/* 1b. DEDICATED ADMIN CMS LOGIN PAGE */}
          {activeTab === 'login' && (
            <div className="absolute inset-0 z-50 flex flex-col justify-center items-center px-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm" id="cms-dedicated-login-page">
              <div className="max-w-md w-full bg-white dark:bg-zinc-950 p-8 rounded border border-zinc-200 dark:border-zinc-800 space-y-6 text-center shadow-lg relative">
                
                {/* Back button and ThemeToggle */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <button
                    onClick={() => setActiveTab('landing')}
                    className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono"
                  >
                    <span>← PORTFOLIO</span>
                  </button>
                  <ThemeToggle />
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-center mx-auto text-zinc-700 dark:text-zinc-300 pb-2">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="serif-header text-2xl font-bold text-zinc-900 dark:text-zinc-50">Sign In</h2>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                    Sign in to manage your portfolio, track job applications, and update your resume.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <EmailAuthForm onLogin={handleEmailLogin} isLoading={isLoggingIn} />
                </div>

                {authError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 rounded text-left space-y-2 font-sans text-xs">
                    <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-400 font-semibold uppercase tracking-wider text-[10px] font-mono">
                      <XCircle size={14} />
                      <span>AUTHENTICATION_FAILED</span>
                    </div>
                    <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-normal font-mono">
                      {authError.includes('auth/invalid-credential')
                        ? 'Invalid email or password.'
                        : authError}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              applications={applications}
              logs={logs}
              onSelectTab={handleNavigation}
              onViewApplication={(app) => {
                setInspectedApp(app);
              }}
            />
          )}

          {/* 2b. PORTFOLIO MANAGER CMS VIEW */}
          {activeTab === 'portfolio-manager' && (
            <PortfolioManager
              portfolio={portfolio}
              onUpdatePortfolio={handleUpdatePortfolio}
            />
          )}

          {/* 2c. BLOG MANAGER CMS VIEW */}
          {activeTab === 'blog-manager' && (
            <BlogManager />
          )}

          {/* 2c-2. PROFILE EDITOR CMS VIEW */}
          {activeTab === 'profile' && (
            <ProfileEditor resume={resume} onUpdateResume={handleUpdateResume} />
          )}

          {/* 2d. JOB SOURCING CMS VIEW */}
          {activeTab === 'jobs' && (
            <JobBoard />
          )}

          {/* 3. TRACKER APPLICATION LIST TABLE */}
          {activeTab === 'applications' && (
            <>
              {isAddingNewApp || activeFormApp ? (
                <ApplicationForm
                  application={activeFormApp}
                  onSave={handleSaveApplication}
                  onCancel={() => {
                    setIsAddingNewApp(false);
                    setActiveFormApp(null);
                  }}
                />
              ) : (
                <ApplicationsTable
                  applications={applications}
                  onViewApplication={(app) => {
                    setInspectedApp(app);
                  }}
                  onEditApplication={(app) => {
                    setActiveFormApp(app);
                  }}
                  onDeleteApplication={handleDeleteApplication}
                  onAddNewClick={() => setIsAddingNewApp(true)}
                  onPushToGoogleSheets={handlePushToGoogleSheets}
                  isSyncingSheets={isSyncingSheets}
                  sheetsUrl={sheetsUrl}
                />
              )}
            </>
          )}

          {/* 4. KANBAN pipeline BOARD */}
          {activeTab === 'kanban' && (
            <InteractiveKanban
              applications={applications}
              onUpdateStatus={handleUpdateApplicationStatus}
              onViewApplication={(app) => {
                setInspectedApp(app);
              }}
              onDeleteApplication={handleDeleteApplication}
              onAddApplication={(status) => {
                setIsAddingNewApp(true);
                setActiveTab('applications');
              }}
            />
          )}

          {/* 5. RESUME BUILDER & LaTeX EXPORTER */}
          {activeTab === 'resume' && resume && (
            <ResumeBuilder
              resume={resume}
              onUpdateResume={handleUpdateResume}
              onParseWithAI={handleParseResumeWithAI}
            />
          )}

          {/* 2c-3. SETTINGS CMS VIEW */}
          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          {/* 6. COMPANIES DATABASE */}
          {activeTab === 'companies' && (
            <CompaniesManager externalCompanies={[]} onRefresh={loadDatabase} />
          )}

          {/* 7. ASSETS REPOSITORY (Documents) */}
          {activeTab === 'documents' && (
            <DocumentsManager onRefresh={loadDatabase} />
          )}

          {/* 8. ADMIN DASHBOARD & AUDIT LOGS */}
          {activeTab === 'admin' && (
            <div className="space-y-6" id="admin-dashboard-panel">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
                  <Database size={16} className="mr-2 text-zinc-500" />
                  Telemetry & Audit Logs
                </h3>
                <span className="mono-text text-[10px] text-zinc-500 block">
                  Audit Queue · {logs.length} entries
                </span>
              </div>

              <div className="bg-zinc-950 p-6 rounded border border-zinc-800 text-zinc-200 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="mono-text text-xs uppercase font-bold tracking-wider text-zinc-400">Audit Log History</span>
                  <span className="mono-text text-[10px] text-zinc-500">Format: Log Entry</span>
                </div>

                <div className="font-mono text-xs space-y-2.5 max-h-[450px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="border-b border-zinc-900 pb-2 flex flex-col md:flex-row md:justify-between md:items-start text-[11px] leading-relaxed">
                      <div className="space-y-0.5">
                        <p className="text-zinc-500">[{log.timestamp}]</p>
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">{log.module} //</span> {log.event}
                        </p>
                      </div>
                      <span className={`mt-1 md:mt-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest ${
                        log.status === 'SUCCESS' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </main>
      </div>

      {/* Inspect application modal overlay */}
      {inspectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto" id="inspect-modal-overlay">
          <div className="bg-white dark:bg-zinc-950 max-w-xl w-full rounded border border-zinc-200 dark:border-zinc-850 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-900 pb-3">
              <div>
                <span className="mono-text text-[8px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border text-zinc-500">
                  APPLICATION_METADATA
                </span>
                <h3 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-100 pt-1">
                  {inspectedApp.company}
                </h3>
                <p className="mono-text text-xs text-zinc-500">{inspectedApp.position}</p>
              </div>
              <button onClick={() => setInspectedApp(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-zinc-400 block text-[9px] uppercase">STATUS</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectedApp.status}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-400 block text-[9px] uppercase">PRIORITY</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectedApp.priority}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-400 block text-[9px] uppercase">SALARY</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectedApp.salary || 'N/A'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-400 block text-[9px] uppercase">APPLIED_DATE</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectedApp.appliedDate}</span>
              </div>
              {inspectedApp.interviewDate && (
                <div className="space-y-0.5 col-span-2 bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-400 block text-[9px] uppercase">INTERVIEW_DISPATCH_TIME</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{new Date(inspectedApp.interviewDate).toLocaleString()}</span>
                </div>
              )}
            </div>

            {inspectedApp.notes && (
              <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900/20 p-3.5 rounded border border-zinc-200 dark:border-zinc-800">
                <span className="mono-text text-[9px] text-zinc-400 block uppercase">ENGINEERING_NOTES</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {inspectedApp.notes}
                </p>
              </div>
            )}

            {/* AI Assistant dispatch helper */}
            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="mono-text text-[9px] text-zinc-400 uppercase font-bold flex items-center space-x-1">
                  <Sparkles size={10} className="text-amber-500" />
                  <span>GEMINI_AI_COPILOT</span>
                </span>
                <button
                  onClick={() => handleTriggerAIInterviewPrep(inspectedApp)}
                  disabled={isGeneratingPrep}
                  className="mono-text text-[9px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-2.5 py-1 rounded hover:opacity-85 disabled:opacity-50"
                >
                  {isGeneratingPrep ? 'GENERATING_PREP...' : 'PREPARE_INTERVIEW_PREP'}
                </button>
              </div>

              {aiPrepQuestions && (
                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-900 max-h-[220px] overflow-y-auto">
                  {aiPrepQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-start">
                        <span className="mono-text text-amber-500 mr-1.5">[Q{idx+1}]</span>
                        <span>{q.question}</span>
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400 italic pl-6">{q.hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedApp(null)}
                className="mono-text text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-2 border border-zinc-800 dark:border-zinc-200 rounded font-medium cursor-pointer"
              >
                CLOSE_METADATA_PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
