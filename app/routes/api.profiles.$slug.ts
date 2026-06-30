import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { getPublicProfile } from '../services/profile.server';

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const profile = await getPublicProfile(params.slug);
    if (!profile) return errorResponse(new Error('Profile not found'), { status: 404 });
    return jsonResponse(profile);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
