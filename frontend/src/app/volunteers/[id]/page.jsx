'use client';

import { useParams } from 'next/navigation';
import VolunteerProfileView from '@/components/VolunteerProfileView';

export default function VolunteerByIdPage() {
  const { id } = useParams();
  return <VolunteerProfileView id={id} />;
}
