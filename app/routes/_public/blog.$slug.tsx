import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { ArrowLeft, Calendar, User, Tag, Share2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { loader as blogSlugApiLoader } from '../api.blogs.$slug';
import { loader as blogsApiLoader } from '../api.blogs';

export async function loader(args: LoaderFunctionArgs) {
  const { slug } = args.params;
  if (!slug) throw new Response("Not Found", { status: 404 });

  try {
    const res = await blogSlugApiLoader(args);
    const result = await res.json();

    if (!result.success) {
      throw new Response("Not Found", { status: 404 });
    }

    // Fetch next blog suggestion
    let nextBlog = null;
    try {
      const allBlogsRes = await blogsApiLoader(args);
      const allBlogsResult = await allBlogsRes.json();
      if (allBlogsResult.success && allBlogsResult.data.length > 0) {
        const otherBlogs = allBlogsResult.data.filter((b: any) => b.slug !== slug);
        if (otherBlogs.length > 0) {
          nextBlog = otherBlogs[0];
        }
      }
    } catch (e) {
      console.warn("Could not fetch next blog suggestion");
    }

    return {
      meta: result.data,
      content: result.data.content,
      nextBlog,
      url: args.request.url
    };
  } catch (err) {
    throw new Response("Not Found", { status: 404 });
  }
}

import { Sparkles, List, Share2, ArrowRight } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

export default function BlogPostRoute() {
  const { meta, content, nextBlog, url } = useLoaderData<typeof loader>();
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
    <div className="pb-24 lg:grid lg:grid-cols-[1fr_260px] lg:gap-10 items-start">
      <article className="min-w-0">
        <Link to="/blog" className="inline-flex items-center space-x-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group mb-10 w-fit">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="uppercase tracking-widest font-bold relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">Back</span>
        </Link>

        <header className="space-y-6 pb-8 border-b border-zinc-200 dark:border-zinc-800 mb-10">
          <div className="flex flex-wrap gap-2">
            {meta.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-sm uppercase tracking-wider font-bold">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight flex-1">
              {meta.title}
            </h1>
            <button
              onClick={handleShare}
              className="shrink-0 flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit group"
              title="Share this post"
            >
              <Share2 size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest hidden sm:block">Share</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-zinc-500 font-mono pt-2 uppercase tracking-widest">
            {meta.authorName && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-zinc-400" />
                <Link to={`/author/${meta.authorSlug || meta.authorName.toLowerCase().replace(/\s+/g, '-')}`} className="group relative">
                  <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold transition-colors">
                    {meta.authorName}
                  </span>
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-zinc-400" />
              <span>{new Date(meta.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

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

        {/* Next Blog Suggestion */}
        {nextBlog && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-4">
              Read Next
            </span>
            <Link
              to={`/blog/${nextBlog.slug}`}
              className="group block p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 transition-all duration-300"
            >
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {nextBlog.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {nextBlog.excerpt}
                  </p>
                </div>
                <div className="shrink-0 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors group-hover:translate-x-1 duration-300">
                  <ArrowRight size={24} />
                </div>
              </div>
            </Link>
          </div>
        )}
      </article>

      {/* Sticky Right Sidebar */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-8 pr-2">
        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-sm p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
              <List size={14} className="text-zinc-500" /> Contents
            </h3>
            <ul className="space-y-2.5">
              {headings.map((h, i) => (
                <li key={i} className={`${h.level === 3 ? 'ml-4' : ''}`}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => scrollToHeading(e, h.id)}
                    className="text-sm font-sans text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 leading-snug group w-fit block"
                  >
                    <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                      {h.text}
                    </span>
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
