import React, { useState } from 'react';
import { ResumeData } from '../types/types';
import { FileText, Save, Sparkles, Copy, Download, History, RefreshCw, Eye, Edit3, Clipboard } from 'lucide-react';
import { useToast } from './ui/Toast';

interface ResumeBuilderProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  onParseWithAI: (rawText: string) => Promise<{
    success: boolean;
    name?: string;
    title?: string;
    summary?: string;
    criticism?: string[];
    formattedLaTeX?: string;
    atsScore?: number;
    error?: string;
  }>;
}

export default function ResumeBuilder({
  resume,
  onUpdateResume,
  onParseWithAI,
}: ResumeBuilderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'editor' | 'raw_parse' | 'latex_view'>('editor');
  const [rawResumeInput, setRawResumeInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiReport, setAiReport] = useState<{ atsScore?: number; criticism?: string[] } | null>(null);

  // Form states mapped locally
  const [name, setName] = useState(resume.name);
  const [title, setTitle] = useState(resume.title);
  const [summary, setSummary] = useState(resume.summary);
  const [languages, setLanguages] = useState(resume.skills.languages.join(', '));
  const [frameworks, setFrameworks] = useState(resume.skills.frameworks.join(', '));
  const [cloud, setCloud] = useState(resume.skills.cloud.join(', '));
  const [tools, setTools] = useState(resume.skills.tools.join(', '));

  // Generate dynamic LaTeX matching standard technical resume templates
  const generateLaTeX = (): string => {
    return `% ==========================================
% LATEX TEMPLATE: SENIOR SYSTEMS ENGINEER
% ==========================================
\\documentclass[letterpaper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{letterpaper, margin=0.75in}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{${name}}} \\\\ \\vspace{4pt}
    {\\large ${title}} \\\\ \\vspace{4pt}
    ${resume.contact.email} | ${resume.contact.location} \\\\
    GitHub: ${resume.contact.github} | LinkedIn: ${resume.contact.linkedin}
\\end{center}

\\vspace{10pt}

\\section*{Professional Summary}
${summary}

\\vspace{10pt}

\\section*{Technical Profiles}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\item \\textbf{Languages:} ${languages}
    \\item \\textbf{Frameworks/APIs:} ${frameworks}
    \\item \\textbf{Cloud Infrastructure:} ${cloud}
    \\item \\textbf{Diagnostics/Storage:} ${tools}
\\end{itemize}

\\vspace{10pt}

\\section*{Professional Chronology}
${resume.experience
  .map(
    (exp) => `\\textbf{${exp.company}} \\hfill ${exp.period} \\\\
\\textit{${exp.role}}
\\begin{itemize}[leftmargin=0.2in, topsep=2pt]
${exp.highlights.map((h) => `    \\item ${h}`).join('\n')}
\\end{itemize}
\\vspace{5pt}`
  )
  .join('\n')}

\\end{document}
`;
  };

  const [latexCode, setLatexCode] = useState(generateLaTeX());

  const handleCommitUpdates = () => {
    const updatedResume: ResumeData = {
      ...resume,
      name,
      title,
      summary,
      skills: {
        languages: languages.split(',').map((x) => x.trim()).filter(Boolean),
        frameworks: frameworks.split(',').map((x) => x.trim()).filter(Boolean),
        cloud: cloud.split(',').map((x) => x.trim()).filter(Boolean),
        tools: tools.split(',').map((x) => x.trim()).filter(Boolean),
      },
    };
    onUpdateResume(updatedResume);
    setLatexCode(generateLaTeX());
    toast({ variant: 'success', title: 'Resume saved', description: 'Changes committed and LaTeX recompiled.' });
  };

  const handleTriggerAIFormatter = async () => {
    if (!rawResumeInput.trim()) {
      toast({ variant: 'warning', title: 'No content', description: 'Paste a raw resume block first.' });
      return;
    }
    setIsParsing(true);
    try {
      const result = await onParseWithAI(rawResumeInput);
      if (result.success) {
        if (result.name) setName(result.name);
        if (result.title) setTitle(result.title);
        if (result.summary) setSummary(result.summary);
        if (result.formattedLaTeX) setLatexCode(result.formattedLaTeX);

        setAiReport({
          atsScore: result.atsScore,
          criticism: result.criticism,
        });
        setActiveTab('latex_view');
        toast({ variant: 'success', title: 'AI parse complete', description: 'Resume normalized and converted to LaTeX.' });
      } else {
        toast({ variant: 'error', title: 'AI parse failed', description: result.error || 'Unknown error.' });
      }
    } catch (err: any) {
      toast({ variant: 'error', title: 'Model error', description: err.message });
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyLaTeX = () => {
    navigator.clipboard.writeText(latexCode);
    toast({ variant: 'success', title: 'Copied to clipboard', description: 'LaTeX source is ready to paste.' });
  };

  return (
    <div className="space-y-6" id="resume-builder-module">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            <FileText size={16} className="mr-2 text-zinc-500" />
            LaTeX Resume Builder
          </h3>
          <span className="mono-text text-[10px] text-zinc-500 block">
            Technical Template Formatting · System v1.0
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-250 dark:bg-zinc-900 p-0.5 rounded border border-zinc-200 dark:border-zinc-800 justify-between sm:justify-start">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 text-xs mono-text rounded transition-colors cursor-pointer ${
              activeTab === 'editor' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium' : 'text-zinc-500'
            }`}
          >
            Edit Fields
          </button>
          <button
            onClick={() => setActiveTab('raw_parse')}
            className={`px-3 py-1 text-xs mono-text rounded transition-colors cursor-pointer flex items-center space-x-1 ${
              activeTab === 'raw_parse' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium' : 'text-zinc-500'
            }`}
          >
            <Sparkles size={11} />
            <span>AI Formatter</span>
          </button>
          <button
            onClick={() => setActiveTab('latex_view')}
            className={`px-3 py-1 text-xs mono-text rounded transition-colors cursor-pointer ${
              activeTab === 'latex_view' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium' : 'text-zinc-500'
            }`}
          >
            LaTeX Code
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Panel: Form fields */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Candidate Details
            </span>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Target Professional Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Executive Summary Profile</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>
            </div>

            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block pt-2 border-t border-zinc-150 dark:border-zinc-900">
              Technical Skill Fields
            </span>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Languages (comma separated)</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Frameworks/APIs (comma separated)</label>
                <input
                  type="text"
                  value={frameworks}
                  onChange={(e) => setFrameworks(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Cloud Providers</label>
                <input
                  type="text"
                  value={cloud}
                  onChange={(e) => setCloud(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mono-text text-[10px] text-zinc-400 uppercase">Diagnostics/Tools</label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleCommitUpdates}
                className="flex items-center space-x-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-2 border border-zinc-800 dark:border-zinc-205 rounded text-xs mono-text font-medium cursor-pointer hover:opacity-85"
              >
                <Save size={12} />
                <span>Save and Recompile</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Rendered HTML representation of resume */}
          <div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6">
            <span className="mono-text text-[9px] text-zinc-400 uppercase tracking-widest block">
              Form Data Preview
            </span>

            <div className="bg-white dark:bg-zinc-950 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm font-sans text-xs max-h-[600px] overflow-y-auto">
              <div className="text-center space-y-1 border-b border-zinc-150 dark:border-zinc-900 pb-4">
                <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-100">{name}</h2>
                <p className="mono-text text-zinc-500 uppercase">{title}</p>
                <p className="mono-text text-[10px] text-zinc-400">
                  {resume.contact.email} • {resume.contact.location}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="mono-text text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-0.5">
                  Summary
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 italic">{summary}</p>
              </div>

              <div className="space-y-2">
                <h3 className="mono-text text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-0.5">
                  Technical Profiles
                </h3>
                <ul className="list-none pl-0 space-y-1 text-zinc-700 dark:text-zinc-300 mono-text text-[11px]">
                  <li><strong>Languages:</strong> {languages}</li>
                  <li><strong>Frameworks:</strong> {frameworks}</li>
                  <li><strong>Cloud:</strong> {cloud}</li>
                  <li><strong>Tools:</strong> {tools}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="mono-text text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-0.5">
                  Chronology
                </h3>
                {resume.experience.map((exp, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                      <span className="serif-header">{exp.company}</span>
                      <span className="mono-text text-[10px] text-zinc-400">{exp.period}</span>
                    </div>
                    <p className="mono-text text-[10px] text-zinc-500 uppercase">{exp.role}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      {exp.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'raw_parse' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-950 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="space-y-1">
              <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
                Paste Raw Resume Content
              </span>
              <p className="text-xs text-zinc-500">
                Paste any unstructured text resume, plain ASCII, PDF copy, or raw Markdown. Gemini will automatically extract credentials, normalize technical key-terms, convert metrics to high impact highlights, and structure a LaTeX layout.
              </p>
            </div>

            <textarea
              value={rawResumeInput}
              onChange={(e) => setRawResumeInput(e.target.value)}
              rows={12}
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              placeholder="Paste raw resume text here..."
            />

            <div className="flex justify-between items-center">
              <span className="mono-text text-[10px] text-zinc-400">Engine: gemini-2.5-flash (auto-fallback)</span>
              <button
                onClick={handleTriggerAIFormatter}
                disabled={isParsing}
                className="flex items-center space-x-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-2 border border-zinc-800 dark:border-zinc-200 rounded text-xs mono-text font-medium cursor-pointer hover:opacity-85 disabled:opacity-50"
              >
                <Sparkles size={12} className={isParsing ? 'animate-spin' : ''} />
                <span>{isParsing ? 'Formatting LaTeX Layout...' : 'Format with AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'latex_view' && (
        <div className="bg-zinc-950 p-5 rounded border border-zinc-800 space-y-4 text-zinc-100 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <div>
              <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
                LaTeX Document Code
              </span>
              <span className="mono-text text-[8px] text-zinc-500 block">Encoding: UTF-8 · Style: Academic</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCopyLaTeX}
                className="flex items-center space-x-1 p-1 px-2.5 rounded border border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white mono-text"
              >
                <Copy size={11} />
                <span>Copy Code</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] p-4 bg-black rounded border border-zinc-900 text-zinc-300 whitespace-pre scrollbar-thin scrollbar-thumb-zinc-800">
              {latexCode}
            </pre>
          </div>

          {aiReport && (
            <div className="bg-zinc-900 p-4 rounded border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="mono-text text-[10px] text-amber-500 font-bold uppercase">ATS Analysis & Recommendations</span>
                {aiReport.atsScore && (
                  <span className="mono-text text-xs bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/50">
                    ATS SCORE: {aiReport.atsScore}/100
                  </span>
                )}
              </div>
              {aiReport.criticism && (
                <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4 font-mono">
                  {aiReport.criticism.map((crit, idx) => (
                    <li key={idx} className="leading-relaxed">{crit}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
