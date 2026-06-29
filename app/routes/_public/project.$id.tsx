import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { ArrowLeft, Calendar, Github, ExternalLink, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { prisma } from '../../lib/db.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) throw new Response("Not Found", { status: 404 });
  
  const project = await prisma.portfolio.findUnique({
    where: { id }
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }

  return { project };
}

export default function ProjectDetailRoute() {
  const { project } = useLoaderData<typeof loader>();

  // Extract headings for ToC (h2 and h3) from case study if it exists
  const headings = project.caseStudy?.match(/^#{2,3}\s+(.+)$/gm)?.map(h => {
    const level = h.match(/^#+/)?.[0].length || 2;
    const text = h.replace(/^#+\s+/, '');
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return { level, text, id };
  }) || [];

  const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="pb-24 lg:grid lg:grid-cols-[1fr_260px] lg:gap-10 items-start">
      <article className="min-w-0">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group mb-10 w-fit">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="uppercase tracking-widest font-bold relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">Back</span>
        </Link>

        <header className="space-y-6 pb-8 border-b border-zinc-200 dark:border-zinc-800 mb-10">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase font-bold">
              {project.category}
            </span>
            {project.techStack.map(tag => (
              <span key={tag} className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {project.title}
          </h1>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4">
            {project.githubLink && (
              <a href={project.githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-mono text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group">
                <Github size={16} /> 
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">Source Code</span>
              </a>
            )}
            {project.demoLink && (
              <a href={project.demoLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-mono text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors group">
                <ExternalLink size={16} /> 
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">Live Demo</span>
              </a>
            )}
          </div>
        </header>

        {project.caseStudy ? (
          <div className="prose dark:prose-invert prose-zinc max-w-none font-sans 
            prose-headings:font-serif prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
            prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300
            prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold
            prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:border prose-code:border-zinc-200 dark:prose-code:border-zinc-800 prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm
            prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-sm
            prose-blockquote:border-l-2 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-zinc-50 dark:prose-blockquote:bg-zinc-900/50 prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:rounded-r-sm prose-blockquote:not-italic prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400
            prose-img:rounded-sm prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-800"
          >
            <ReactMarkdown
              components={{
                h2: ({node, ...props}) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h2 id={id} style={{ scrollMarginTop: '120px' }} {...props} />;
                },
                h3: ({node, ...props}) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h3 id={id} style={{ scrollMarginTop: '120px' }} {...props} />;
                },
              }}
            >
              {project.caseStudy}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">No detailed case study available.</p>
          </div>
        )}
      </article>

      {/* Table of Contents Sidebar */}
      {headings.length > 0 && (
        <aside className="hidden lg:block sticky top-24">
          <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-sm p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-900 dark:text-zinc-100 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Contents
            </h3>
            <nav className="space-y-2">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  onClick={(e) => scrollToHeading(e, h.id)}
                  className={`block font-sans text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 group w-fit ${
                    h.level === 3 
                      ? 'pl-4 text-zinc-500 dark:text-zinc-400' 
                      : 'text-zinc-700 dark:text-zinc-300 font-medium'
                  }`}
                >
                  <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                    {h.text}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
