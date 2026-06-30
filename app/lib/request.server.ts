export async function parseRequestBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData);
}

export function methodNotAllowed(method: string, allowed: string[]) {
  return new Response(`${method} is not allowed. Use ${allowed.join(', ')}.`, {
    status: 405,
    headers: {
      Allow: allowed.join(', '),
    },
  });
}
