import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { Database, Activity, Briefcase, FileText, Table, Kanban as KanbanIcon, Building2, UserCircle, Settings, FileCode, Bell, PieChart, MessageSquare, Calendar, ShoppingBag, ClipboardList, Package, Tag, Shield } from 'lucide-react';
import { requireUser } from '../../lib/auth.server';
import { DashboardLayout } from '../../components/shared/DashboardLayout';
import { ROLES, ROUTES } from '../../constants';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== ROLES.ADMIN) {
    throw new Response("Unauthorized", { status: 403 });
  }
  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  const navLinks = [
    // --- Core ---
    { to: ROUTES.PUBLIC.HOME, label: 'Public Portfolio', icon: Database, exact: true, section: 'Core' },
    { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: Activity },
    // --- Career ---
    { to: ROUTES.ADMIN.APPLICATIONS, label: 'Job Tracker', icon: Table, section: 'Career' },
    { to: ROUTES.ADMIN.KANBAN, label: 'Kanban Pipeline', icon: KanbanIcon },
    { to: ROUTES.ADMIN.COMPANIES, label: 'Companies', icon: Building2 },
    { to: ROUTES.ADMIN.CALENDAR, label: 'Calendar', icon: Calendar, comingSoon: true },
    // --- Content ---
    { to: ROUTES.ADMIN.PORTFOLIO, label: 'Projects Management', icon: Briefcase, section: 'Content' },
    { to: ROUTES.ADMIN.BLOGS, label: 'Blog CMS', icon: FileText },
    { to: ROUTES.ADMIN.DOCUMENTS, label: 'Documents', icon: FileCode },
    { to: ROUTES.ADMIN.AUTHORS, label: 'Authors', icon: UserCircle },
    // --- Store ---
    { to: ROUTES.ADMIN.ECOMMERCE.PRODUCTS, label: 'Products', icon: ShoppingBag, section: 'Store', comingSoon: true },
    { to: ROUTES.ADMIN.ECOMMERCE.ORDERS, label: 'Orders', icon: ClipboardList, comingSoon: true },
    { to: ROUTES.ADMIN.ECOMMERCE.INVENTORY, label: 'Inventory', icon: Package, comingSoon: true },
    { to: ROUTES.ADMIN.ECOMMERCE.COUPONS, label: 'Coupons', icon: Tag, comingSoon: true },
    // --- Insights ---
    { to: ROUTES.ADMIN.ANALYTICS, label: 'Analytics', icon: PieChart, section: 'Insights', comingSoon: true },
    { to: ROUTES.ADMIN.MESSAGES, label: 'Messages', icon: MessageSquare, comingSoon: true },
    // --- System ---
    { to: ROUTES.ADMIN.ADMIN_MANAGEMENT, label: 'Admin Management', icon: Shield, section: 'System' },
    { to: ROUTES.ADMIN.NOTIFICATIONS, label: 'Notifications', icon: Bell },
    { to: ROUTES.ADMIN.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <DashboardLayout
      navLinks={navLinks}
      userEmail={user.email || 'Admin User'}
      userRole={ROLES.ADMIN}
      brandTitle="Admin Console"
      brandIcon={Database}
      brandLink={ROUTES.ADMIN.DASHBOARD}
    />
  );
}
