import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { ArrowLeft, Share2, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ROUTES } from '../../constants';
import { loader as blogSlugApiLoader } from '../api.blogs.$slug';

export async function loader(args: LoaderFunctionArgs) {
  const { slug } = args.params;
  if (!slug) throw new Response("Not Found", { status: 404 });

  try {
    const res = await blogSlugApiLoader(args);
    const result = res && typeof res.json === 'function' ? await res.json() : (res.data || res);

    if (!result.success) {
      throw new Response("Not Found", { status: 404 });
    }

    return {
      meta: result.data,
      content: result.data.content,
      url: args.request.url
    };
  } catch (err) {
    throw new Response("Not Found", { status: 404 });
  }
}

import { useToast } from '../../providers/ToastProvider';

export default function BlogPostRoute() {
  const { meta, content } = useLoaderData<typeof loader>();
  const { success } = useToast();

  // Extract headings for ToC (h2 and h3)
  const headings = content.match(/^#{2,3}\s+(.+)$/gm)?.map(h => {
    const level = h.match(/^#+/)?.[0].length || 2;
    const text = h.replace(/^#+\s+/, '');
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return { level, text, id };
  }) || [];

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: meta.title,
          text: meta.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

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
      <div className="max-w-3xl mx-auto">
        <Link to={ROUTES.PUBLIC.BLOG} className="link-underline inline-flex items-center space-x-2 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8 w-fit uppercase tracking-widest">
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>

        <header className="space-y-5 pb-8 border-b border-zinc-200 dark:border-zinc-800 mb-10">
          <div className="flex flex-wrap gap-2">
            {meta.tags.map(tag => (
              <span key={tag} className="font-mono text-[10px] px-2 py-0.5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <h1 className="text-3xl md:text-4xl font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight flex-1">
              {meta.title}
            </h1>
            <button
              onClick={handleShare}
              className="shrink-0 flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
              title="Share this post"
            >
              <Share2 size={16} />
              <span className="font-mono text-xs uppercase tracking-widest hidden sm:block">Share</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 font-mono pt-1 uppercase tracking-widest">
            {meta.authorName && (
              <div>
                <Link to={ROUTES.PUBLIC.AUTHOR(meta.authorSlug || meta.authorName.toLowerCase().replace(/\s+/g, '-'))} className="link-underline">
                  <span className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    {meta.authorName}
                  </span>
                </Link>
              </div>
            )}
            <div>
              <span>{new Date(meta.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

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
              h2: ({ node, ...props }) => {
                const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return <h2 id={id} style={{ scrollMarginTop: '120px' }} {...props} />;
              },
              h3: ({ node, ...props }) => {
                const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return <h3 id={id} style={{ scrollMarginTop: '120px' }} {...props} />;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      <aside className="hidden lg:flex flex-col gap-6 sticky mt-12 top-24 h-[calc(80vh-6rem)] overflow-y-auto pb-8 pr-2">
        {headings.length > 0 && (
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-5 space-y-4">
            <h3 className="text-xs font-mono text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
              <List size={14} className="text-zinc-500" /> Contents
            </h3>
            <ul className="space-y-2.5">
              {headings.map((h, i) => (
                <li key={i} className={`${h.level === 3 ? 'ml-4' : ''}`}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => scrollToHeading(e, h.id)}
                    className="link-underline text-sm font-sans text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors line-clamp-2 leading-snug w-fit block"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </aside>
    </div>
  );
}
