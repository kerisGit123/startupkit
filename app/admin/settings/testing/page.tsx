"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, DollarSign, Shield, Search, Trash2, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TestingSettingsPage() {
  const testingSettings = useQuery(api.platformConfig.getByCategory, { category: "testing" });
  const batchSet = useMutation(api.platformConfig.batchSet);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [searchEmail, setSearchEmail] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "success" | "error">("idle");
  const [deletedUserEmail, setDeletedUserEmail] = useState("");
  
  const searchResults = useQuery(
    api.users.deleteUser.searchByEmail,
    searchEmail.length >= 3 ? { email: searchEmail } : "skip"
  );
  const deleteUser = useMutation(api.users.deleteUser.deleteUserFromConvex);

  const localSettings = useMemo(() => ({
    initialSignupCredits: (testingSettings?.initialSignupCredits as number) ?? 0,
    superAdminEmail: (testingSettings?.superAdminEmail as string) ?? "",
  }), [testingSettings]);

  const [credits, setCredits] = useState(localSettings.initialSignupCredits.toString());
  const [adminEmail, setAdminEmail] = useState(localSettings.superAdminEmail);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis will mark the user as deleted in Convex database.`)) {
      return;
    }

    setDeleteStatus("deleting");
    try {
      await deleteUser({
        userId,
        superAdminEmail: localSettings.superAdminEmail,
      });
      setDeleteStatus("success");
      setDeletedUserEmail(userEmail);
      setSearchEmail(""); // Clear search
      setTimeout(() => {
        setDeleteStatus("idle");
        setDeletedUserEmail("");
      }, 3000);
    } catch (error) {
      console.error("Failed to delete user:", error);
      setDeleteStatus("error");
      setTimeout(() => setDeleteStatus("idle"), 3000);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await batchSet({
        settings: [
          {
            key: "initialSignupCredits",
            value: parseInt(credits) || 0,
            category: "testing",
            description: "Credits given to new users on signup",
          },
          {
            key: "superAdminEmail",
            value: adminEmail,
            category: "testing",
            description: "Protected super admin email address",
          },
        ],
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save testing settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (testingSettings === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Testing & Configuration</h2>
        <p className="text-muted-foreground">
          Configure system settings and testing tools
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Initial Signup Credits</CardTitle>
          </div>
          <CardDescription>
            Set the number of credits given to new users when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signupCredits">Credits per New Signup</Label>
            <Input
              id="signupCredits"
              type="number"
              min="0"
              placeholder="0"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm font-medium text-green-900">Current Setting:</p>
            <p className="text-2xl font-bold text-green-700">{localSettings.initialSignupCredits} credits</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Super Admin Protection</CardTitle>
          </div>
          <CardDescription>
            Set the super admin email address (this user cannot be deleted)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="superAdminEmail">Super Admin Email</Label>
            <Input
              id="superAdminEmail"
              type="email"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          {!localSettings.superAdminEmail && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>No super admin set</strong><br />
                Set a super admin email to protect that account from deletion
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Delete Testing Users</CardTitle>
          </div>
          <CardDescription>
            Search for users by email and delete them from the Convex database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleteStatus === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                User <strong>{deletedUserEmail}</strong> deleted successfully!
              </AlertDescription>
            </Alert>
          )}

          {deleteStatus === "error" && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to delete user. They may be protected or an error occurred.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="searchEmail">Search by Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="searchEmail"
                type="email"
                placeholder="Enter email to search..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Type at least 3 characters to search
            </p>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.fullName || "-"}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id, user.email || "Unknown")}
                          disabled={deleteStatus === "deleting" || user.email === localSettings.superAdminEmail}
                        >
                          {deleteStatus === "deleting" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                        {user.email === localSettings.superAdminEmail && (
                          <p className="text-xs text-muted-foreground mt-1">Protected</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {searchEmail.length >= 3 && searchResults && searchResults.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No users found matching &quot;{searchEmail}&quot;
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={saveStatus === "saving"}
        className="w-full"
      >
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}
