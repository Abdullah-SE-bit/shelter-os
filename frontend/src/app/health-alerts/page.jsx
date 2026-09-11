'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, TriangleAlert, Siren, Syringe, AlertOctagon, Pill, Stethoscope, Scale, FileText, CheckCircle2, Cat, ChevronRight } from 'lucide-react';
import { mockHealthAlerts } from '@/lib/mock-data/wellness';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import { timeAgo, formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG = {
  INFO: { icon: Info, tone: 'bg-info/10 text-info', border: 'border-l-info', label: 'Info' },
  WARNING: { icon: TriangleAlert, tone: 'bg-warning/10 text-warning', border: 'border-l-warning', label: 'Warning' },
  CRITICAL: { icon: Siren, tone: 'bg-destructive/10 text-destructive', border: 'border-l-destructive', label: 'Critical' },
};

const ALERT_TYPE_CONFIG = {
  VACCINATION_DUE: { icon: Syringe, label: 'Vaccination due' },
  VACCINATION_OVERDUE: { icon: AlertOctagon, label: 'Vaccination overdue' },
  MISSED_DOSE: { icon: Pill, label: 'Missed medication' },
  CHECKUP_DUE: { icon: Stethoscope, label: 'Checkup due' },
  WEIGHT_CONCERN: { icon: Scale, label: 'Weight concern' },
  CUSTOM: { icon: FileText, label: 'Custom alert' },
};

export default function HealthAlertsPage() {
  const { user } = useAuth();
  const isVet = user?.role === 'VET';

  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [alerts, setAlerts] = useState(mockHealthAlerts);

  const filtered = alerts.filter((a) => (filterType === 'ALL' || a.alert_type === filterType) && (filterSeverity === 'ALL' || a.severity === filterSeverity));

  const handleResolve = (id) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by_name: `${user?.profile?.first_name} ${user?.profile?.last_name}` } : a)));

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <PageHeader title="Health alerts" description={isVet ? 'System-wide health monitoring alerts' : 'Health alerts for your animals'} />

      {isVet && (
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <span className="mb-2 block text-sm font-semibold text-foreground">Alert type</span>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'VACCINATION_DUE', 'VACCINATION_OVERDUE', 'MISSED_DOSE', 'CHECKUP_DUE', 'WEIGHT_CONCERN'].map((type) => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={cn('rounded-lg border-2 px-3.5 py-1.5 text-[13px] font-semibold transition-colors', filterType === type ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
                  {type === 'ALL' ? 'All types' : ALERT_TYPE_CONFIG[type]?.label || type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm font-semibold text-foreground">Severity</span>
            <div className="flex gap-2">
              {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((severity) => {
                const config = SEVERITY_CONFIG[severity];
                return (
                  <button key={severity} onClick={() => setFilterSeverity(severity)}
                    className={cn('flex items-center gap-1.5 rounded-lg border-2 px-3.5 py-1.5 text-[13px] font-semibold transition-colors', filterSeverity === severity ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
                    {config && <config.icon className="size-3.5" />}
                    {severity === 'ALL' ? 'All' : config?.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState icon={CheckCircle2} title="No health alerts" message={isVet ? 'No health alerts found in the system. All animals appear to be healthy!' : 'No health alerts for your animals. They appear to be healthy!'} />
      )}

      {filtered.length > 0 && (
        <>
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filtered.length}</strong> health alert{filtered.length !== 1 ? 's' : ''}
          </div>

          <div className="flex flex-col gap-4">
            {filtered.map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.WARNING;
              const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.CUSTOM;
              return (
                <div key={alert.id} className={cn('rounded-xl border border-l-4 border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md', sev.border, alert.severity === 'CRITICAL' && 'border-destructive/30')}>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase', sev.tone)}>
                          <sev.icon className="size-3" />{sev.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(alert.triggered_at)}</span>
                      </div>
                      <h3 className="flex items-center gap-2 text-[16px] font-bold text-foreground">
                        <typeConfig.icon className="size-5 text-muted-foreground" />
                        {typeConfig.label}
                      </h3>
                    </div>

                    {alert.cat && (
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/cats/${alert.cat}`}><Cat className="size-3.5" />{alert.cat_name || 'View animal'}<ChevronRight className="size-3.5" /></Link>
                      </Button>
                    )}
                  </div>

                  <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">{alert.message}</p>

                  {!alert.is_resolved && <Button size="sm" onClick={() => handleResolve(alert.id)}><CheckCircle2 className="size-3.5" />Mark as resolved</Button>}
                  {alert.is_resolved && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-success">
                      <CheckCircle2 className="size-4" />
                      Resolved{alert.resolved_at ? ` on ${formatDate(alert.resolved_at)}` : ''}
                      {alert.resolved_by_name && <span className="font-normal text-muted-foreground">by {alert.resolved_by_name}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
