import { JobApplication, ApplicationStatus } from '../types/types';
import { ArrowLeft, ArrowRight, Eye, Briefcase, Trash2, Plus } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';

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
      <div className="border-b border-border/50 pb-2">
        <h3 className="font-bold font-sans text-lg tracking-tight text-foreground flex items-center">
          <Briefcase size={16} className="mr-2 text-muted-foreground" />
          Interactive Kanban Board
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
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
                className="w-64 bg-muted/30 p-4 rounded border border-border/50 flex flex-col space-y-3"
                id={`kanban-col-${col.status}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddApplication(col.status)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Add Application"
                    >
                      <Plus size={12} />
                    </button>
                    <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {columnApps.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 min-h-[350px]">
                  {columnApps.length === 0 ? (
                    <div className="h-full flex items-center justify-center border border-dashed border-border/50 rounded p-4 text-center">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">Stage is empty</span>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const next = getNextStatus(app.status);
                      const prev = getPrevStatus(app.status);

                      return (
                        <div
                          key={app.id}
                          className="bg-card/50 backdrop-blur-sm p-3.5 rounded border border-border/50 hover:border-border transition-colors shadow-sm space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold font-sans text-sm text-foreground truncate flex-1">
                                {app.company}
                              </h4>
                              <span
                                className={`font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${
                                  app.priority === 'High'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    : app.priority === 'Medium'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {app.priority}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground truncate">
                              {app.position}
                            </p>
                          </div>

                          {app.interviewDate && (
                            <div className="bg-muted/50 p-1.5 rounded border border-border/50 flex justify-between items-center">
                              <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">INT_DATE:</span>
                              <span className="font-mono text-[9px] text-foreground font-bold">
                                {new Date(app.interviewDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex justify-between items-center pt-2 border-t border-border/50">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => onViewApplication(app)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
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
                                className="p-1 rounded hover:bg-muted text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <div className="flex space-x-1">
                              {prev && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, prev)}
                                  className="p-1 rounded border border-border/50 hover:bg-muted text-muted-foreground"
                                  title={`Move to ${prev}`}
                                >
                                  <ArrowLeft size={10} />
                                </button>
                              )}
                              {next && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, next)}
                                  className="p-1 rounded border border-border/50 hover:bg-muted text-muted-foreground"
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
