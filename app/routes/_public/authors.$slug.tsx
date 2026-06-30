import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { UserCircle, Globe, Github, Linkedin, Twitter } from 'lucide-react';
import { prisma } from '../../lib/db.server';
import { BLOG_STATUS } from '../../constants';
import fs from 'fs';
import path from 'path';

// Types for real data
interface AuthorProfile {
  slug: string;
  displayName: string;
  bio: string;
  avatar?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  stats: {
    articles: number;
    followers: number;
    following: number;
  };
  joinedDate: string;
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
}

interface AuthorProfileData {
  author: AuthorProfile | null;
  blogs: BlogPost[];
}

export async function loader({ params }: LoaderFunctionArgs): Promise<AuthorProfileData | Response> {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("Invalid slug", { status: 400 });
  }

  // Try to fetch author profile from database
  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: { user: true }
  });

  // If profile doesn't exist in database, create a placeholder from the slug
  // This allows the page to work even without a database profile
  let author: AuthorProfile;
  
  if (profile) {
    // Parse social links from JSON
    const socialLinks = profile.socialLinks as Record<string, string> | null;
    
    author = {
      slug: profile.slug,
      displayName: profile.displayName,
      bio: profile.bio || 'No biography provided.',
      avatar: profile.avatar || undefined,
      website: profile.website || undefined,
      github: socialLinks?.github || undefined,
      linkedin: socialLinks?.linkedin || undefined,
      twitter: socialLinks?.twitter || undefined,
      stats: {
        articles: 0, // Will be updated after fetching blogs
        followers: 0,
        following: 0,
      },
      joinedDate: profile.createdAt.toISOString(),
    };
  } else {
    // Create placeholder author from slug
    const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    author = {
      slug: slug,
      displayName: displayName,
      bio: 'No biography available.',
      avatar: undefined,
      website: undefined,
      github: undefined,
      linkedin: undefined,
      twitter: undefined,
      stats: {
        articles: 0, // Will be updated after fetching blogs
        followers: 0,
        following: 0,
      },
      joinedDate: new Date().toISOString(),
    };
  }

  // Load all published blogs from markdown files
  const dir = path.join(process.cwd(), 'content', 'blogs');
  
  let blogs: BlogPost[] = [];
  if (fs.existsSync(dir)) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const blogSlug = file.replace('.md', '');
        const markdown = await fs.promises.readFile(path.join(dir, file), 'utf8');
        
        const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const rawFrontmatter = match?.[1] || '';
        const fields: Record<string, string> = {};
        
        rawFrontmatter.split(/\r?\n/).forEach(line => {
          const sep = line.indexOf(':');
          if (sep !== -1) {
             fields[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
          }
        });

        // Include all published blogs (authorSlug matching is optional for now)
        if (!fields.status || fields.status === BLOG_STATUS.PUBLISHED) {
           blogs.push({
             slug: blogSlug,
             title: fields.title || 'Untitled',
             excerpt: fields.excerpt || '',
             date: fields.date || '',
             tags: fields.tags ? fields.tags.split(',').map(t => t.trim()) : []
           });
        }
      }
    }
  }

  // Sort blogs by date (newest first)
  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Update article count
  author.stats.articles = blogs.length;

  return {
    author,
    blogs,
  };
}

// Author Header Component
function AuthorHeader({ author }: { author: AuthorProfile }) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
          {author.avatar ? (
            <img src={author.avatar} alt={author.displayName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <UserCircle size={40} className="text-zinc-400" />
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-sans font-semibold text-zinc-900 dark:text-zinc-100">{author.displayName}</h2>
            <p className="text-xs font-mono text-zinc-500 mt-1">@{author.slug}</p>
          </div>

          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-7">
            {author.bio}
          </p>

          <div className="flex flex-wrap gap-3">
            {author.website && (
              <a href={author.website} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100">
                <Globe size={12} />
                <span>Website</span>
              </a>
            )}
            {author.github && (
              <a href={author.github} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <Github size={12} />
                <span>GitHub</span>
              </a>
            )}
            {author.linkedin && (
              <a href={author.linkedin} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <Linkedin size={12} />
                <span>LinkedIn</span>
              </a>
            )}
            {author.twitter && (
              <a href={author.twitter} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <Twitter size={12} />
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Blog Card Component
function BlogCard({ blog }: { blog: BlogPost }) {
  return (
    <Link 
      to={`/blog/${blog.slug}`}
      className="group flex flex-col space-y-3 border-b border-zinc-200 dark:border-zinc-800 py-6 first:pt-0 last:border-b-0"
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <h3 className="text-xl font-sans font-semibold text-zinc-950 dark:text-zinc-100 transition-colors md:w-2/3">
          <span className="link-underline group-link-underline">
            {blog.title}
          </span>
        </h3>
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 shrink-0 uppercase tracking-wider">
          <span>{new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
      
      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-7 font-sans line-clamp-2">
        {blog.excerpt}
      </p>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {blog.tags.map((tag) => (
            <span key={tag} className="font-mono text-[10px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="text-xs font-mono text-zinc-950 dark:text-zinc-100 uppercase tracking-wider">
          Read
        </div>
      </div>
    </Link>
  );
}


// Empty State Component
function EmptyState() {
  return (
    <div className="py-12 border-y border-zinc-200 dark:border-zinc-800">
      <p className="text-zinc-500 font-mono text-sm">This author hasn't published any articles yet.</p>
    </div>
  );
}

// 404 State Component
function NotFoundState() {
  return (
    <div className="py-16 border-y border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-sans font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Author Not Found</h2>
      <p className="text-zinc-500 font-mono text-sm mb-6">The author profile you're looking for doesn't exist.</p>
      <Link 
        to="/blog"
        className="link-underline inline-flex items-center gap-2 px-4 py-2 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 text-xs font-mono uppercase tracking-wider transition-colors hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900"
      >
        Browse All Articles
      </Link>
    </div>
  );
}

export default function AuthorProfilePage() {
  const { author, blogs } = useLoaderData<typeof loader>();

  // 404 state - when author doesn't exist
  if (!author) {
    return <NotFoundState />;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Author Profile
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-6">
            Learn more about the author and explore their published work.
          </p>
        </div>

        <AuthorHeader author={author} />
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            Published Articles
          </h3>
          <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
            {blogs.length} {blogs.length === 1 ? 'article' : 'articles'} published by this author
          </p>
        </div>
        
        {blogs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-0 pt-2">
            {blogs.map((blog) => (
              <BlogCard key={blog.slug} blog={blog} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
