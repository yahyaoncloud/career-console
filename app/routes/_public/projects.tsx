import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { prisma } from '../../lib/db.server';
import { ExternalLink, Github, Monitor } from 'lucide-react';
import { Heading } from '../../components/ui/Heading';
import { Card } from '../../components/ui/Card';

export async function loader() {
  const projects = await prisma.portfolio.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  return { projects };
}

export default function ProjectsRoute() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="space-y-2 border-b border-border pb-8">
          <Heading variant="h1" className="font-serif italic font-light tracking-tight flex items-center">
            <Monitor className="mr-3" size={32} />
            Selected Works
          </Heading>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest pt-2">
            Archive of Engineering & Design
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="text-muted-foreground py-8">No projects have been published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col h-full bg-card/50 hover:bg-card transition-colors duration-300">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {project.title}
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded">
                      {project.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground opacity-80 leading-relaxed mb-6 flex-1">
                    {project.description}
                  </p>
                  
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="font-mono text-[10px] px-2 py-0.5 bg-background border border-border text-muted-foreground rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-4 mt-auto flex items-center justify-between border-t border-border">
                    <div className="flex space-x-3">
                      {project.demoLink && (
                        <a
                          href={project.demoLink}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                        >
                          <ExternalLink size={14} />
                          <span className="text-xs font-mono uppercase">Live</span>
                        </a>
                      )}
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                        >
                          <Github size={14} />
                          <span className="text-xs font-mono uppercase">Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
