import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { type User } from '@prisma/client';
import { prisma } from '../lib/db.server';
import { ROLES } from '../constants/roles';
import { BLOG_STATUS } from '../constants/status';
import { getCache, setCache, clearCache, CACHE_TTL } from '../lib/cache.server';
import { forbidden } from '../policies/authz.server';

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  authorName?: string;
  authorLinkedin?: string;
  authorId?: string;
  authorSlug?: string;
  status?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

export const BlogInputSchema = z.object({
  slug: z.string().min(1).regex(/^[\w -]+$/),
  title: z.string().min(1),
  date: z.string().min(1),
  excerpt: z.string().min(1),
  tags: z.array(z.string()).optional().or(z.string().optional()),
  authorName: z.string().optional(),
  authorLinkedin: z.string().optional(),
  content: z.string().min(1),
  status: z.string().optional(),
});

export type BlogInput = z.infer<typeof BlogInputSchema>;

const getBlogsDir = () => {
  const dir = path.join(process.cwd(), 'content', 'blogs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const isSafeBlogSlug = (slug: string) => /^[\w -]+$/.test(slug);

const getBlogPath = (slug: string) => {
  if (!isSafeBlogSlug(slug)) {
    throw new Error('Invalid slug');
  }
  return path.join(getBlogsDir(), `${slug}.md`);
};

const parseFrontmatter = (markdown: string): Omit<BlogPost, 'slug'> => {
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
    authorSlug: fields.authorSlug || fields.authorName?.toLowerCase().replace(/\s+/g, '-') || '',
    status: fields.status || BLOG_STATUS.PUBLISHED,
    content,
  };
};

function serializeBlog(
  input: BlogInput,
  currentUser: User,
  status: string,
  owner: { firebaseUid?: string; name?: string } = {}
) {
  const tags = Array.isArray(input.tags)
    ? input.tags
    : (input.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

  return [
    '---',
    `title: ${input.title}`,
    `date: ${input.date}`,
    `excerpt: ${input.excerpt}`,
    `tags: ${tags.join(', ')}`,
    `authorName: ${input.authorName || owner.name || currentUser.name || ''}`,
    `authorLinkedin: ${input.authorLinkedin || ''}`,
    `authorId: ${owner.firebaseUid || currentUser.firebaseUid}`,
    `status: ${status}`,
    '---',
    '',
    input.content,
  ].join('\n');
}

function canManageBlog(user: User, blog: BlogPost) {
  return user.role === ROLES.ADMIN || blog.authorId === user.firebaseUid;
}

function isPublicStatus(status?: string) {
  return !status || status === BLOG_STATUS.PUBLISHED;
}

export async function listBlogs(options: { publicOnly?: boolean; authorFirebaseUid?: string } = {}) {
  const cacheKey = options.publicOnly && !options.authorFirebaseUid ? 'blogs:index:public' : null;
  const cached = cacheKey ? getCache<BlogPostMeta[]>(cacheKey) : null;
  if (cached) return cached;

  const dir = getBlogsDir();
  const files = await fs.promises.readdir(dir);
  const blogs: BlogPostMeta[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace('.md', '');
    const markdown = await fs.promises.readFile(path.join(dir, file), 'utf8');
    const { content, ...meta } = parseFrontmatter(markdown);

    if (options.publicOnly && !isPublicStatus(meta.status)) continue;
    if (options.authorFirebaseUid && meta.authorId !== options.authorFirebaseUid) continue;

    blogs.push({ slug, ...meta });
  }

  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (cacheKey) setCache(cacheKey, blogs, CACHE_TTL.MEDIUM);
  return blogs;
}

export async function getBlogBySlug(slug: string, options: { publicOnly?: boolean } = {}) {
  const blogPath = getBlogPath(slug);
  if (!fs.existsSync(blogPath)) return null;

  const markdown = await fs.promises.readFile(blogPath, 'utf8');
  const parsed = parseFrontmatter(markdown);
  const blog = { slug, ...parsed };

  if (options.publicOnly && !isPublicStatus(blog.status)) return null;
  return blog;
}

export async function createBlog(currentUser: User, input: BlogInput) {
  const parsed = BlogInputSchema.parse(input);
  const status = currentUser.role === ROLES.ADMIN
    ? (parsed.status || BLOG_STATUS.PUBLISHED)
    : BLOG_STATUS.PENDING;

  const blogPath = getBlogPath(parsed.slug);
  if (fs.existsSync(blogPath)) {
    throw new Error('A blog post with this slug already exists.');
  }

  await fs.promises.writeFile(blogPath, serializeBlog(parsed, currentUser, status), 'utf8');
  clearCache();

  if (currentUser.role !== ROLES.ADMIN) {
    const admins = await prisma.user.findMany({ where: { role: ROLES.ADMIN as any, deletedAt: null } });
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'Blog Post Review Requested',
        message: `${currentUser.name || currentUser.email} submitted "${parsed.title}" for review.`,
        type: 'INFO' as any,
        link: '/blog-manager',
      })),
    });
  }

  return getBlogBySlug(parsed.slug);
}

export async function updateBlog(currentUser: User, slug: string, input: Partial<BlogInput>) {
  const existing = await getBlogBySlug(slug);
  if (!existing) throw new Error('Blog post not found.');
  if (!canManageBlog(currentUser, existing)) forbidden('You cannot update this blog post.');

  const merged = BlogInputSchema.parse({
    slug: input.slug || slug,
    title: input.title || existing.title,
    date: input.date || existing.date,
    excerpt: input.excerpt || existing.excerpt,
    tags: input.tags || existing.tags,
    authorName: input.authorName ?? existing.authorName,
    authorLinkedin: input.authorLinkedin ?? existing.authorLinkedin,
    content: input.content || existing.content,
    status: input.status || existing.status,
  });

  const nextStatus = currentUser.role === ROLES.ADMIN ? (merged.status || existing.status || BLOG_STATUS.PUBLISHED) : (existing.status || BLOG_STATUS.DRAFT);

  if (merged.slug !== slug && fs.existsSync(getBlogPath(slug))) {
    await fs.promises.unlink(getBlogPath(slug));
  }

  await fs.promises.writeFile(
    getBlogPath(merged.slug),
    serializeBlog(merged, currentUser, nextStatus, {
      firebaseUid: existing.authorId,
      name: existing.authorName,
    }),
    'utf8'
  );
  clearCache();
  return getBlogBySlug(merged.slug);
}

export async function deleteBlog(currentUser: User, slug: string) {
  const existing = await getBlogBySlug(slug);
  if (!existing) throw new Error('Blog post not found.');
  if (!canManageBlog(currentUser, existing)) forbidden('You cannot delete this blog post.');

  await fs.promises.unlink(getBlogPath(slug));
  clearCache();
  return { deleted: true };
}

export async function transitionBlog(currentUser: User, slug: string, status: string) {
  const existing = await getBlogBySlug(slug);
  if (!existing) throw new Error('Blog post not found.');

  const adminOnlyStatuses = new Set([BLOG_STATUS.PUBLISHED]);
  if (adminOnlyStatuses.has(status as any) && currentUser.role !== ROLES.ADMIN) {
    forbidden('Only admins can perform this blog transition.');
  }

  if (!canManageBlog(currentUser, existing) && currentUser.role !== ROLES.ADMIN) {
    forbidden('You cannot transition this blog post.');
  }

  return updateBlog(currentUser, slug, {
    ...existing,
    tags: existing.tags,
    status,
  });
}
