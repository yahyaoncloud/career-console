import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { FileText, UserCircle, Activity, PenTool } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { DashboardLayout } from '../../components/shared/DashboardLayout';
import { ROLES, ROUTES } from '../../constants';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== ROLES.AUTHOR && user.role !== ROLES.ADMIN) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  if (params.id && params.id !== user.id && user.role !== ROLES.ADMIN) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { user, urlId: params.id || user.id };
}

export default function AuthorLayout() {
  const { user, urlId } = useLoaderData<typeof loader>();

  const navLinks = [
    { to: ROUTES.AUTHOR.DASHBOARD(urlId), label: 'Dashboard', icon: Activity, exact: true },
    { to: ROUTES.AUTHOR.BLOGS(urlId), label: 'My Blogs', icon: FileText },
    { to: ROUTES.AUTHOR.PROFILE(urlId), label: 'Profile', icon: UserCircle },
  ];

  return (
    <DashboardLayout
      navLinks={navLinks}
      userEmail={user.email || 'Author'}
      userRole={ROLES.AUTHOR}
      brandTitle="Author Studio"
      brandIcon={PenTool}
      brandLink={ROUTES.AUTHOR.DASHBOARD(urlId)}
      brandIconWrapperClass="bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
    />
  );
}
