import { z } from 'zod';

export const ProfileContactSchema = z.object({
  email: z.string().email("Invalid email").or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

export const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  summary: z.string().max(5000, "Summary is too long").optional(),
  profileImage: z.string().url("Invalid image URL").optional().or(z.literal('')),
  showProfileImage: z.boolean().default(true),
  contact: ProfileContactSchema,
  
  // These are handled dynamically by arrays, but we will type them for the schema
  skills: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    cloud: z.array(z.string()),
    tools: z.array(z.string()),
  }).optional(),
  
  experience: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;
