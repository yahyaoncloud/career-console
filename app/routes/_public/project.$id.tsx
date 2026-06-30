import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { ArrowLeft, Github, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { prisma } from '../../lib/db.server';
import { ROUTES } from '../../constants';

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
    <div className="pb-16 lg:grid lg:grid-cols-[1fr_220px] lg:gap-10 items-start">
      <article className="min-w-0">
        <Link to={ROUTES.PUBLIC.HOME} className="link-underline inline-flex items-center space-x-2 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8 w-fit uppercase tracking-widest">
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>

        <header className="space-y-5 pb-8 border-b border-zinc-200 dark:border-zinc-800 mb-10">
          <div className="flex flex-wrap gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
              {project.category}
            </span>
            {project.techStack.map(tag => (
              <span key={tag} className="font-mono text-[10px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {project.title}
          </h1>
          
          <p className="text-base text-zinc-600 dark:text-zinc-400 font-sans leading-7">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 pt-2">
            {project.githubLink && (
              <a href={project.githubLink} target="_blank" rel="noreferrer" className="link-underline flex items-center gap-2 text-sm font-mono text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group">
                <Github size={16} /> 
                <span>Source Code</span>
              </a>
            )}
            {project.demoLink && (
              <a href={project.demoLink} target="_blank" rel="noreferrer" className="link-underline flex items-center gap-2 text-sm font-mono text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group">
                <ExternalLink size={16} /> 
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </header>

        {project.caseStudy ? (
          <div className="prose dark:prose-invert prose-zinc max-w-none font-sans 
            prose-headings:font-sans prose-headings:font-semibold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
            prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300
            prose-a:text-zinc-950 dark:prose-a:text-zinc-100 prose-a:underline
            prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold
            prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-zinc-200 dark:prose-code:border-zinc-800 prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm
            prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-sm
            prose-blockquote:border-l-2 prose-blockquote:border-l-zinc-300 dark:prose-blockquote:border-l-zinc-700 prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:not-italic prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400
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
          <div className="py-12 border-y border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">No detailed case study available.</p>
          </div>
        )}
      </article>

      {headings.length > 0 && (
        <aside className="hidden lg:block sticky top-24">
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              Contents
            </h3>
            <nav className="space-y-2">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  onClick={(e) => scrollToHeading(e, h.id)}
                  className={`link-underline block font-sans text-sm transition-colors hover:text-zinc-950 dark:hover:text-zinc-100 w-fit ${
                    h.level === 3 
                      ? 'pl-4 text-zinc-500 dark:text-zinc-400' 
                      : 'text-zinc-700 dark:text-zinc-300 font-medium'
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
