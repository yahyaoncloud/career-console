import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Heading } from '../../components/ui/Heading';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs');

// Ensure blogs directory exists
if (!fs.existsSync(BLOGS_DIR)) {
  fs.mkdirSync(BLOGS_DIR, { recursive: true });
}

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  authorName?: string;
  authorLinkedin?: string;
  authorId?: string;
}

const isSafeBlogSlug = (slug: string) => /^[\w -]+$/.test(slug);
const getBlogPath = (slug: string) => path.join(BLOGS_DIR, `${slug}.md`);

const parseFrontmatter = (markdown: string): Omit<BlogPostMeta, 'slug'> & { content: string } => {
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
    title: fields.title || 'Untitled',
    date: fields.date || '',
    excerpt: fields.excerpt || '',
    tags: fields.tags ? fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    authorName: fields.authorName || '',
    authorLinkedin: fields.authorLinkedin || '',
    authorId: fields.authorId || '',
    content
  };
};

const BlogSchema = z.object({
  originalSlug: z.string().optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[\w -]+$/, "Slug can only contain letters, numbers, spaces, and hyphens"),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  tags: z.string().optional(),
  authorName: z.string().optional(),
  authorLinkedin: z.string().optional(),
  content: z.string().min(1, "Content is required")
});

type BlogFormData = z.infer<typeof BlogSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const files = await fs.promises.readdir(BLOGS_DIR);
  const blogs: BlogPostMeta[] = [];
  const fullBlogs: Record<string, string> = {};

  for (const file of files) {
    if (file.endsWith('.md')) {
      const slug = file.replace('.md', '');
      const markdown = await fs.promises.readFile(path.join(BLOGS_DIR, file), 'utf8');
      const { content, ...meta } = parseFrontmatter(markdown);
      
      // Authors only see their own blogs
      if (meta.authorId === user.firebaseUid) {
        blogs.push({ slug, ...meta });
        fullBlogs[slug] = content;
      }
    }
  }

  // Sort by date descending
  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { blogs, fullBlogs, currentUser: user };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      const slug = formData.get('slug') as string;
      if (!isSafeBlogSlug(slug)) throw new Error('Invalid slug');
      
      // Verify ownership
      const existing = await fs.promises.readFile(getBlogPath(slug), 'utf8');
      const meta = parseFrontmatter(existing);
      if (meta.authorId !== user.firebaseUid) throw new Error('Unauthorized');

      await fs.promises.unlink(getBlogPath(slug));
      return { success: true, message: 'Blog post deleted' };
    }

    const data = Object.fromEntries(formData);
    const result = BlogSchema.safeParse(data);
    
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { originalSlug, slug, title, date, excerpt, tags, authorName, authorLinkedin, content } = result.data;
    
    if (!isSafeBlogSlug(slug)) throw new Error('Invalid slug format');

    // Create frontmatter string
    const frontmatter = [
      '---',
      `title: ${title}`,
      `date: ${date}`,
      `excerpt: ${excerpt}`,
      `tags: ${tags || ''}`,
      `authorName: ${authorName || ''}`,
      `authorLinkedin: ${authorLinkedin || ''}`,
      `authorId: ${user.firebaseUid}`, // Always lock to current user unless admin is editing (simplification)
      '---',
      '',
      content
    ].join('\n');

    // If slug changed, delete old file
    if (originalSlug && originalSlug !== slug) {
      if (fs.existsSync(getBlogPath(originalSlug))) {
        await fs.promises.unlink(getBlogPath(originalSlug));
      }
    }

    await fs.promises.writeFile(getBlogPath(slug), frontmatter, 'utf8');

    return Response.json({ success: true, message: `Blog post ${originalSlug ? 'updated' : 'created'}` });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export default function AuthorBlogManagerRoute() {
  const { blogs, fullBlogs, currentUser } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BlogFormData>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      originalSlug: '',
      slug: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      excerpt: '',
      tags: '',
      authorName: currentUser.name || '',
      authorLinkedin: '',
      content: ''
    }
  });

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === 'idle') {
      alert(fetcher.data.message);
      setEditingSlug(null);
      setIsAddingNew(false);
      reset();
    } else if (fetcher.data?.message && !fetcher.data.success && fetcher.state === 'idle') {
      alert('Error: ' + fetcher.data.message);
    }
  }, [fetcher.data, fetcher.state, reset]);

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingSlug(null);
    reset({
      originalSlug: '',
      slug: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      excerpt: '',
      tags: '',
      authorName: currentUser.name || '',
      authorLinkedin: '',
      content: ''
    });
  };

  const startEdit = (post: typeof blogs[0]) => {
    setIsAddingNew(false);
    setEditingSlug(post.slug);
    reset({
      originalSlug: post.slug,
      slug: post.slug,
      title: post.title,
      date: post.date,
      excerpt: post.excerpt,
      tags: post.tags.join(', '),
      authorName: post.authorName || '',
      authorLinkedin: post.authorLinkedin || '',
      content: fullBlogs[post.slug] || ''
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingSlug(null);
  };

  const onSubmit = (data: BlogFormData) => {
    fetcher.submit(
      { ...data, intent: isAddingNew ? 'create' : 'update' },
      { method: 'post' }
    );
  };

  const handleDelete = (slug: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      fetcher.submit({ slug, intent: 'delete' }, { method: 'post' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <Heading variant="h2" className="flex items-center gap-2">
            <FileText size={20} className="text-muted-foreground" />
            Blog CMS
          </Heading>
          <p className="text-muted-foreground text-sm font-mono mt-1">Manage markdown blog posts.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-mono font-bold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {(isAddingNew || editingSlug) && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-6">
            <Heading variant="h3">{isAddingNew ? 'Write New Post' : 'Edit Post'}</Heading>
            <button onClick={handleCancel} className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('originalSlug')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Title *</label>
                  <input
                    {...register('title')}
                    onChange={(e) => {
                      register('title').onChange(e);
                      if (isAddingNew) {
                        setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40", errors.title && "border-destructive")}
                    placeholder="Post Title"
                  />
                  {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">URL Slug *</label>
                  <input
                    {...register('slug')}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40 font-mono", errors.slug && "border-destructive")}
                    placeholder="post-title-slug"
                  />
                  {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Author Name</label>
                    <input
                      {...register('authorName')}
                      className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Publish Date *</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Excerpt *</label>
                  <textarea
                    {...register('excerpt')}
                    rows={3}
                    className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40 resize-none", errors.excerpt && "border-destructive")}
                    placeholder="Brief description for blog listing..."
                  />
                  {errors.excerpt && <p className="text-destructive text-xs mt-1">{errors.excerpt.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Tags (comma separated)</label>
                  <input
                    {...register('tags')}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
                    placeholder="React, TypeScript, Guide"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">Markdown Content *</label>
              <textarea
                {...register('content')}
                rows={15}
                className={cn("w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40 font-mono", errors.content && "border-destructive")}
                placeholder="# Write your blog post here..."
              />
              {errors.content && <p className="text-destructive text-xs mt-1">{errors.content.message}</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </fetcher.Form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((post) => (
          <Card key={post.slug} className="flex flex-col border-border/50 bg-card hover:border-border transition-colors">
            <div className="p-5 flex-1 space-y-4">
              <h3 className="font-bold font-sans text-lg leading-tight">{post.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="pt-2 flex flex-wrap gap-1.5">
                {post.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-mono rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                {new Date(post.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(post)}
                  className="p-1.5 bg-muted text-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Edit Post"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(post.slug)}
                  className="p-1.5 bg-muted text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete Post"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {blogs.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <FileText size={32} className="mb-4 opacity-20" />
            <p className="font-mono text-sm">No blog posts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
