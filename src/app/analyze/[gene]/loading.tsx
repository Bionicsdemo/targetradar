import { Header } from '@/components/layout/header';
import { AnalysisSkeleton } from '@/components/layout/loading-skeleton';

export default function AnalyzeLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalysisSkeleton />
      </main>
    </div>
  );
}
