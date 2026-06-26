export interface ExtractedJob {
  title: string;
  company: string;
  employmentType: string | null;
  experienceLevel: string | null;
  remote: boolean;
  location: string | null;
  country: string | null;
  salary: string | null;
  visaSponsorship: string | null;
  skills: string[];
  preferredSkills: string[];
  summary: string;
  url: string;
  source: string;
  scrapedAt: string;
}

export interface ExtractionInput {
  url: string;
  source: string;
  cleanedText: string;
}
