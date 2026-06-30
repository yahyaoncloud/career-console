import { useState, useMemo } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { Search } from 'lucide-react';
import { loader as blogsApiLoader } from '../api.blogs';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    })
  ]);
}

export async function loader(args: LoaderFunctionArgs) {
  try {
    const res = await withTimeout(blogsApiLoader(args), 1200, { success: false, data: [] } as any);
    const result = res && typeof res.json === 'function' ? await res.json() : (res.data || res);
    return { blogs: result.success ? result.data : [] };
  } catch (error) {
    return { blogs: [] };
  }
}

export default function BlogListRoute() {
  const { blogs } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return blogs.filter((blog: any) => {
      return (
        blog.title.toLowerCase().includes(query) ||
        blog.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    });
  }, [blogs, searchQuery]);

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Engineering Journal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-6 max-w-2xl">
            Thoughts on cloud architecture, DevOps practices, and scaling distributed systems.
          </p>
        </div>

        <div className="relative mb-4 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="py-16 border-y border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 font-mono text-sm">
              {searchQuery ? `No articles found matching "${searchQuery}".` : 'No articles have been published yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-0 pt-2">
            {filteredBlogs.map((blog: any) => (
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
                    {new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
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
                  
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-zinc-500">
                    {blog.authorName && (
                      <div className="text-[11px] font-mono uppercase tracking-wider">
                        <span>{blog.authorName}</span>
                      </div>
                    )}
                    <div className="text-xs font-mono text-zinc-950 dark:text-zinc-100 uppercase tracking-wider">
                      Read
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
