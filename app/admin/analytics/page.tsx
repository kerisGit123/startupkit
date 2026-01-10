import { requireAdmin } from "@/lib/adminAuth";
import { BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const admin = await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Revenue analytics, MRR, ARR, and churn metrics
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h2>
        <p className="text-gray-600">
          This page will display MRR, ARR, churn rate, customer lifetime value, and more.
        </p>
      </div>
    </div>
  );
}
