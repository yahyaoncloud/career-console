export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
