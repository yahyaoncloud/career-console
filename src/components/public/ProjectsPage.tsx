import { PortfolioProject, ResumeData } from '../../types/types';
import PublicNavbar from './PublicNavbar';
import { ExternalLink, Github } from 'lucide-react';

interface ProjectsPageProps {
  portfolio: PortfolioProject[];
  resume: ResumeData;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

export default function ProjectsPage({ portfolio, resume, onEnterConsole, isAuthenticated }: ProjectsPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16" id="projects-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={onEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Featured Projects & Systems
          </h2>
          <p className="serif-header text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed font-light max-w-2xl">
            A deep dive into the operational systems, pipelines, and architecture I've built and scaled in production environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.map((project) => (
            <div
              key={project.id}
              className="group bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {project.title}
                </h3>
                <span className="mono-text text-xs bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 tracking-wider font-bold">
                  {project.category}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                {project.description}
              </p>
              
              {project.metrics && project.metrics.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-2">
                  {project.metrics.map((m, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="mono-text text-sm font-bold text-zinc-800 dark:text-zinc-200">{m.value}</span>
                      <span className="text-xs text-zinc-500 uppercase tracking-wide mono-text">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex space-x-2">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Github size={16} />
                    </a>
                  )}
                </div>
                {project.technologies && (
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span key={tech} className="mono-text text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="mono-text text-xs px-1.5 py-0.5 text-zinc-400">+{project.technologies.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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
