import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { isAdminAuthenticated } from '@/lib/auth/adminAuth';
import { getAdminTelemetry } from '@/lib/services/adminTelemetryService';

export const metadata: Metadata = {
  title: 'Admin Intelligence Telemetry & Percentage Analytics',
  description: 'Privileged real-time percentage breakdown out of 100%, multi-graph metrics, and pipeline controls.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated();

  // If not authenticated, redirect to admin login
  if (!isAuth) {
    redirect('/admin/login');
  }

  const telemetry = await getAdminTelemetry();

  return (
    <>
      <TopHeader
        title="Admin Intelligence Telemetry"
        description="Privileged operational metrics, 100% normalized distributions, and real-time pipeline telemetry."
      />
      <PageContainer className="max-w-7xl">
        <AdminDashboardView initialTelemetry={telemetry} />
      </PageContainer>
    </>
  );
}
