import { type LoaderFunctionArgs, data } from 'react-router'
import { useLoaderData } from 'react-router'
import { PortfolioProject, ResumeData } from '~/types/types'
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, ChevronRight } from 'lucide-react'
import { PublicNavbar } from '~/components/shared/PublicNavbar'
import { Container } from '~/components/ui/Container'
import { Card } from '~/components/ui/Card'
import { Heading } from '~/components/ui/Heading'
import { Helmet } from 'react-helmet-async'
import OptimizedImage from '~/components/ui/OptimizedImage'
import { prisma } from '~/lib/db.server'

// Mock data - replace with actual database queries
const mockResume: ResumeData = {
  name: 'Your Name',
  title: 'Cloud Engineer',
  profileImage: '/avatar.jpg',
  showProfileImage: true,
  contact: {
    email: 'your.email@example.com',
    phone: '+1 234 567 890',
    location: 'San Francisco, CA',
    github: 'github.com/yourusername',
    linkedin: 'linkedin.com/in/yourusername'
  },
  summary: 'Experienced Cloud Engineer specializing in building scalable infrastructure, serverless architectures, and automation pipelines. Passionate about DevOps best practices and cloud-native technologies.',
  experience: [
    {
      company: 'Tech Company',
      role: 'Senior Cloud Engineer',
      period: '2022 - Present',
      highlights: [
        'Architected and deployed serverless applications on AWS Lambda',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
        'Managed multi-region infrastructure serving millions of users'
      ]
    },
    {
      company: 'Previous Company',
      role: 'DevOps Engineer',
      period: '2020 - 2022',
      highlights: [
        'Built Kubernetes clusters for microservices deployment',
        'Automated infrastructure provisioning with Terraform',
        'Reduced infrastructure costs by 40% through optimization'
      ]
    }
  ],
  projects: [
    {
      name: 'Serverless API Platform',
      description: 'Built a scalable serverless API platform',
      tech: ['AWS Lambda', 'API Gateway', 'DynamoDB']
    }
  ],
  skills: {
    languages: ['TypeScript', 'Python', 'Go', 'Bash'],
    frameworks: ['React', 'Node.js', 'Express', 'FastAPI'],
    cloud: ['AWS', 'GCP', 'Kubernetes', 'Docker'],
    tools: ['Terraform', 'Ansible', 'Git', 'Jenkins']
  },
  education: [
    {
      institution: 'University Name',
      degree: 'Bachelor of Science in Computer Science',
      period: '2016 - 2020'
    }
  ],
  certifications: ['AWS Solutions Architect', 'Kubernetes Administrator', 'DevOps Engineer']
}

const mockPortfolio: PortfolioProject[] = [
  {
    id: '1',
    title: 'Serverless API Platform',
    description: 'Built a scalable serverless API platform handling millions of requests per day with auto-scaling capabilities.',
    architectureDiagram: `
API Gateway → Lambda → DynamoDB
              ↓
           CloudWatch
              ↓
           S3 (Assets)
    `,
    techStack: ['AWS Lambda', 'API Gateway', 'DynamoDB', 'CloudWatch', 'S3'],
    githubLink: 'https://github.com/yourusername/serverless-api',
    demoLink: 'https://demo.example.com',
    caseStudy: 'Designed and implemented a serverless architecture that reduced infrastructure costs by 70% while improving performance and scalability.',
    category: 'Infrastructure',
    metrics: [
      { label: 'Cost Reduction', value: '70%' },
      { label: 'Requests/Day', value: '1M+' }
    ]
  },
  {
    id: '2',
    title: 'Kubernetes Microservices',
    description: 'Deployed and managed a microservices architecture on Kubernetes with automated scaling and self-healing capabilities.',
    architectureDiagram: `
Ingress → Service → Pod → Container
              ↓
           HPA
              ↓
           Cluster Autoscaler
    `,
    techStack: ['Kubernetes', 'Docker', 'Helm', 'Prometheus', 'Grafana'],
    githubLink: 'https://github.com/yourusername/k8s-microservices',
    caseStudy: 'Implemented GitOps workflows using ArgoCD for zero-downtime deployments and improved developer productivity.',
    category: 'DevOps',
    metrics: [
      { label: 'Uptime', value: '99.9%' },
      { label: 'Deploy Time', value: '< 2min' }
    ]
  }
]

