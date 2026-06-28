import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import fs from 'fs';
import path from 'path';
import { FileText } from 'lucide-react';
import { Heading } from '../../components/ui/Heading';
import { Card } from '../../components/ui/Card';

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs');

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  authorName?: string;
}

const parseFrontmatter = (markdown: string): Omit<BlogPostMeta, 'slug'> => {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const rawFrontmatter = match?.[1] || '';
  const fields: Record<string, string> = {};

  rawFrontmatter.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator === -1) return;
    const key = line.trim().slice(0, separator).trim();
    const value = line.trim().slice(separator + 1).trim();
    if (key) fields[key] = value;
  });

  return {
    title: fields.title || 'Untitled',
    date: fields.date || '',
    excerpt: fields.excerpt || '',
    tags: fields.tags ? fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    authorName: fields.authorName || '',
  };
};

export async function loader() {
  let blogs: BlogPostMeta[] = [];
  
  try {
    if (fs.existsSync(BLOGS_DIR)) {
      const files = await fs.promises.readdir(BLOGS_DIR);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const slug = file.replace('.md', '');
          const markdown = await fs.promises.readFile(path.join(BLOGS_DIR, file), 'utf8');
          const meta = parseFrontmatter(markdown);
          blogs.push({ slug, ...meta });
        }
      }
    }
  } catch (err) {
    console.error("Error reading blogs:", err);
  }

  // Sort by date descending
  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { blogs };
}

export default function BlogListRoute() {
  const { blogs } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="space-y-2 border-b border-border pb-8">
          <Heading variant="h1" className="font-serif italic font-light tracking-tight flex items-center">
            <FileText className="mr-3 text-muted-foreground" size={32} />
            Writings
          </Heading>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest pt-2">
            Thoughts, Guides & Case Studies
          </p>
        </div>

        {blogs.length === 0 ? (
          <p className="text-muted-foreground py-8">No articles have been published yet.</p>
        ) : (
          <div className="space-y-6 pt-6">
            {blogs.map((blog) => (
              <Card key={blog.slug} className="group overflow-hidden bg-transparent border-transparent hover:border-border transition-colors duration-300">
                <Link to={`/blog/${blog.slug}`} className="block p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 gap-2">
                    <h3 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className="text-foreground opacity-80 leading-relaxed mb-4">
                    {blog.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <span key={tag} className="font-mono text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {blog.authorName && (
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        By {blog.authorName}
                      </span>
                    )}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
