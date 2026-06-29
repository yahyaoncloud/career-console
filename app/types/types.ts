export type ApplicationStatus =
  | 'Wishlist'
  | 'Applied'
  | 'HR Screening'
  | 'Technical'
  | 'Manager Round'
  | 'Final Round'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Archived';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  employmentType: 'Full-time' | 'Contract' | 'Part-time' | 'Remote' | 'Hybrid';
  appliedDate: string;
  deadline: string;
  referral: string;
  recruiter: string;
  contact: string;
  website: string;
  priority: 'Low' | 'Medium' | 'High';
  status: ApplicationStatus;
  interviewDate?: string;
  notes: string;
  resumeUsed: string;
  coverLetter?: string;
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  hq?: string;
  size?: string;
  status: 'Target' | 'Applied' | 'Interviewing' | 'Blacklisted' | 'Tracking';
  notes?: string;
  recruiter?: string;
  contactEmail?: string;
  linkedinUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}


export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  architectureDiagram?: string;
  techStack: string[];
  /** Alias used by ProjectsPage.tsx */
  technologies?: string[];
  githubLink?: string;
  /** Alias used by ProjectsPage.tsx */
  github?: string;
  demoLink?: string;
  /** Alias used by ProjectsPage.tsx */
  link?: string;
  caseStudy: string;
  category: 'Infrastructure' | 'Full-stack' | 'DevOps' | 'AI & ML';
  metrics?: Array<{ label: string; value: string }>;
}

export interface ResumeData {
  name: string;
  title: string;
  profileImage?: string;
  showProfileImage?: boolean;
  contact: {
    email: string;
    phone: string;
    location: string;
    github: string;
    linkedin: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    cloud: string[];
    tools: string[];
  };
  education: Array<{
    institution: string;
    degree: string;
    period: string;
  }>;
  certifications: Array<{
    name: string;
    brand: string;
    date?: string;
    credlyLink?: string;
    status?: string;
  }>;

export interface DocumentAsset {
  id: string;
  name: string;
  type: 'Resume' | 'Cover Letter' | 'Certificate' | 'Offer Letter' | 'Other';
  version: string;
  url?: string;          // Supabase Storage public URL
  storagePath?: string;  // Supabase Storage path (for deletion)
  mimeType?: string;
  uploadedAt: string;
  size: string;
}

export interface SystemLog {
  timestamp: string;
  event: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  module: string;
}

export interface Profile {
  id: string;
  userId: string;
  slug: string;
  displayName?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  showImage: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  profile?: Profile | null;
}

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
  requestId?: string;
}
