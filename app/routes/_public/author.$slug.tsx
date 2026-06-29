import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { prisma } from '../../lib/db.server';
import { BLOG_STATUS } from '../../constants';
import { UserCircle, Globe, BookOpen } from 'lucide-react';
import { loader as blogsApiLoader } from './api.blogs'; // actually we can fetch blogs directly or use the api
import { requireUser } from '../../lib/auth.server';
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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-start bg-zinc-50 dark:bg-zinc-900 p-8 rounded border border-zinc-200 dark:border-zinc-800">
        <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={48} className="text-zinc-400" />
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">{profile.displayName}</h1>
            <p className="text-sm font-mono text-zinc-500 mt-1">@{profile.slug}</p>
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
            {profile.bio || 'No biography provided.'}
          </p>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
              <Globe size={14} /> 
              <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                Personal Website
              </span>
            </a>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <BookOpen size={20} className="text-zinc-400" /> Published Articles
        </h2>
        
        {blogs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
            This author hasn't published any articles yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog: any) => (
              <Link 
                key={blog.slug} 
                to={`/blog/${blog.slug}`}
                className="group p-6 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <h3 className="text-lg font-serif font-bold mb-2 group-hover:text-indigo-600 transition-colors w-fit">
                  <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                    {blog.title}
                  </span>
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">{blog.excerpt}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-mono text-zinc-500">{new Date(blog.date).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
