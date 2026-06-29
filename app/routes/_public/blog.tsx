import { useState } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { BookOpen, Calendar, User, ArrowRight, Search } from 'lucide-react';
import { loader as blogsApiLoader } from '../api.blogs';

export async function loader(args: LoaderFunctionArgs) {
  try {
    const res = await blogsApiLoader(args);
    const result = await res.json();
    return { blogs: result.success ? result.data : [] };
  } catch (error) {
    return { blogs: [] };
  }
}

export default function BlogListRoute() {
  const { blogs } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlogs = blogs.filter((blog: any) => {
    const query = searchQuery.toLowerCase();
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.tags.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-sans font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <BookOpen size={20} className="text-zinc-400 dark:text-zinc-500" />
            Engineering Journal
          </h1>
          <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
            Thoughts on cloud architecture, DevOps practices, and scaling distributed systems.
          </p>
        </div>

        <div className="relative mb-8 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
          />
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 border-dashed">
            <p className="text-zinc-500 font-mono text-sm">
              {searchQuery ? `No articles found matching "${searchQuery}".` : 'No articles have been published yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pt-2">
            {filteredBlogs.map((blog: any) => (
              <Link 
                key={blog.slug} 
                to={`/blog/${blog.slug}`}
                className="group flex flex-col space-y-4 bg-zinc-50 dark:bg-zinc-950/40 p-6 rounded border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <h3 className="text-xl font-serif font-bold text-zinc-950 dark:text-zinc-100 transition-colors md:w-2/3">
                    <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[1.5px] after:bg-current after:origin-bottom-right after:scale-x-0 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out">
                      {blog.title}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 shrink-0 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-zinc-400" />
                      {new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans line-clamp-2">
                  {blog.excerpt}
                </p>
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-wrap gap-1.5">
                    {blog.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    {blog.authorName && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                        <User size={12} className="text-zinc-400" />
                        <span>{blog.authorName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                      Read <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
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
