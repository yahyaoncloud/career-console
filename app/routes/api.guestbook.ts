import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { prisma } from '../lib/db.server';
import { checkRateLimit } from '../lib/rate-limit.server';
import { sanitizeString } from '../lib/sanitize';
import { z } from 'zod';
import { type ActionResult } from '../types/types';

const GuestbookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const entries = await prisma.guestbook.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return Response.json({
      success: true,
      data: entries
    } satisfies ActionResult);
  } catch (error: any) {
    return Response.json({
      success: false,
      error: 'Failed to fetch guestbook entries',
      message: error.message
    } satisfies ActionResult, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed' } satisfies ActionResult, { status: 405 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = await checkRateLimit(ip, 5);
  
  if (!allowed) {
    return Response.json({ success: false, message: 'Too many requests. Please try again later.', error: 'Rate limit exceeded' } satisfies ActionResult, { status: 429 });
  }

  try {
    const data = await request.json();
    const result = GuestbookSchema.safeParse(data);

    if (!result.success) {
      return Response.json({ 
        success: false, 
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors 
      } satisfies ActionResult, { status: 400 });
    }

    const entry = await prisma.guestbook.create({
      data: {
        name: sanitizeString(result.data.name),
        message: sanitizeString(result.data.message)
      }
    });

    return Response.json({ success: true, data: entry } satisfies ActionResult);
  } catch (error: any) {
    return Response.json({
      success: false,
      error: 'Failed to add guestbook entry',
      message: error.message
    } satisfies ActionResult, { status: 500 });
  }
}
