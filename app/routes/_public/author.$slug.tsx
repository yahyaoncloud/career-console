import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { prisma } from '../../lib/db.server';
import { BLOG_STATUS } from '../../constants';
import { UserCircle, Globe } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const profile = await prisma.profile.findUnique({
    where: { slug: params.slug },
    include: { user: true }
  });

  if (!profile) {
    throw new Response("Author not found", { status: 404 });
  }

  // Load all published blogs for this author
  const dir = path.join(process.cwd(), 'content', 'blogs');
  
  let blogs = [];
  if (fs.existsSync(dir)) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const slug = file.replace('.md', '');
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

        if (fields.authorId === profile.userId && fields.status === BLOG_STATUS.PUBLISHED) {
           blogs.push({
             slug,
             title: fields.title || 'Untitled',
             excerpt: fields.excerpt || '',
             date: fields.date || '',
             tags: fields.tags ? fields.tags.split(',').map(t => t.trim()) : []
           });
        }
      }
    }
  }

  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { profile, blogs };
}

export default function AuthorPublicProfile() {
  const { profile, blogs } = useLoaderData<typeof loader>();

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

        <div className="flex flex-col md:flex-row gap-5 items-start border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <UserCircle size={40} className="text-zinc-400" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-sans font-semibold text-zinc-900 dark:text-zinc-100">{profile.displayName}</h2>
                <p className="text-xs font-mono text-zinc-500 mt-1">@{profile.slug}</p>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-7">
                {profile.bio || 'No biography provided.'}
              </p>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100">
                  <Globe size={12} /> 
                  <span>Personal Website</span>
                </a>
              )}
            </div>
        </div>
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
          <div className="py-12 border-y border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 font-mono text-sm">This author hasn't published any articles yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-0 pt-2">
            {blogs.map((blog: any) => (
              <Link 
                key={blog.slug} 
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
                    {blog.tags.map((tag: string) => (
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
