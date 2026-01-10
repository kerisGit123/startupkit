import { requireAdminRole } from "@/lib/adminAuth";
import { Shield } from "lucide-react";

export default async function AdminSettingsPage() {
  await requireAdminRole("super_admin");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage admin users and system configuration
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Admin User Management
          </h2>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Admin roles are managed through Clerk metadata.
              To assign admin roles, use the API endpoint at{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                POST /api/admin/assign-role
              </code>
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Admin Role Hierarchy
            </h3>
            <div className="space-y-3">
              <RoleCard
                role="Super Admin"
                description="Full system access, user management, all features"
                color="purple"
              />
              <RoleCard
                role="Billing Admin"
                description="Subscriptions, purchases, refunds, financial reports"
                color="blue"
              />
              <RoleCard
                role="Support Admin"
                description="Tickets, customer support, read-only subscription access"
                color="green"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  description,
  color,
}: {
  role: string;
  description: string;
  color: "purple" | "blue" | "green";
}) {
  const colors = {
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors[color]}`}
          >
            {role}
          </span>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}
