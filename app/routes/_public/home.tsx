import React, { useMemo } from 'react';
import { type LoaderFunctionArgs, useLoaderData, Link } from 'react-router';
import { ArrowUpRight, Monitor, Code2, Server, Briefcase, Github, Linkedin, ExternalLink } from 'lucide-react';
import { getPublicUrl } from '~/lib/supabase';
import { loader as profileApiLoader } from '../api.profile';
import { loader as portfolioApiLoader } from '../api.portfolio';
import { TypingGreeting } from '../../components/hero/TypingGreeting';
import { ScribbleAnimation } from '../../components/hero/ScribbleAnimation';

export function meta() {
  return [
    { title: "Portfolio | yahyaoncloud" },
    { name: "description", content: "Cloud Engineer Portfolio & yahyaoncloud" },
  ];
}

export async function loader(args: LoaderFunctionArgs) {
  try {
    // Invoke API loaders directly to bypass SSR network layer issues
    const profileResponse = await profileApiLoader(args);
    const portfolioArgs = { ...args, request: new Request(new URL('/api/portfolio?limit=6', args.request.url).href) };
    const portfolioResponse = await portfolioApiLoader(portfolioArgs);

    const profileData = profileResponse && typeof profileResponse.json === 'function' 
      ? await profileResponse.json() 
      : (profileResponse.data || profileResponse);
      
    const portfolioData = portfolioResponse && typeof portfolioResponse.json === 'function' 
      ? await portfolioResponse.json() 
      : (portfolioResponse.data || portfolioResponse);

    const userWithProfile = profileData.success ? {
      name: profileData.data.user?.name || 'Yahya',
      profile: profileData.data
    } : null;

    const projects = portfolioData.success ? portfolioData.data : [];

    return {
      user: userWithProfile,
      projects
    };
  } catch (error: any) {
    console.error("Home loader API fetch error:", error);
    return {
      errorMsg: error.message || String(error),
      user: {
        name: 'Yahya',
        profile: {
          displayName: 'Yahya',
          bio: 'Building scalable infrastructure, serverless architectures, and automation pipelines.',
          avatar: '',
          showImage: true,
          socialLinks: {
            github: 'github.com/yahyaoncloud',
            linkedin: 'linkedin.com/in/yahyaoncloud'
          }
        }
      },
      projects: []
    };
  }
}


export default function PortfolioHome() {
  const { user, projects, errorMsg } = useLoaderData<typeof loader>();

  const showImage = user?.profile?.showImage ?? true; // Admin togglable feature flag
  const rawAvatar = user?.profile?.avatar;
  const avatar = rawAvatar ? getPublicUrl(rawAvatar) : 'https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/object/public/career-assets/avatars/avatar.jpeg'; // Fallback avatar
  const dbSocialLinks = user?.profile?.socialLinks as any;
  const socialLinks = dbSocialLinks && typeof dbSocialLinks === 'object' && Object.keys(dbSocialLinks).length > 0
    ? dbSocialLinks
    : { github: 'github.com/yahyaoncloud', linkedin: 'linkedin.com/in/yahyaoncloud' };

  const resume = user?.profile?.resume as any || {};

  const summaryParagraphs = resume.summary || [
    user?.profile?.bio || 'Building scalable infrastructure, serverless architectures, and automation pipelines for modern enterprises.'
  ];

  // Use seeded resume data, or fallback to mock data
  const technicalSkills = resume.technicalSkills || [
    { category: "Cloud & Ops", items: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Ansible"] },
    { category: "Languages", items: ["TypeScript", "Python", "Go", "Bash"] },
    { category: "Frameworks", items: ["React", "Node.js", "Express", "Next.js"] }
  ];

  const experience = resume.experience || [
    { role: "Cloud DevOps Engineer", company: "Tech Solutions Inc.", period: "2023 - Present", description: "Architecting cloud-native solutions, CI/CD pipelines, and infrastructure as code." },
    { role: "Systems Administrator", company: "Enterprise IT", period: "2021 - 2023", description: "Managed hybrid cloud infrastructure, Linux servers, and automated routine maintenance." }
  ];

  const certifications = resume.certifications || [];

  return (
    <div className="flex flex-col space-y-20 pb-10">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-xs p-4 rounded-sm">
          <strong>API Fetch Error:</strong> {errorMsg}
        </div>
      )}
      {/* HEADER SECTION (Hero + Summary) */}
      <section className="pt-8">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            {/* Avatar & Socials Column */}
            <div className="flex flex-col gap-4 items-center shrink-0">
              {showImage && avatar && (
                <div className="relative group mt-2">
                  <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 rounded-2xl rotate-3 transition-transform group-hover:rotate-6 z-0"></div>

                  {/* <ScribbleAnimation /> */}

                  <img
                    src={avatar}
                    alt="Profile"
                    className="relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-xl border border-white dark:border-zinc-950"
                  />
                </div>
              )}

              {/* Info Bento Column (Moved under avatar) */}
              <div className="w-44 z-20 sm:w-48 bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block text-center">
                  Links & Socials
                </span>
                <div className="space-y-2">
                  {socialLinks.github && (
                    <a
                      href={`https://${socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <span className="flex items-center relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                        <Github size={12} className="mr-1.5" /> GitHub
                      </span>
                      <ExternalLink size={10} className="opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={`https://${socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-mono transition-colors"
                    >
                      <span className="flex items-center relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                        <Linkedin size={12} className="mr-1.5" /> LinkedIn
                      </span>
                      <ExternalLink size={10} className="opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Column */}
            <div className="space-y-4 pt-2 z-10">
              <TypingGreeting />
              <div className="space-y-3">
                {summaryParagraphs.map((para: string, idx: number) => (
                  <p key={idx} className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed max-w-xl mx-auto sm:mx-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Resume Timeline View */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="font-mono text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-300 font-bold">
            Work Experience
          </h2>
        </div>
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
          {experience.map((job, idx) => (
            <div key={idx} className="relative pl-8 space-y-2 group">
              <div className="absolute left-3.5 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-zinc-200 -translate-x-1/2 group-hover:scale-125 transition-transform" />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-0.5">
                  <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
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
              <ul className="text-sm space-y-1.5 text-zinc-600 dark:text-zinc-300 pl-4 list-disc font-sans pt-1">
                <li className="leading-relaxed">
                  {job.description}
                </li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Core Technology Stack Bento */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="font-mono text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-300 font-bold">
            Skills & Technologies
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {technicalSkills.map((skillGroup, idx) => (
            <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold block">
                {skillGroup.category}
              </span>
              <div className="flex flex-wrap gap-1">
                {skillGroup.items.map(skill => (
                  <span key={skill} className="font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase">
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
            <h2 className="font-mono text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-300 font-bold">
              Certifications
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert: any, idx: number) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2 group">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
                    {cert.credlyLink ? (
                      <a href={cert.credlyLink} target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1 group/link">
                        <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover/link:after:origin-bottom-left group-hover/link:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                          {cert.name}
                        </span>
                        <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      cert.name
                    )}
                  </h3>
                  {cert.status === 'ongoing' && (
                    <span className="shrink-0 inline-flex items-center rounded-sm border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
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
          <h2 className="font-mono text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-300 font-bold">
            Featured Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-zinc-50 dark:bg-zinc-950/40 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 sm:space-y-1">
                  <span className="inline-block font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase font-bold">
                    {project.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-zinc-100 transition-colors">
                    <Link to={`/project/${project.id}`} className="group">
                      <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                        {project.title}
                      </span>
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

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech: string) => (
                  <span key={tech} className="font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase">
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
