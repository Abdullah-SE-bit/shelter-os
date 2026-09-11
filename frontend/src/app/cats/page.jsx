'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Cat, Plus, LayoutGrid, List, Search } from 'lucide-react';
import { mockCats } from '@/lib/mock-data/cats';
import { mockShelters } from '@/lib/mock-data/shelters';
import usePagination from '@/hooks/usePagination';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { formatCatAge, statusLabel } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

const STATUS_TONE = {
  IN_SHELTER: 'bg-success/10 text-success',
  FOSTERED: 'bg-info/10 text-info',
  ADOPTED: 'bg-primary/10 text-primary',
  LOST: 'bg-destructive/10 text-destructive',
  DECEASED: 'bg-surface-muted text-muted-foreground',
  UNKNOWN: 'bg-warning/10 text-warning',
};

function StatusBadge({ status }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', STATUS_TONE[status] || STATUS_TONE.UNKNOWN)}>
      {statusLabel(status)}
    </span>
  );
}

export default function CatListPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const shelterParam = searchParams.get('shelter') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [shelter, setShelter] = useState(shelterParam);
  const [view, setView] = useState('grid');
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(20);

  const filtered = mockCats.filter((cat) => {
    if (search && !`${cat.name} ${cat.breed_label} ${cat.color}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && cat.current_status !== status) return false;
    if (shelter && cat.shelter_id !== shelter) return false;
    return true;
  });
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const cats = filtered.slice((page - 1) * pageSize, page * pageSize);

  const canCreate = !!user;
  const createPath = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role) ? '/cats/create' : '/cats/register';

  const handleSearchChange = (v) => { setSearch(v); reset(); };
  const handleStatusChange = (v) => { setStatus(v); reset(); };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="All animals"
        description={`${total} animals registered in the system`}
        actions={canCreate && <Button asChild><Link href={createPath}><Plus className="size-4" />Add animal</Link></Button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by name, breed, color…" className="pl-9" />
        </div>

        <NativeSelect value={status} onChange={(e) => handleStatusChange(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All statuses</option>
          <option value="IN_SHELTER">In shelter</option>
          <option value="FOSTERED">Fostered</option>
          <option value="ADOPTED">Adopted</option>
          <option value="LOST">Lost</option>
          <option value="DECEASED">Deceased</option>
        </NativeSelect>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
          <NativeSelect value={shelter} onChange={(e) => { setShelter(e.target.value); reset(); }} className="w-auto min-w-[150px]">
            <option value="">All shelters</option>
            {mockShelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </NativeSelect>
        )}

        <div className="flex overflow-hidden rounded-md border border-border">
          {[{ v: 'grid', Icon: LayoutGrid }, { v: 'table', Icon: List }].map(({ v, Icon }) => (
            <button key={v} onClick={() => setView(v)} className={cn('flex items-center justify-center px-2.5 py-1.5', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-hover')}>
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {cats.length === 0 && (
        <EmptyState icon={Cat} title="No animals found" message="Try adjusting your search filters."
          action={canCreate && <Button asChild><Link href={createPath}><Plus className="size-4" />Add first animal</Link></Button>} />
      )}

      {view === 'grid' && cats.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link key={cat.id} href={`/cats/${cat.id}`} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={cat.primary_photo_url || CAT_PLACEHOLDER}
                  alt={cat.name}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                />
                <div className="absolute top-2 right-2"><StatusBadge status={cat.current_status} /></div>
              </div>
              <div className="p-3.5">
                <h3 className="text-sm font-bold text-foreground">{cat.name || 'Unnamed'}</h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{cat.breed_label || 'Mixed'} · {formatCatAge(cat.age_years, cat.age_months)}</p>
                {cat.shelter_name ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">{cat.shelter_name}</p>
                ) : cat.owner_name && <p className="mt-1.5 text-xs text-muted-foreground">{cat.owner_name}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {view === 'table' && cats.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Animal</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shelter</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <img src={cat.primary_photo_url || CAT_PLACEHOLDER} alt="" className="size-9 shrink-0 rounded-md object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                      <span className="font-semibold text-foreground">{cat.name || 'Unnamed'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cat.breed_label || 'Mixed'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCatAge(cat.age_years, cat.age_months)}</TableCell>
                  <TableCell><StatusBadge status={cat.current_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cat.shelter_name || cat.owner_name || '—'}</TableCell>
                  <TableCell><Button size="sm" variant="secondary" asChild><Link href={`/cats/${cat.id}`}>View</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
