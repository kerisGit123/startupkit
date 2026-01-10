"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Search } from "lucide-react";

type AdminRole = "super_admin" | "billing_admin" | "support_admin";

interface ClerkUser {
  id: string;
  email: string;
  fullName: string;
  imageUrl?: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("billing_admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchResults, setSearchResults] = useState<ClerkUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
        setShowDropdown(data.users.length > 0);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const selectUser = (user: ClerkUser) => {
    setEmail(user.email);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: selectedRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Successfully assigned ${selectedRole} role to ${email}` });
        setEmail("");
        setSearchResults([]);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to assign role" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and set e-mail preferences.</p>
        </div>
        
        <div className="border-b mb-6"></div>
        
        <div className="flex gap-12">
          {/* Left Sidebar Navigation */}
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-0 py-1 text-sm ${activeTab === "profile" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("account")}
                className={`w-full text-left px-0 py-1 text-sm ${activeTab === "account" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Account
              </button>
              <button 
                onClick={() => setActiveTab("appearance")}
                className={`w-full text-left px-0 py-1 text-sm ${activeTab === "appearance" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Appearance
              </button>
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-0 py-1 text-sm ${activeTab === "notifications" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Notifications
              </button>
              <button 
                onClick={() => setActiveTab("display")}
                className={`w-full text-left px-0 py-1 text-sm ${activeTab === "display" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Display
              </button>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Profile</h2>
                  <p className="text-sm text-muted-foreground mt-1">This is how others will see you on the site.</p>
                </div>
                <form onSubmit={handleInviteAdmin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    User Email
                  </label>
                  <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onFocus={() => email.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search by email or name..."
                required
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                autoComplete="off"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 border-b border-border last:border-0">
                      {user.imageUrl && (
                        <img src={user.imageUrl} alt={user.fullName} className="w-8 h-8 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start typing to search for users by email or name
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium text-foreground">
                    Admin Role
                  </label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="billing_admin">Billing Admin</option>
                    <option value="support_admin">Support Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {message && (
                  <div className={`flex items-center gap-2 p-4 rounded-md border ${
                    message.type === "success" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-destructive/10 border-destructive/20"
                  }`}>
                    {message.type === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <p className={`text-sm ${
                      message.type === "success" ? "text-green-800" : "text-destructive"
                    }`}>
                      {message.text}
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                  >
                    {loading ? "Assigning..." : "Assign Admin Role"}
                  </button>
                </div>
              </form>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage your account settings.</p>
                </div>
                <p className="text-sm text-muted-foreground">Account settings coming soon...</p>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
                  <p className="text-sm text-muted-foreground mt-1">Customize the appearance of the admin panel.</p>
                </div>
                <p className="text-sm text-muted-foreground">Appearance settings coming soon...</p>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">Configure your notification preferences.</p>
                </div>
                <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
              </div>
            )}

            {activeTab === "display" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Display</h2>
                  <p className="text-sm text-muted-foreground mt-1">Adjust display settings.</p>
                </div>
                <p className="text-sm text-muted-foreground">Display settings coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

