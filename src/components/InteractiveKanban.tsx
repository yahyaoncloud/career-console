import { JobApplication, ApplicationStatus } from '../types/types';
import { ArrowLeft, ArrowRight, Eye, Briefcase, Trash2, Plus } from 'lucide-react';
import { useToast } from './ui/Toast';

interface InteractiveKanbanProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onViewApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onAddApplication: (status: ApplicationStatus) => void;
}

const COLUMNS: Array<{ label: string; status: ApplicationStatus }> = [
  { label: 'Wishlist', status: 'Wishlist' },
  { label: 'Applied', status: 'Applied' },
  { label: 'HR Screening', status: 'HR Screening' },
  { label: 'Technical', status: 'Technical' },
  { label: 'Manager Round', status: 'Manager Round' },
  { label: 'Final Round', status: 'Final Round' },
  { label: 'Offer', status: 'Offer' },
  { label: 'Accepted', status: 'Accepted' },
  { label: 'Rejected', status: 'Rejected' },
  { label: 'Archived', status: 'Archived' },
];

export default function InteractiveKanban({
  applications,
  onUpdateStatus,
  onViewApplication,
  onDeleteApplication,
  onAddApplication,
}: InteractiveKanbanProps) {
  const { confirm } = useToast();
  const getNextStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = COLUMNS.findIndex((c) => c.status === current);
    if (idx !== -1 && idx < COLUMNS.length - 1) {
      return COLUMNS[idx + 1].status;
    }
    return null;
  };

  const getPrevStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = COLUMNS.findIndex((c) => c.status === current);
    if (idx > 0) {
      return COLUMNS[idx - 1].status;
    }
    return null;
  };

  return (
    <div className="space-y-4" id="kanban-board-module">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
          <Briefcase size={16} className="mr-2 text-zinc-500" />
          Interactive Kanban Board
        </h3>
        <span className="mono-text text-[10px] text-zinc-500 block">
          Visual Tracking Pipeline and Stage Controls
        </span>
      </div>

      {/* Kanban Scrollable Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-[2400px]">
          {COLUMNS.map((col) => {
            const columnApps = applications.filter((app) => app.status === col.status);

            return (
              <div
                key={col.status}
                className="w-64 bg-zinc-100/50 dark:bg-zinc-900/40 p-4 rounded border border-zinc-200 dark:border-zinc-800 flex flex-col space-y-3"
                id={`kanban-col-${col.status}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="mono-text text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {col.label.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddApplication(col.status)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Add Application"
                    >
                      <Plus size={12} />
                    </button>
                    <span className="mono-text text-[10px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                      {columnApps.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 min-h-[350px]">
                  {columnApps.length === 0 ? (
                    <div className="h-full flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded p-4 text-center">
                      <span className="mono-text text-[10px] text-zinc-400">Stage is empty</span>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const next = getNextStatus(app.status);
                      const prev = getPrevStatus(app.status);

                      return (
                        <div
                          key={app.id}
                          className="bg-white dark:bg-zinc-950 p-3.5 rounded border border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="serif-header text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-36">
                                {app.company}
                              </h4>
                              <span
                                className={`mono-text text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  app.priority === 'High'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                                    : app.priority === 'Medium'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                {app.priority}
                              </span>
                            </div>
                            <p className="mono-text text-xs text-zinc-500 dark:text-zinc-400 truncate">
                              {app.position}
                            </p>
                          </div>

                          {app.interviewDate && (
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800/80">
                              <span className="mono-text text-[8px] text-zinc-400 uppercase block">INT_DATE:</span>
                              <span className="mono-text text-[9px] text-zinc-700 dark:text-zinc-300 font-medium">
                                {new Date(app.interviewDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => onViewApplication(app)}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                                title="Inspect Application Details"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  confirm({
                                    title: `Remove ${app.company}?`,
                                    description: 'This application will be permanently deleted.',
                                    confirmLabel: 'Delete',
                                    onConfirm: () => onDeleteApplication(app.id),
                                  });
                                }}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <div className="flex space-x-1">
                              {prev && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, prev)}
                                  className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                  title={`Move to ${prev}`}
                                >
                                  <ArrowLeft size={10} />
                                </button>
                              )}
                              {next && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, next)}
                                  className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                  title={`Move to ${next}`}
                                >
                                  <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
