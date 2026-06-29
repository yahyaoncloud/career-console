import { type LoaderFunctionArgs } from 'react-router';
import fs from 'fs';
import path from 'path';
import { jsonResponse, errorResponse } from '../lib/api.server';

const getBlogsDir = () => {
  return path.join(process.cwd(), 'content', 'blogs');
};
interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  authorName?: string;
  authorSlug?: string;
  content: string;
}

const parseFrontmatter = (markdown: string): Omit<BlogPost, 'contentHtml'> & { content: string } => {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
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
    authorSlug: fields.authorSlug || fields.authorName?.toLowerCase().replace(/\s+/g, '-') || '',
    content: content.trim(),
  };
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;
  if (!slug) {
    return errorResponse(new Error('Slug is required'), { status: 400 });
  }

  try {
    const dir = getBlogsDir();
    const filePath = path.join(dir, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return errorResponse(new Error('Blog post not found'), { status: 404 });
    }

    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const parsedData = parseFrontmatter(fileContent);

    return jsonResponse({
      title: parsedData.title,
      date: parsedData.date,
      excerpt: parsedData.excerpt,
      tags: parsedData.tags,
      authorName: parsedData.authorName,
      authorSlug: parsedData.authorSlug,
      content: parsedData.content
    });
  } catch (error: any) {
    return errorResponse(error, { status: 500 });
  }
}
