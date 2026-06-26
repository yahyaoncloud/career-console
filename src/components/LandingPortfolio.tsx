import { PortfolioProject, ResumeData } from '../types/types';
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, ChevronRight } from 'lucide-react';
import PublicNavbar from './public/PublicNavbar';

interface LandingPortfolioProps {
  portfolio: PortfolioProject[];
  resume: ResumeData;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

export default function LandingPortfolio({
  portfolio,
  resume,
  onEnterConsole,
  isAuthenticated,
}: LandingPortfolioProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16" id="landing-portfolio-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={onEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      {/* Profile Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-4">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            About Me
          </h2>
          <p className="serif-header text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed font-light">
            {resume.summary}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-300 mono-text">
              <MapPin size={12} className="mr-1.5" /> {resume.contact.location}
            </span>
            <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-300 mono-text">
              <Mail size={12} className="mr-1.5" /> {resume.contact.email}
            </span>
          </div>
        </div>

        {/* Info Bento Column */}
        <div className="bg-zinc-100 dark:bg-zinc-900 p-5 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
          <span className="mono-text text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
            Links & Socials
          </span>
          <div className="space-y-2.5">
            <a
              href={`https://${resume.contact.github}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white mono-text"
            >
              <span className="flex items-center"><Github size={12} className="mr-1.5" /> {resume.contact.github}</span>
              <ExternalLink size={10} />
            </a>
            <a
              href={`https://${resume.contact.linkedin}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white mono-text"
            >
              <span className="flex items-center"><Linkedin size={12} className="mr-1.5" /> {resume.contact.linkedin}</span>
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <span className="mono-text text-[10px] text-zinc-400 block mb-1">Certifications:</span>
            <ul className="text-sm space-y-1.5 text-zinc-600 dark:text-zinc-400 list-none pl-0">
              {resume.certifications.map((cert, index) => (
                <li key={index} className="flex items-start">
                  <ChevronRight size={10} className="mt-0.5 mr-1 text-zinc-400 flex-shrink-0" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Systems & Architecture Portfolio */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Featured Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {portfolio.map((project) => (
            <div
              key={project.id}
              className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="mono-text text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded uppercase font-bold">
                    {project.category}
                  </span>
                  <h3 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {project.title}
                  </h3>
                </div>
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <Github size={16} />
                  </a>
                )}
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                {project.description}
              </p>

              {project.architectureDiagram && (
                <div className="bg-zinc-100 dark:bg-black p-3.5 rounded border border-zinc-200 dark:border-zinc-900">
                  <span className="mono-text text-xs text-zinc-400 uppercase block mb-1.5">
                    Architecture Overview:
                  </span>
                  <pre className="mono-text text-xs text-zinc-500 dark:text-zinc-300 overflow-x-auto whitespace-pre">
                    {project.architectureDiagram}
                  </pre>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="mono-text text-xs bg-zinc-200/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="text-sm space-y-1 text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-sans">
                <span className="mono-text text-xs text-zinc-400 uppercase block">Details:</span>
                <p className="italic">{project.caseStudy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Technology Stack Bento */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Skills & Technologies
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Languages
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.languages.map((lang) => (
                <span key={lang} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Frameworks & APIs
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.frameworks.map((fw) => (
                <span key={fw} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {fw}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Cloud Infrastructure
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.cloud.map((c) => (
                <span key={c} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Diagnostics & Tools
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.tools.map((t) => (
                <span key={t} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Resume Timeline View */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Work Experience
          </h2>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
          {resume.experience.map((exp, index) => (
            <div key={index} className="relative pl-8 space-y-2 group">
              <div className="absolute left-3.5 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-200 -translate-x-1/2 group-hover:scale-125 transition-transform" />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-0.5">
                  <h3 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {exp.company}
                  </h3>
                  <p className="mono-text text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    {exp.role}
                  </p>
                </div>
                <span className="mono-text text-xs text-zinc-400 dark:text-zinc-505 mt-1 sm:mt-0">
                  {exp.period}
                </span>
              </div>
              <ul className="text-sm space-y-1.5 text-zinc-600 dark:text-zinc-300 pl-4 list-disc font-sans">
                {exp.highlights.map((highlight, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-500 space-y-4 md:space-y-0 pb-16">
        <div className="space-y-1 text-center md:text-left">
          <p className="serif-header italic font-light">© {new Date().getFullYear()} {resume.name}. Built with React & Tailwind.</p>
        </div>
        <div className="mono-text text-[10px] tracking-wider text-center md:text-right">
          All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
