import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { getOptionalUser } from '../lib/auth.server';
import { createGuestbookEntry, listGuestbookEntries } from '../services/guestbook.server';

export async function loader({}: LoaderFunctionArgs) {
  try {
    const entries = await listGuestbookEntries();
    return jsonResponse(entries, { meta: { count: entries.length } });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return methodNotAllowed(request.method, ['POST']);
  }

  try {
    const user = await getOptionalUser(request);
    const payload = await parseRequestBody(request);
    const entry = await createGuestbookEntry(payload as any, user?.id);
    return jsonResponse(entry, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