export async function loader({ request }: LoaderFunctionArgs) {
  // Fetch portfolio projects from database
  const portfolio = await prisma.portfolio.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch user with profile for resume data
  // For public portfolio, we'll use the first user with a profile
  const userWithProfile = await prisma.user.findFirst({
    where: { 
      deletedAt: null,
      profile: { isNot: null }
    },
    include: {
      profile: true
    }
  })

  // Transform database data to match ResumeData type
  const resume: ResumeData = userWithProfile ? {
    name: userWithProfile.name || userWithProfile.email?.split('@')[0] || 'User',
    title: 'Cloud Engineer',
    profileImage: userWithProfile.image || userWithProfile.profile?.avatar || undefined,
    showProfileImage: !!userWithProfile.profile?.avatar,
    contact: {
      email: userWithProfile.email,
      phone: '',
      location: '',
      github: (userWithProfile.profile?.socialLinks as any)?.github || '',
      linkedin: (userWithProfile.profile?.socialLinks as any)?.linkedin || ''
    },
    summary: userWithProfile.profile?.bio || 'Experienced Cloud Engineer specializing in building scalable infrastructure, serverless architectures, and automation pipelines.',
    experience: [],
    projects: [],
    skills: {
      languages: ['TypeScript', 'Python', 'Go', 'Bash'],
      frameworks: ['React', 'Node.js', 'Express', 'FastAPI'],
      cloud: ['AWS', 'GCP', 'Kubernetes', 'Docker'],
      tools: ['Terraform', 'Ansible', 'Git', 'Jenkins']
    },
    education: [],
    certifications: ['AWS Solutions Architect', 'Kubernetes Administrator']
  } : mockResume

  // Transform portfolio data to match PortfolioProject type
  const transformedPortfolio: PortfolioProject[] = portfolio.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    architectureDiagram: project.architectureDiagram || undefined,
    techStack: project.techStack,
    githubLink: project.githubLink || undefined,
    demoLink: project.demoLink || undefined,
    caseStudy: project.caseStudy || '',
    category: project.category as 'Infrastructure' | 'Full-stack' | 'DevOps' | 'AI & ML',
    metrics: undefined
  }))

  return data({
    portfolio: transformedPortfolio.length > 0 ? transformedPortfolio : mockPortfolio,
    resume
  })
}

