"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfileSettingsPage() {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("billing_admin");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAssignRole = async () => {
    if (!searchEmail) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Admin role assigned successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Please enter a valid email address.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Role Assignment</CardTitle>
          <CardDescription>
            Search for users by email or name and assign admin roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail">User Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="userEmail"
                placeholder="Search by email or name..."
                className="pl-10"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Start typing to search for users by email or name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminRole">Admin Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="adminRole">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing_admin">Billing Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="content_admin">Content Admin</SelectItem>
                <SelectItem value="support_admin">Support Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select the admin role to assign to the user
            </p>
          </div>

          <Button onClick={handleAssignRole} className="w-full">
            Assign Admin Role
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
