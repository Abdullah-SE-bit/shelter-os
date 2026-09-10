import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, Car, HeartHandshake, Home, Siren, Briefcase, Camera, Wrench, HandHeart, Users } from 'lucide-react';
import { volunteerApi } from '@/api/volunteersApi';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const SKILL_ICONS = { MEDICAL: Stethoscope, TRANSPORT: Car, SOCIALIZING: HandHeart, FOSTERING: Home, RESCUE: Siren, ADMIN: Briefcase, PHOTOGRAPHY: Camera };

export default function VolunteerListPage() {
  const [search, setSearch] = useState('');
  const [avail, setAvail] = useState(false);
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);

  const { data, loading } = useApi(
    () => volunteerApi.list({ page, page_size: pageSize, search: search || undefined, online_now: avail || undefined }),
    null,
    [page, search, avail],
  );

  const { data: reqData, refetch: refetchReqs } = useApi(() => volunteerApi.listShelterChangeRequests({ status: 'PENDING' }), null, []);
  const pendingRequests = reqData || [];

  const handleDecision = async (reqId, decision) => {
    try {
      if (decision === 'approve') await volunteerApi.approveShelterChange(reqId);
      else await volunteerApi.rejectShelterChange(reqId);
      refetchReqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed.');
    }
  };

  const volunteers = data?.results || [];
  const total = data?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Volunteers" description={`${total} registered volunteers`} />

      {pendingRequests.length > 0 && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-card p-5">
          <h3 className="mb-3.5 text-[15px] font-bold text-foreground">Pending shelter-change requests ({pendingRequests.length})</h3>
          <div className="flex flex-col gap-2.5">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3">
                <div className="text-sm">
                  <strong className="text-foreground">{req.volunteer_name}</strong> wants to move{' '}
                  {req.from_shelter_name ? <>from <strong className="text-foreground">{req.from_shelter_name}</strong> </> : ''}
                  to <strong className="text-foreground">{req.to_shelter_name}</strong>
                  {req.reason && <div className="mt-1 text-xs text-muted-foreground">"{req.reason}"</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleDecision(req.id, 'approve')}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecision(req.id, 'reject')}>Reject</Button>
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
          Online now
        </label>
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading volunteers…" />}

      {!loading && volunteers.length === 0 && (
        <EmptyState icon={Users} title="No volunteers found" message={search ? `No volunteers match "${search}"` : 'No volunteers registered yet.'} />
      )}

      {!loading && volunteers.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {volunteers.map((vol) => (
            <Link key={vol.id} to={`/volunteers/${vol.id}`} className="rounded-xl border border-border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md">
              <div className="relative mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {vol.profile_photo ? <img src={vol.profile_photo} alt="" className="size-full rounded-full object-cover" /> : initials(vol.first_name, vol.last_name)}
                {vol.is_online && <div className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card bg-success" title="Online now" />}
              </div>

              <h3 className="text-[15px] font-bold text-foreground">{vol.first_name} {vol.last_name}</h3>
              {vol.city && <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{vol.city}</p>}

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
                {vol.completed_assignments || 0} assignments
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
