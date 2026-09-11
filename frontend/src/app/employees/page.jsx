'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Stethoscope, Car, HeartHandshake, Home, Siren, Briefcase, Camera, Wrench, HandHeart, Users } from 'lucide-react';
import { mockEmployees } from '@/lib/mock-data/users';
import { mockShelterChangeRequests } from '@/lib/mock-data/users';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const SKILL_ICONS = { Rescue: Siren, Transport: Car, 'Foster coordination': Home, 'Pet socialization': HandHeart, 'Dog walking': Briefcase, Photography: Camera, 'Adoption events': HeartHandshake };

export default function EmployeeListPage() {
  const [search, setSearch] = useState('');
  const [avail, setAvail] = useState(false);
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);
  const [requests, setRequests] = useState(mockShelterChangeRequests);

  const filtered = mockEmployees.filter((v) => {
    if (search && !`${v.name} ${v.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (avail && !v.is_approved) return false;
    return true;
  });
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const employees = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDecision = (reqId) => setRequests((rs) => rs.filter((r) => r.id !== reqId));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Employees" description={`${total} registered employees`} />

      {requests.length > 0 && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-card p-5">
          <h3 className="mb-3.5 text-[15px] font-bold text-foreground">Pending shelter-change requests ({requests.length})</h3>
          <div className="flex flex-col gap-2.5">
            {requests.map((req) => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3">
                <div className="text-sm">
                  <strong className="text-foreground">{req.employee_name}</strong> wants to move{' '}
                  {req.from_shelter_name ? <>from <strong className="text-foreground">{req.from_shelter_name}</strong> </> : ''}
                  to <strong className="text-foreground">{req.to_shelter_name}</strong>
                  {req.reason && <div className="mt-1 text-xs text-muted-foreground">"{req.reason}"</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleDecision(req.id)}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecision(req.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3.5 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} placeholder="Search by name or skill…" className="pl-9" />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
          <Checkbox checked={avail} onCheckedChange={(v) => { setAvail(v); reset(); }} />
          Approved only
        </label>
      </div>

      {employees.length === 0 && (
        <EmptyState icon={Users} title="No employees found" message={search ? `No employees match "${search}"` : 'No employees registered yet.'} />
      )}

      {employees.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {employees.map((vol) => {
            const [first, ...rest] = vol.name.split(' ');
            return (
              <Link key={vol.id} href={`/employees/${vol.id}`} className="rounded-xl border border-border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md">
                <div className="relative mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {initials(first, rest.join(' '))}
                  {vol.is_approved && <div className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card bg-success" title="Approved" />}
                </div>

                <h3 className="text-[15px] font-bold text-foreground">{vol.name}</h3>
                <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{vol.shelter_name}</p>

                <div className="flex flex-wrap justify-center gap-1.5">
                  {(vol.skills || []).slice(0, 3).map((skill) => {
                    const Icon = SKILL_ICONS[skill] || Wrench;
                    return (
                      <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <Icon className="size-2.5" />
                        {skill}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-3.5 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                  <HeartHandshake className="size-3.5" />
                  {vol.active_assignments || 0} active assignments
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
