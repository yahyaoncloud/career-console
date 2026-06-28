import { auth } from './firebase';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let headers = new Headers(options.headers || {});
  
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (e) {
      console.error('Failed to get auth token', e);
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}
