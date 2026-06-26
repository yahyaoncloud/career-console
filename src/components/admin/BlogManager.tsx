import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export default function BlogManager() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<{slug: string, content: string}>({ slug: '', content: '' });
  
  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs');
      const data = await res.json();
      if (data.blogs) setPosts(data.blogs);
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load posts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/blogs/${slug}`);
      const data = await res.json();
      if (data.success) {
        // Reconstruct the raw markdown with frontmatter for editing
        const rawContent = `---
title: ${data.blog.title}
date: ${data.blog.date}
excerpt: 
tags: 
---
${data.blog.content}`;
        setCurrentPost({ slug, content: rawContent });
        setIsEditing(true);
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load post content' });
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/blogs/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ variant: 'success', title: 'Deleted', description: 'Post deleted successfully' });
        loadPosts();
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to delete post' });
    }
  };

  const handleSave = async () => {
    if (!currentPost.slug.trim()) {
      toast({ variant: 'error', title: 'Validation Error', description: 'Slug is required' });
      return;
    }
    
    // Auto-generate frontmatter if it's missing (naive safeguard)
    let contentToSave = currentPost.content;
    if (!contentToSave.startsWith('---')) {
      contentToSave = `---\ntitle: New Post\ndate: ${new Date().toISOString().split('T')[0]}\nexcerpt: \ntags: \n---\n${contentToSave}`;
    }

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: currentPost.slug,
          content: contentToSave
        }),
      });
      if (res.ok) {
        toast({ variant: 'success', title: 'Saved', description: 'Post saved successfully' });
        setIsEditing(false);
        loadPosts();
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to save post' });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {currentPost.slug ? 'Edit Post' : 'New Post'}
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">Markdown Editor</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-mono transition-colors"
            >
              <Check size={14} className="mr-1.5" /> Save Post
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">URL Slug</label>
            <input
              type="text"
              value={currentPost.slug}
              onChange={e => setCurrentPost({...currentPost, slug: e.target.value})}
              placeholder="my-awesome-post"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-sm focus:outline-none focus:border-teal-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Markdown Content (with Frontmatter)</label>
            <textarea
              value={currentPost.content}
              onChange={e => setCurrentPost({...currentPost, content: e.target.value})}
              rows={20}
              className="w-full px-3 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs focus:outline-none focus:border-teal-500 text-zinc-900 dark:text-zinc-100"
              placeholder={`---\ntitle: Post Title\ndate: YYYY-MM-DD\nexcerpt: Brief description\ntags: tag1, tag2\n---\n\nWrite your content here...`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="serif-header text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            <FileText size={18} className="mr-2 text-zinc-400" /> Blog CMS
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">Manage your Markdown content files.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              try {
                toast({ variant: 'default', title: 'Running Scraper...', description: 'Fetching jobs in background.' });
                const res = await fetch('/api/scraper/trigger', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                  toast({ variant: 'success', title: 'Scraper Triggered', description: data.message });
                  setTimeout(() => loadPosts(), 3000); // refresh after a few seconds to see new post
                } else {
                  throw new Error(data.error);
                }
              } catch (err: any) {
                toast({ variant: 'error', title: 'Error', description: err.message || 'Failed to trigger scraper' });
              }
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold rounded shadow-sm transition-colors"
          >
            <span>Run Scraper</span>
          </button>
          <button
            onClick={() => {
              setCurrentPost({ slug: '', content: `---\ntitle: \ndate: ${new Date().toISOString().split('T')[0]}\nexcerpt: \ntags: \n---\n\n` });
              setIsEditing(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold rounded shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> <span>New Post</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-900 rounded"></div>)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
          <p className="text-zinc-500 font-mono text-sm">No blog posts found in content/blogs/</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Post Title</th>
                <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold hidden md:table-cell">Tags</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {posts.map((post) => (
                <tr key={post.slug} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-sans">{post.title}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{post.slug}.md</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 font-mono hidden sm:table-cell">{post.date}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(post.slug)}
                      className="p-1.5 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.slug)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
