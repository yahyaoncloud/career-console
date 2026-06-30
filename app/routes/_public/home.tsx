import React from 'react';
import { type LoaderFunctionArgs, useLoaderData, Link } from 'react-router';
import { Github, Linkedin, ExternalLink, Mail, Instagram, X } from 'lucide-react';
import { getPublicUrl } from '~/lib/supabase';
import { getPublicProfile } from '../../services/profile.server';
import { listPublicPortfolio } from '../../services/portfolio.server';
import { getCache, setCache, CACHE_TTL } from '~/lib/cache.server';

interface LoaderData {
  user: {
    name: string;
    profile: any;
  } | null;
  projects: any[];
  errorMsg?: string;
}

export function meta() {
  return [
    { title: "Portfolio | yahyaoncloud" },
    { name: "description", content: "Cloud Engineer Portfolio & yahyaoncloud" },
  ];
}

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  console.log("=== HOME LOADER STARTED ===");

  const CACHE_KEY_PROFILE = 'public:profile';
  const CACHE_KEY_PROJECTS = 'public:projects';

  // Temporarily disable cache for debugging
  // const cachedProfile = getCache<any>(CACHE_KEY_PROFILE);
  // const cachedProjects = getCache<any[]>(CACHE_KEY_PROJECTS);

  let profile: any = null;
  let projects: any[] = [];

  // Fetch fresh data directly
  const [profileResult, projectsResult] = await Promise.allSettled([
    getPublicProfile(),
    listPublicPortfolio({ limit: 6 }),
  ]);

  console.log("Profile result:", profileResult);
  console.log("Projects result:", projectsResult);

  profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  projects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];

  // Cache the results
  // if (profile) {
  //   setCache(CACHE_KEY_PROFILE, profile, CACHE_TTL.LONG);
  // }
  // if (projects && projects.length > 0) {
  //   setCache(CACHE_KEY_PROJECTS, projects, CACHE_TTL.MEDIUM);
  // }

  console.log("Final profile:", profile);
  console.log("Final projects:", projects);

  return {
    user: profile ? {
      name: profile.user?.name || 'Yahya',
      profile,
    } : null,
    projects: projects || [],
    errorMsg: (!projects || projects.length === 0) ? 'No projects found' : undefined,
  };
}


export default function PortfolioHome() {
  const loaderData = useLoaderData<typeof loader>();
  const { user, projects, errorMsg } = loaderData;
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isImageViewerOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsImageViewerOpen(false);
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isImageViewerOpen]);

  const showImage = user?.profile?.showImage ?? true; // Admin togglable feature flag
  const rawAvatar = user?.profile?.avatar;
  const avatar = rawAvatar ? getPublicUrl(rawAvatar) : 'https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/object/public/career-assets/avatars/avatar.jpeg'; // Fallback avatar
  const dbSocialLinks = user?.profile?.socialLinks as any;
  const socialLinks = dbSocialLinks && typeof dbSocialLinks === 'object' && Object.keys(dbSocialLinks).length > 0
    ? dbSocialLinks
    : {};

  const resume = user?.profile?.resume as any || {};

  const summaryParagraphs = resume.summary || user?.profile?.bio ? [user?.profile?.bio] : [];

  const technicalSkills = resume.technicalSkills || [];
  const experience = resume.experience || [];

  const certifications = resume.certifications || [];

  return (
    <div className="flex flex-col space-y-14 pb-8">
      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-xs p-4 rounded-sm">
          <strong>Loading profile data...</strong> Please check back later.
        </div>
      )}
      {/* HEADER SECTION (Hero + Summary) */}
      <section className="pt-4">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-row sm:flex-col gap-4 items-center shrink-0">
              {showImage && avatar && (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-sm object-cover border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:opacity-90 transition-opacity"
                  width={144}
                  height={144}
                  decoding="async"
                  fetchPriority="high"
                  onClick={() => setIsImageViewerOpen(true)}
                />
              )}

              <div className="space-y-2">
                  {socialLinks.github && (
                    <a
                      href={`https://${socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <Github size={13} /> GitHub
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={`https://${socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                  {socialLinks.email && (
                    <a
                      href={socialLinks.email.startsWith('mailto:') ? socialLinks.email : `mailto:${socialLinks.email}`}
                      className="link-underline flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={`https://${socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <Instagram size={13} /> Instagram
                    </a>
                  )}
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Cloud Engineer
                </p>
                <h1 className="text-3xl sm:text-4xl font-sans font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {user?.profile?.displayName || user?.name || 'Yahya'}
                </h1>
              </div>
              <div className="space-y-3">
                {summaryParagraphs.map((para: string, idx: number) => (
                  <p 
                    key={idx} 
                    className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans leading-7 max-w-2xl"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Viewer Modal */}
      {isImageViewerOpen && avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageViewerOpen(false);
              }}
              aria-label="Close image viewer"
            >
              <X size={24} />
            </button>
            <img
              src={avatar}
              alt="Profile"
              className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            Work Experience
          </h2>
        </div>
        <div className="space-y-6">
          {experience.map((job, idx) => (
            <div 
              key={idx} 
              className="space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-0.5">
                  <h3 className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {job.company}
                  </h3>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    {job.role}
                  </p>
                </div>
                <span className="font-mono text-xs text-zinc-400 mt-1 sm:mt-0">
                  {job.period}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-7 font-sans">
                {job.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            Skills & Technologies
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {technicalSkills.map((skillGroup, idx) => (
            <div 
              key={idx} 
              className="space-y-2"
            >
              <span className="font-mono text-xs text-zinc-500 uppercase block">
                {skillGroup.category}
              </span>
              <div className="flex flex-wrap gap-1">
                {skillGroup.items.map(skill => (
                  <span key={skill} className="font-mono text-sm px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
              Certifications
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert: any, idx: number) => (
              <div 
                key={idx} 
                className="border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 group"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-sans font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
                    {cert.credlyLink ? (
                      <a href={cert.credlyLink} target="_blank" rel="noreferrer" className="link-underline hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1 group/link">
                        <span>{cert.name}</span>
                        <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      cert.name
                    )}
                  </h3>
                  {cert.status === 'ongoing' && (
                    <span className="shrink-0 inline-flex items-center border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Ongoing
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 mt-auto">
                  <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {cert.brand}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                    {cert.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Featured Projects */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            Featured Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project: any, idx: number) => (
            <div 
              key={project.id} 
              className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-4 last:border-b-0"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 sm:space-y-1">
                  <span className="inline-block font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                    {project.category}
                  </span>
                  <h3 className="font-sans text-xl font-semibold text-zinc-950 dark:text-zinc-100 transition-colors">
                    <Link to={`/project/${project.id}`} className="link-underline">
                      <span>{project.title}</span>
                    </Link>
                  </h3>
                </div>
                <div className="flex items-center gap-3 sm:gap-2">
                  {project.githubLink && (
                    <a href={project.githubLink} target="_blank" rel="noreferrer" className="p-1 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                      <Github size={16} />
                    </a>
                  )}
                  {project.demoLink && (
                    <a href={project.demoLink} target="_blank" rel="noreferrer" className="p-1 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-7 font-sans">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech: string) => (
                  <span key={tech} className="font-mono text-[10px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-zinc-500 italic">No projects found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
