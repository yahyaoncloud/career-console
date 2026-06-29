export const ROLES = {
  ADMIN: 'ADMIN',
  AUTHOR: 'AUTHOR',
  USER: 'USER',
} as const;

export type Role = keyof typeof ROLES;
