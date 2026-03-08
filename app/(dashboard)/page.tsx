import { Suspense } from "react";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Dashboard</h1>
      <Suspense>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
