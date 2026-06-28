import { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types/types';
import { Search, SlidersHorizontal, ArrowUpDown, FileDown, PlusCircle, Eye, Trash2, Edit2, Sparkles, RefreshCcw, CheckCircle } from 'lucide-react';
import { useToast } from './ui/Toast';

interface ApplicationsTableProps {
  applications: JobApplication[];
  onViewApplication: (app: JobApplication) => void;
  onEditApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onAddNewClick: () => void;
  onPushToGoogleSheets: () => void;
  isSyncingSheets: boolean;
  sheetsUrl: string | null;
}

export default function ApplicationsTable({
  applications,
  onViewApplication,
  onEditApplication,
  onDeleteApplication,
  onAddNewClick,
  onPushToGoogleSheets,
  isSyncingSheets,
  sheetsUrl,
}: ApplicationsTableProps) {
  const { confirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof JobApplication>('appliedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Company', 'Position', 'Location', 'Salary', 'Type', 'Applied Date', 'Deadline', 'Priority', 'Status', 'Notes'];
    const rows = applications.map((app) => [
      app.company,
      app.position,
      app.location,
      app.salary,
      app.employmentType,
      app.appliedDate,
      app.deadline,
      app.priority,
      app.status,
      app.notes.replace(/\n/g, ' '),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'job_applications_audit_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorting
  const handleSort = (field: keyof JobApplication) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter application list
  const filteredApps = applications
    .filter((app) => {
      const matchSearch =
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.tags && app.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || app.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-4" id="applications-table-module">
      {/* Table Header / Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <h3 className="serif-header text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Job Application Tracker
          </h3>
          <p className="mono-text text-[10px] text-zinc-500">
            System Records · Showing {filteredApps.length} of {applications.length} entries
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Push to Sheets */}
          <button
            onClick={onPushToGoogleSheets}
            disabled={isSyncingSheets}
            className="flex items-center space-x-1.5 mono-text text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
            id="btn-google-sheets-sync"
          >
            <RefreshCcw size={12} className={isSyncingSheets ? 'animate-spin' : ''} />
            <span>{isSyncingSheets ? 'Syncing Sheets...' : 'Sync with Google Sheets'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 mono-text text-xs bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            id="btn-csv-export"
          >
            <FileDown size={12} />
            <span>EXPORT_CSV</span>
          </button>

          {/* Create Application */}
          <button
            onClick={onAddNewClick}
            className="flex items-center space-x-1.5 mono-text text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-3 py-1.5 rounded border border-zinc-800 dark:border-zinc-200 hover:opacity-85 transition-opacity cursor-pointer font-medium"
            id="btn-add-application"
          >
            <PlusCircle size={12} />
            <span>LOG_APPLICATION</span>
          </button>
        </div>
      </div>

      {/* Sheets Success Indicator */}
      {sheetsUrl && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded border border-emerald-200 dark:border-emerald-900/40 text-xs flex justify-between items-center text-emerald-800 dark:text-emerald-400">
          <div className="flex items-center space-x-2">
            <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="mono-text">DATASET_SUCCESSFULLY_SYNCHRONIZED_WITH_DRIVE</span>
          </div>
          <a
            href={sheetsUrl}
            target="_blank"
            referrerPolicy="no-referrer"
            className="mono-text underline hover:opacity-80"
          >
            OPEN_SPREADSHEET_↗
          </a>
        </div>
      )}

      {/* Filters Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-100 dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
        {/* Search */}
        <div className="relative flex items-center col-span-1 sm:col-span-1">
          <Search size={14} className="absolute left-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search company, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs mono-text text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
            id="search-input"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="mono-text text-[10px] text-zinc-400">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs mono-text text-zinc-800 dark:text-zinc-200 focus:outline-none"
            id="filter-status"
          >
            <option value="ALL">ALL_STATES</option>
            <option value="Wishlist">WISHLIST</option>
            <option value="Applied">APPLIED</option>
            <option value="HR Screening">HR_SCREENING</option>
            <option value="Technical">TECHNICAL</option>
            <option value="Manager Round">MANAGER_ROUND</option>
            <option value="Final Round">FINAL_ROUND</option>
            <option value="Offer">OFFER</option>
            <option value="Accepted">ACCEPTED</option>
            <option value="Rejected">REJECTED</option>
            <option value="Archived">ARCHIVED</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <span className="mono-text text-[10px] text-zinc-400">PRIORITY:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs mono-text text-zinc-800 dark:text-zinc-200 focus:outline-none"
            id="filter-priority"
          >
            <option value="ALL">ALL_PRIORITY</option>
            <option value="High">HIGH</option>
            <option value="Medium">MEDIUM</option>
            <option value="Low">LOW</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto rounded border border-zinc-250 dark:border-zinc-800">
        <table className="w-full text-left border-collapse bg-white dark:bg-zinc-950">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 mono-text text-[10px] text-zinc-500 uppercase tracking-wider">
              <th className="p-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('company')}>
                <div className="flex items-center space-x-1"><span>COMPANY</span> <ArrowUpDown size={10} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('position')}>
                <div className="flex items-center space-x-1"><span>POSITION</span> <ArrowUpDown size={10} /></div>
              </th>
              <th className="p-3 hidden md:table-cell cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('appliedDate')}>
                <div className="flex items-center space-x-1"><span>APPLIED_DATE</span> <ArrowUpDown size={10} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('priority')}>
                <div className="flex items-center space-x-1"><span>PRIORITY</span> <ArrowUpDown size={10} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('status')}>
                <div className="flex items-center space-x-1"><span>STATUS</span> <ArrowUpDown size={10} /></div>
              </th>
              <th className="p-3 hidden lg:table-cell">TAGS</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {filteredApps.length === 0 ? (
              <tr key="no-results">
                <td colSpan={7} className="p-8 text-center text-zinc-400 mono-text text-xs">
                  NO_ACTIVE_RECORDS_MATCH_FILTER_CRITERIA
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app.id || app._id || Math.random()}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-750 dark:text-zinc-300"
                >
                  <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center space-x-2">
                      <span className="serif-header font-bold text-sm">{app.company}</span>
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                        >
                          <SlidersHorizontal size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3 mono-text text-zinc-600 dark:text-zinc-400">
                    {app.position}
                  </td>
                  <td className="p-3 hidden md:table-cell mono-text text-[11px]">
                    {app.appliedDate}
                  </td>
                  <td className="p-3">
                    <span
                      className={`mono-text text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        app.priority === 'High'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          : app.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {app.priority}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                        app.status === 'Offer'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400'
                          : app.status === 'Rejected'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900 text-red-800 dark:text-red-400'
                          : app.status === 'Technical' || app.status === 'Manager Round' || app.status === 'Final Round'
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900 text-blue-800 dark:text-blue-400'
                          : 'bg-zinc-55 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {app.tags.map((t) => (
                        <span key={t} className="mono-text text-[9px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1 py-0.2 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onViewApplication(app)}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                        title="View Application Details"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => onEditApplication(app)}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          confirm({
                            title: `Delete ${app.company}?`,
                            description: 'Application records will be permanently removed.',
                            confirmLabel: 'Delete',
                            onConfirm: () => onDeleteApplication(app.id || app._id),
                          });
                        }}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-500 transition-colors"
                        title="Delete Records"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
