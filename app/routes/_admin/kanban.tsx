import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { useToast } from '../../providers/ToastProvider';
import InteractiveKanban from '../../components/InteractiveKanban';
import { JobApplication, ApplicationStatus } from '../../types/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const applications = await prisma.application.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { appliedDate: 'desc' }
  });
  
  return { applications };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'updateStatus') {
      const id = formData.get('id') as string;
      const status = formData.get('status') as any;
      
      await prisma.application.update({
        where: { id, userId: user.id },
        data: { status }
      });
      return { success: true, message: 'Status updated' };
    }

    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await prisma.application.update({
        where: { id, userId: user.id },
        data: { deletedAt: new Date() }
      });
      return { success: true, message: 'Application deleted' };
    }
    
    // Note: AddApplication and ViewApplication would ideally open a modal,
    // which could submit to this action with intent === 'create' or 'update'

    return { success: false, message: 'Invalid intent' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export default function KanbanRoute() {
  const { applications } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { info } = useToast();

  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus) => {
    // Optimistic UI update could go here, but fetcher will handle it automatically if we submit
    fetcher.submit(
      { intent: 'updateStatus', id, status: newStatus },
      { method: 'post' }
    );
  };

  const handleDeleteApplication = (id: string) => {
    fetcher.submit(
      { intent: 'delete', id },
      { method: 'post' }
    );
  };

  const handleViewApplication = (app: JobApplication) => {
    // TODO: Open modal with application details
    info(`View application: ${app.company}`);
  };

  const handleAddApplication = (status: ApplicationStatus) => {
    // TODO: Open modal to add application with pre-filled status
    info(`Add application with status: ${status}`);
  };

  // Convert Prisma Application to JobApplication type expected by component
  const mappedApplications = applications.map(app => ({
    ...app,
    appliedDate: app.appliedDate.toString(),
    deadline: app.deadline?.toString() || '',
    interviewDate: app.interviewDate?.toString() || '',
    status: app.status as ApplicationStatus,
    employmentType: app.employmentType as any,
    priority: app.priority as any,
    salary: app.salary || '',
    location: app.location || '',
    referral: app.referral || '',
    recruiter: app.recruiter || '',
    contact: app.contact || '',
    website: app.website || '',
    notes: app.notes || '',
    resumeUsed: app.resumeUsed || '',
    coverLetter: app.coverLetter || ''
  }));

  return (
    <div className="space-y-6 max-w-full">
      <InteractiveKanban 
        applications={mappedApplications as JobApplication[]}
        onUpdateStatus={handleUpdateStatus}
        onDeleteApplication={handleDeleteApplication}
        onViewApplication={handleViewApplication}
        onAddApplication={handleAddApplication}
      />
    </div>
  );
}
