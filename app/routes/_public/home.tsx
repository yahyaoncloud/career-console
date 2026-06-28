import { type LoaderFunctionArgs, redirect, useLoaderData } from 'react-router'
import { PublicNavbar } from '~/components/shared/PublicNavbar'
import { Container } from '~/components/ui/Container'
import { Heading } from '~/components/ui/Heading'
import { ArrowRight, Github, Linkedin, ExternalLink } from 'lucide-react'
import { prisma } from '~/lib/db.server'

export function meta() {
  return [
    { title: "Career Console - Portfolio" },
    { name: "description", content: "Cloud Engineer Portfolio & Career Console" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Fetch user with profile for home page
    const userWithProfile = await prisma.user.findFirst({
      where: { 
        deletedAt: null,
        profile: { isNot: null }
      },
      include: {
        profile: true
      }
    })

    // Fetch featured portfolio items (limit to 3)
    const featuredPortfolio = await prisma.portfolio.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    return {
      user: userWithProfile,
      featuredPortfolio
    }
  } catch (error) {
    // If database tables don't exist, return mock data
    console.warn('Database tables not found, using mock data:', error)
    return {
      user: {
        name: 'Demo User',
        profile: {
          displayName: 'Demo User',
          bio: 'Building scalable infrastructure, serverless architectures, and automation pipelines.',
          socialLinks: {
            github: 'github.com/demo',
            linkedin: 'linkedin.com/in/demo'
          }
        }
      },
      featuredPortfolio: []
    }
  }
}

export default function Home() {
  const { user, featuredPortfolio } = useLoaderData<typeof loader>()
  
  const handleEnterConsole = () => {
    window.location.href = '/login'
  }
  
  const isAuthenticated = false

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <PublicNavbar 
        resumeName={user?.name || 'Portfolio'} 
        onEnterConsole={handleEnterConsole} 
        isAuthenticated={isAuthenticated} 
      />
      
      <Container>
        {/* Hero Section */}
        <section className="py-20 md:py-32 space-y-8">
          <div className="space-y-4 max-w-3xl">
            <Heading variant="h1" className="text-5xl md:text-7xl font-bold tracking-tight">
              {user?.profile?.displayName || user?.name || 'Cloud Engineer'}
            </Heading>
            <p className="text-xl md:text-2xl text-zinc-400 font-light leading-relaxed">
              {user?.profile?.bio || 'Building scalable infrastructure, serverless architectures, and automation pipelines.'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-950 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
            >
              View Portfolio
              <ArrowRight size={16} />
            </a>
            <a
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-800 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-900 transition-colors"
            >
              Projects
            </a>
          </div>
          
          {user?.profile?.socialLinks && (
            <div className="flex gap-4 pt-4">
              {(user.profile.socialLinks as any)?.github && (
                <a
                  href={`https://${(user.profile.socialLinks as any).github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Github size={24} />
                </a>
              )}
              {(user.profile.socialLinks as any)?.linkedin && (
                <a
                  href={`https://${(user.profile.socialLinks as any).linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Linkedin size={24} />
                </a>
              )}
            </div>
          )}
        </section>

        {/* Featured Projects */}
        {featuredPortfolio.length > 0 && (
          <section className="py-16 space-y-8 border-t border-zinc-900">
            <div className="space-y-2">
              <h2 className="mono-text text-xs uppercase tracking-wider text-zinc-500">
                Featured Projects
              </h2>
              <Heading variant="h2">Recent Work</Heading>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPortfolio.map((project: any) => (
                <a
                  key={project.id}
                  href={`/portfolio#${project.id}`}
                  className="group block p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="mono-text text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase">
                        {project.category}
                      </span>
                      {project.demoLink && (
                        <ExternalLink size={16} className="text-zinc-500 group-hover:text-zinc-300" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-zinc-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 3).map((tech: string) => (
                        <span key={tech} className="mono-text text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            
            <a
              href="/projects"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View all projects
              <ArrowRight size={16} />
            </a>
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 border-t border-zinc-900 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} {user?.name || 'Portfolio'}. Built with React Router & Prisma.</p>
        </footer>
      </Container>
    </div>
  );
}
