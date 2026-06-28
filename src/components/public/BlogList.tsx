import { authFetch } from '../../lib/api';
import { useState, useEffect } from 'react';
import { ResumeData } from '../../types/types';
import PublicNavbar from './PublicNavbar';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Container } from '../ui/Container';
import { Heading } from '../ui/Heading';
import { Helmet } from 'react-helmet-async';

interface BlogListProps {
  resume: ResumeData;
  onEnterConsole: () => void;
  isAuthenticated: boolean;
}

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export default function BlogList({ resume, onEnterConsole, isAuthenticated }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/blogs')
      .then(r => r.json())
      .then(data => {
        if (data.blogs) setPosts(data.blogs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Engineering Blog | {resume.name}</title>
        <meta name="description" content={`Read technical articles and insights from ${resume.name}.`} />
        <meta property="og:title" content={`Engineering Blog | ${resume.name}`} />
      </Helmet>
      <Container id="blog-list-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={onEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center">
            <BookOpen size={14} className="mr-2" /> Engineering Blog
          </h2>
          <Heading variant="h2" as="p" className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-light max-w-2xl">
            Writing about systems architecture, cloud infrastructure, and software engineering.
          </Heading>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-500 font-mono italic">No posts published yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <div key={post.slug} className="group border-b border-zinc-200 dark:border-zinc-800 pb-8 last:border-0 hover:-translate-y-1 transition-transform">
                <Link to={`/blog/${post.slug}`} className="space-y-3 block">
                  <span className="mono-text text-[10px] text-zinc-400 block">{post.date}</span>
                  <Heading as="h3" variant="h2" className="group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors md:text-2xl">
                    {post.title}
                  </Heading>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex gap-2 flex-wrap pt-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="mono-text text-[9px] px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-full border border-zinc-200 dark:border-zinc-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-500 space-y-4 md:space-y-0 pb-16">
        <div className="space-y-1 text-center md:text-left">
          <p className="serif-header italic font-light">© {new Date().getFullYear()} {resume.name}. Built with React & Tailwind.</p>
        </div>
      </footer>
    </Container>
    </>
  );
}