export default function PortfolioPage() {
  const loaderData = useLoaderData<typeof loader>()
  const portfolio = loaderData?.portfolio || mockPortfolio
  const resume = loaderData?.resume || mockResume
  
  const handleEnterConsole = () => {
    // Navigate to login or dashboard
    window.location.href = '/login'
  }
  
  const isAuthenticated = false // TODO: Check actual auth state

  return (
    <>
      <Helmet>
        <title>{resume.name} | Portfolio</title>
        <meta name="description" content={resume.summary.substring(0, 155) + '...'} />
        <meta property="og:title" content={`${resume.name} | Portfolio`} />
        <meta property="og:description" content={resume.summary.substring(0, 155) + '...'} />
      </Helmet>
      <Container id="landing-portfolio-view">
      <PublicNavbar 
        resumeName={resume.name} 
        onEnterConsole={handleEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />

      {/* Profile Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-4">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            About Me
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start pt-2">
            {resume.showProfileImage && resume.profileImage && (
              <div className="shrink-0 relative group">
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 rounded-2xl rotate-3 transition-transform group-hover:rotate-6"></div>
                <OptimizedImage 
                  src={resume.profileImage} 
                  alt="Profile" 
                  width={160}
                  height={160}
                  loading="eager"
                  className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-xl border border-white dark:border-zinc-950"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <Heading as="p" variant="h3" className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-light">
                {resume.summary}
              </Heading>
              <div className="flex flex-wrap gap-4 pt-2">
                <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-300 mono-text bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded">
                  <MapPin size={12} className="mr-1.5" /> {resume.contact.location}
                </span>
                <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-300 mono-text bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded">
                  <Mail size={12} className="mr-1.5" /> {resume.contact.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bento Column */}
        <Card className="bg-zinc-100 dark:bg-zinc-950 !p-5 space-y-4">
          <span className="mono-text text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
            Links & Socials
          </span>
          <div className="space-y-2.5">
            <a
              href={`https://${resume.contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white mono-text"
            >
              <span className="flex items-center"><Github size={12} className="mr-1.5" /> {resume.contact.github}</span>
              <ExternalLink size={10} />
            </a>
            <a
              href={`https://${resume.contact.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white mono-text"
            >
              <span className="flex items-center"><Linkedin size={12} className="mr-1.5" /> {resume.contact.linkedin}</span>
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <span className="mono-text text-[10px] text-zinc-400 block mb-1">Certifications:</span>
            <ul className="text-sm space-y-1.5 text-zinc-600 dark:text-zinc-400 list-none pl-0">
              {resume.certifications.map((cert: string, index: number) => (
                <li key={index} className="flex items-start">
                  <ChevronRight size={10} className="mt-0.5 mr-1 text-zinc-400 flex-shrink-0" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* Systems & Architecture Portfolio */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Featured Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {portfolio.map((project: PortfolioProject) => (
            <div
              key={project.id}
              className="bg-zinc-50 dark:bg-zinc-950/40 p-6 rounded border border-zinc-200 dark:border-zinc-800 space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="mono-text text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded uppercase font-bold">
                    {project.category}
                  </span>
                  <h3 className="serif-header text-xl font-bold text-zinc-950 dark:text-zinc-100">
                    {project.title}
                  </h3>
                </div>
                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                  >
                    <Github size={16} />
                  </a>
                )}
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                {project.description}
              </p>

              {project.architectureDiagram && (
                <div className="bg-zinc-100 dark:bg-black p-3.5 rounded border border-zinc-200 dark:border-zinc-950">
                  <span className="mono-text text-xs text-zinc-400 uppercase block mb-1.5">
                    Architecture Overview:
                  </span>
                  <pre className="mono-text text-xs text-zinc-500 dark:text-zinc-300 overflow-x-auto whitespace-pre">
                    {project.architectureDiagram}
                  </pre>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech: string) => (
                  <span
                    key={tech}
                    className="mono-text text-xs bg-zinc-200/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="text-sm space-y-1 text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-sans">
                <span className="mono-text text-xs text-zinc-400 uppercase block">Details:</span>
                <p className="italic">{project.caseStudy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Technology Stack Bento */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Skills & Technologies
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Languages
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.languages.map((lang: string) => (
                <span key={lang} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Frameworks & APIs
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.frameworks.map((fw: string) => (
                <span key={fw} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {fw}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Cloud Infrastructure
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.cloud.map((c: string) => (
                <span key={c} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="mono-text text-[10px] text-zinc-400 uppercase font-bold block">
              Diagnostics & Tools
            </span>
            <div className="flex flex-wrap gap-1">
              {resume.skills.tools.map((t: string) => (
                <span key={t} className="mono-text text-[11px] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Resume Timeline View */}
      <section className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Work Experience
          </h2>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
          {resume.experience.map((exp, index: number) => (
            <div key={index} className="relative pl-8 space-y-2 group">
              <div className="absolute left-3.5 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-zinc-200 -translate-x-1/2 group-hover:scale-125 transition-transform" />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-0.5">
                  <Heading as="h3" variant="h2">
                    {exp.company}
                  </Heading>
                  <p className="mono-text text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    {exp.role}
                  </p>
                </div>
                <span className="mono-text text-xs text-zinc-400 dark:text-zinc-500 mt-1 sm:mt-0">
                  {exp.period}
                </span>
              </div>
              <ul className="text-sm space-y-1.5 text-zinc-600 dark:text-zinc-300 pl-4 list-disc font-sans">
                {exp.highlights.map((highlight: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-12 pb-16 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-400 dark:text-zinc-600">
        <div className="mono-text text-[10px] tracking-widest uppercase font-bold">
          {new Date().getFullYear()} © {resume.name}
        </div>
        <div className="mono-text text-[10px] tracking-widest uppercase">
          Minimalist Edition
        </div>
      </footer>
    </Container>
    </>
  )
}
