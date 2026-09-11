'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound, LogOut, Eye, CheckCircle2, AlertTriangle, ScrollText } from 'lucide-react';
import { mockAuditLogs } from '@/lib/mock-data/audit';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDateTime } from '@/utils/dateUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CAMPAIGN_COMPLETED', 'CAMPAIGN_INCOMPLETE'];

const ACTION_META = {
  CREATE: { icon: Plus, tone: 'bg-success/10 text-success', label: 'CREATE' },
  UPDATE: { icon: Pencil, tone: 'bg-info/10 text-info', label: 'UPDATE' },
  DELETE: { icon: Trash2, tone: 'bg-destructive/10 text-destructive', label: 'DELETE' },
  LOGIN: { icon: KeyRound, tone: 'bg-primary/10 text-primary', label: 'LOGIN' },
  LOGOUT: { icon: LogOut, tone: 'bg-surface-muted text-muted-foreground', label: 'LOGOUT' },
  VIEW: { icon: Eye, tone: 'bg-surface-muted text-muted-foreground', label: 'VIEW' },
  CAMPAIGN_COMPLETED: { icon: CheckCircle2, tone: 'bg-success/10 text-success', label: 'CAMPAIGN COMPLETE' },
  CAMPAIGN_INCOMPLETE: { icon: AlertTriangle, tone: 'bg-destructive/10 text-destructive', label: 'CAMPAIGN NOT COMPLETE' },
};

export default function AuditLogsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(25);
  const [actionFilter, setActionFilter] = useState('');

  const filtered = actionFilter ? mockAuditLogs.filter((l) => l.action === actionFilter) : mockAuditLogs;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const logs = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Audit Log" description={`${total} log entries · Full audit trail`} />

      <div className="mb-6 flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const meta = ACTION_META[a];
          const active = actionFilter === a;
          return (
            <button
              key={a || 'ALL'}
              onClick={() => { setActionFilter(a); reset(); }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong',
              )}
            >
              {meta && <meta.icon className="size-3.5" />}
              {a ? meta.label : 'All actions'}
            </button>
          );
        })}
      </div>

      {logs.length === 0 && (
        <EmptyState icon={ScrollText} title="No logs found" message="No audit entries match the current filter." />
      )}

      {logs.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || ACTION_META.VIEW;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', meta.tone)}>
                        <meta.icon className="size-3" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-foreground">{log.actor_name || log.actor_email || 'System'}</div>
                      {log.actor_role && <div className="text-xs text-muted-foreground">{log.actor_role}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {log.entity_type && <span className="text-primary">{log.entity_type}</span>}
                        {log.entity_id && <span className="text-muted-foreground"> #{String(log.entity_id).slice(0, 8)}</span>}
                      </div>
                      {log.new_value?.message && <div className="mt-0.5 text-xs text-muted-foreground">{log.new_value.message}</div>}
                    </TableCell>
                    <TableCell className="max-w-[200px] overflow-hidden text-ellipsis text-sm text-muted-foreground">{log.actor_email || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(log.performed_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
