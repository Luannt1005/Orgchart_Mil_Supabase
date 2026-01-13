'use client';

import SheetManagerTable from '@/components/SheetManagerTable';

export default function SheetManagerPage() {
  return (
    <SheetManagerTable
      enableApproval={false}
      enableDeleteAll={false}
    />
  );
}