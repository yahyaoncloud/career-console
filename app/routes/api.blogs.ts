import { type LoaderFunctionArgs } from 'react-router';
import fs from 'fs';
import path from 'path';
import { jsonResponse, errorResponse } from '../lib/api.server';

const getBlogsDir = () => {
  return path.join(process.cwd(), 'content', 'blogs');
};
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

export async function loader({ request }: LoaderFunctionArgs) {
  let blogs: BlogPostMeta[] = [];
  
  try {
    const dir = getBlogsDir();
    if (fs.existsSync(dir)) {
      const files = await fs.promises.readdir(dir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const slug = file.replace('.md', '');
          const markdown = await fs.promises.readFile(path.join(dir, file), 'utf8');
          const meta = parseFrontmatter(markdown);
          blogs.push({ slug, ...meta });
        }
      }
    }
    
    blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return jsonResponse(blogs, { meta: { count: blogs.length } });
  } catch (err: any) {
    return errorResponse(err, { status: 500 });
  }
}
