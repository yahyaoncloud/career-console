import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import fs from 'fs';
import path from 'path';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Heading } from '../../components/ui/Heading';
import ReactMarkdown from 'react-markdown';

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs');

interface BlogPostMeta {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  authorName?: string;
}

const parseMarkdown = (markdown: string): { meta: BlogPostMeta; content: string } => {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const rawFrontmatter = match?.[1] || '';
  const content = match?.[2] || markdown;
  const fields: Record<string, string> = {};

  rawFrontmatter.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator === -1) return;
    const key = line.trim().slice(0, separator).trim();
    const value = line.trim().slice(separator + 1).trim();
    if (key) fields[key] = value;
  });

  return {
    meta: {
      title: fields.title || 'Untitled',
      date: fields.date || '',
      excerpt: fields.excerpt || '',
      tags: fields.tags ? fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      authorName: fields.authorName || '',
    },
    content
  };
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;
  if (!slug || !/^[\w -]+$/.test(slug)) {
    throw new Response("Not Found", { status: 404 });
  }

  const filePath = path.join(BLOGS_DIR, `${slug}.md`);
  
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const { meta, content } = parseMarkdown(fileContent);
    return { meta, content };
  } catch (err) {
    throw new Response("Not Found", { status: 404 });
  }
}

export default function BlogPostRoute() {
  const { meta, content } = useLoaderData<typeof loader>();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-500">
      <Link to="/blog" className="inline-flex items-center space-x-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to writings</span>
      </Link>

      <header className="space-y-6 pb-8 border-b border-border">
        <div className="flex flex-wrap gap-2 mb-4">
          {meta.tags.map(tag => (
            <span key={tag} className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        
        <Heading variant="h1" className="font-serif leading-tight">
          {meta.title}
        </Heading>
        
        <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground font-mono">
          {meta.authorName && (
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>{meta.authorName}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Calendar size={16} />
            <span>{new Date(meta.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-serif prose-h1:text-3xl prose-h2:text-2xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </article>
  );
}
