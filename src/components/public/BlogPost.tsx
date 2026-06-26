import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ResumeData } from '../../types/types';
import PublicNavbar from './PublicNavbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { ChevronLeft, Check, Copy } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface BlogPostProps {
  resume: ResumeData;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const ImageRenderer = ({ node, src, alt, ...props }: any) => {
  return (
    <figure className="my-8 flex flex-col items-center">
      <img src={src} alt={alt} className="rounded-lg shadow-md max-h-[500px] object-cover" {...props} />
      {alt && <figcaption className="mt-2 text-center text-xs text-zinc-500 italic">{alt}</figcaption>}
    </figure>
  );
};

const CodeBlock = ({ node, inline, className, children, theme, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group rounded-md overflow-hidden my-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 py-2 bg-transparent border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs mono-text text-zinc-500 uppercase">{match[1]}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-teal-600 dark:text-teal-400" /> : <Copy size={14} />}
          </button>
        </div>
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, background: 'transparent' }}
          className="!m-0 !p-4 bg-transparent overflow-x-auto text-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }
  
  return (
    <code className={`${className} mono-text bg-transparent px-1 py-0.5 font-semibold text-sm`} {...props}>
      {children}
    </code>
  );
};

export default function BlogPost({ resume, onEnterConsole, isAuthenticated }: BlogPostProps) {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetch(`/api/blogs/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setContent(data.blog.content);
          setTitle(data.blog.title);
          setDate(data.blog.date);
          
          // Generate TOC
          const extractedToc: TocItem[] = [];
          const headingRegex = /^(#{2,3})\s+(.+)$/gm;
          let match;
          while ((match = headingRegex.exec(data.blog.content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            // Make sure this identically matches rehype-slug output format
            const id = slugify(text);
            extractedToc.push({ id, text, level });
          }
          setToc(extractedToc);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16" id="blog-post-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={onEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      {loading ? (
        <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
          <div className="h-10 bg-zinc-100 dark:bg-zinc-900 w-3/4 rounded"></div>
          <div className="h-4 bg-zinc-100 dark:bg-zinc-900 w-1/4 rounded"></div>
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded mt-8"></div>
        </div>
      ) : content ? (
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <article className="flex-1 min-w-0 space-y-8 max-w-3xl mx-auto lg:mx-0 w-full">
            <Link to="/blog" className="inline-flex items-center text-xs mono-text text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={14} className="mr-1" /> Back to Blog
            </Link>
            
            <header className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-8">
              <h1 className="serif-header text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {title}
              </h1>
              <div className="mono-text text-xs text-zinc-500 tracking-wider">
                {date}
              </div>
            </header>

            <div className="prose prose-zinc dark:prose-invert max-w-none serif-header font-light leading-relaxed prose-headings:font-bold prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                  code: (props) => <CodeBlock theme={resolvedTheme} {...props} />,
                  img: ImageRenderer
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>

          {/* Sticky TOC Sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="mono-text text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-bold mb-4 flex items-center">
                  Table of Contents
                </h3>
                <ul className="space-y-3 text-sm">
                  {toc.map((item, idx) => (
                    <li key={idx} style={{ marginLeft: `${(item.level - 2) * 1}rem` }}>
                      <a 
                        href={`#${item.id}`} 
                        className="text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 transition-colors block leading-tight serif-header font-light"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      ) : (
        <div className="text-center py-24 space-y-4">
          <h2 className="serif-header text-2xl font-bold text-zinc-900 dark:text-zinc-100">Post Not Found</h2>
          <p className="text-zinc-500 font-sans">The article you're looking for doesn't exist or was removed.</p>
          <Link to="/blog" className="inline-block mt-4 text-sm mono-text text-teal-600 dark:text-teal-400 hover:underline">
            Return to Blog
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-500 space-y-4 md:space-y-0 pb-16">
        <div className="space-y-1 text-center md:text-left">
          <p className="serif-header italic font-light">© {new Date().getFullYear()} {resume.name}. Built with React & Tailwind.</p>
        </div>
      </footer>
    </div>
  );
}
