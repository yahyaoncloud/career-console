import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, NavLink } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Heading } from '../../components/ui/Heading';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/shared/StatCard';
import { UserCircle, FileText, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { BLOG_STATUS, ROUTES } from '../../constants';
import fs from 'fs';
import path from 'path';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs');
  
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });

  let myBlogsCount = 0;
  let publishedCount = 0;
  let pendingCount = 0;

  if (fs.existsSync(BLOGS_DIR)) {
    const files = await fs.promises.readdir(BLOGS_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const markdown = await fs.promises.readFile(path.join(BLOGS_DIR, file), 'utf8');
        const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const rawFrontmatter = match?.[1] || '';
        
        let authorId = '';
        let status = BLOG_STATUS.DRAFT as string; // default if missing
        
        rawFrontmatter.split(/\r?\n/).forEach((line) => {
          if (line.startsWith('authorId:')) authorId = line.replace('authorId:', '').trim();
          if (line.startsWith('status:')) status = line.replace('status:', '').trim().toUpperCase();
        });

        if (authorId === user.firebaseUid) {
          myBlogsCount++;
          if (status === BLOG_STATUS.PUBLISHED) publishedCount++;
          else if (status === BLOG_STATUS.PENDING) pendingCount++;
        }
      }
    }
  }

  return { user, profile, stats: { total: myBlogsCount, published: publishedCount, pending: pendingCount } };
}

export default function AuthorDashboardRoute() {
  const { user, profile, stats } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!profile ? (
        <Card className="p-8 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-bl-full -z-10" />
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
              <UserCircle size={48} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <Heading variant="h2" className="text-indigo-950 dark:text-indigo-100">Welcome to Author Studio!</Heading>
              <p className="mt-2 text-indigo-700/80 dark:text-indigo-300/80 max-w-lg">
                Your account has been created. Before you can start publishing articles, please take a moment to set up your public author profile.
              </p>
            </div>
            <div className="shrink-0">
              <NavLink 
                to={ROUTES.AUTHOR.PROFILE(user.id)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm shadow-sm transition-colors"
              >
                Complete Profile <ArrowRight size={18} />
              </NavLink>
            </div>
          </div>
        </Card>
      ) : (
        <div className="mb-8">
          <Heading variant="h2">Welcome back, {profile.displayName || user.name}</Heading>
          <p className="text-muted-foreground mt-1">Here's an overview of your author studio.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Drafts"
          value={stats.total}
          icon={FileText}
        />

        <StatCard
          title="Published"
          value={stats.published}
          icon={CheckCircle2}
          className="border-emerald-200 dark:border-emerald-900/30"
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-900/20"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          className="border-amber-200 dark:border-amber-900/30"
          iconWrapperClass="bg-amber-50 dark:bg-amber-900/20"
          iconColorClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors group cursor-pointer relative overflow-hidden">
          <NavLink to={ROUTES.AUTHOR.BLOGS(user.id)} className="absolute inset-0 z-10" />
          <Heading variant="h3" className="mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Write a Blog Post</Heading>
          <p className="text-sm text-muted-foreground mb-4">
            Draft a new article in markdown. Submit it for review and it will be published upon approval.
          </p>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            Open Editor <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Card>

        <Card className="p-6 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors group cursor-pointer relative overflow-hidden">
          <NavLink to={ROUTES.AUTHOR.PROFILE(user.id)} className="absolute inset-0 z-10" />
          <Heading variant="h3" className="mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Update Profile</Heading>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your bio, avatar, and social links that appear publicly on your author page.
          </p>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            Edit Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Card>
      </div>
    </div>
  );
}
