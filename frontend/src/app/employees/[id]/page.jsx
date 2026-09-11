'use client';

import { useParams } from 'next/navigation';
import EmployeeProfileView from '@/components/EmployeeProfileView';

export default function EmployeeByIdPage() {
  const { id } = useParams();
  return <EmployeeProfileView id={id} />;
}
