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

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  architectureDiagram?: string;
  techStack: string[];
  githubLink?: string;
  demoLink?: string;
  caseStudy: string;
  category: 'Infrastructure' | 'Full-stack' | 'DevOps' | 'AI & ML';
}

export interface ResumeData {
  name: string;
  title: string;
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
  certifications: string[];
}

export interface DocumentAsset {
  id: string;
  name: string;
  type: 'Resume' | 'Cover Letter' | 'Certificate' | 'Offer Letter';
  version: string;
  uploadedAt: string;
  size: string;
}

export interface SystemLog {
  timestamp: string;
  event: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  module: string;
}
