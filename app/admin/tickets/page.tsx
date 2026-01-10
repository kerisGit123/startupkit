import { requireAdmin } from "@/lib/adminAuth";
import { Ticket } from "lucide-react";

export default async function TicketsPage() {
  const admin = await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-2">
          Manage customer support tickets and disputes
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Ticket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ticketing System Coming Soon
        </h2>
        <p className="text-gray-600">
          This page will show all support tickets, SLA tracking, and customer disputes.
        </p>
      </div>
    </div>
  );
}
