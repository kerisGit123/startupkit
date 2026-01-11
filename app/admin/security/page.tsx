"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Globe, MapPin } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { COUNTRIES } from "@/lib/countries";

export default function SecurityPage() {
  const { user } = useUser();
  const [ipInput, setIpInput] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryReason, setCountryReason] = useState("");
  const [isAddingIp, setIsAddingIp] = useState(false);
  const [isAddingCountry, setIsAddingCountry] = useState(false);

  const blacklistedIps = useQuery(api.ipBlocking.getBlacklistedIps, {});
  const blacklistedCountries = useQuery(api.ipBlocking.getBlacklistedCountries, {});
  const stats = useQuery(api.ipBlocking.getBlockingStats);

  const addIpToBlacklist = useMutation(api.ipBlocking.addIpToBlacklist);
  const removeIpFromBlacklist = useMutation(api.ipBlocking.removeIpFromBlacklist);
  const addCountryToBlacklist = useMutation(api.ipBlocking.addCountryToBlacklist);
  const removeCountryFromBlacklist = useMutation(api.ipBlocking.removeCountryFromBlacklist);

  const handleAddIp = async () => {
    if (!ipInput.trim() || !user) return;

    try {
      const result = await addIpToBlacklist({
        ipAddress: ipInput.trim(),
        reason: ipReason.trim() || undefined,
        blockedBy: user.id,
      });

      if (result.success) {
        alert(result.message);
        setIpInput("");
        setIpReason("");
        setIsAddingIp(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error adding IP:", error);
      alert("Failed to add IP to blacklist");
    }
  };

  const handleRemoveIp = async (ipAddress: string) => {
    if (!confirm(`Remove ${ipAddress} from blacklist?`)) return;

    try {
      const result = await removeIpFromBlacklist({ ipAddress });
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error removing IP:", error);
      alert("Failed to remove IP from blacklist");
    }
  };

  const handleAddCountry = async () => {
    if (!countryCode.trim() || !countryName.trim() || !user) return;

    try {
      const result = await addCountryToBlacklist({
        countryCode: countryCode.trim().toUpperCase(),
        countryName: countryName.trim(),
        reason: countryReason.trim() || undefined,
        blockedBy: user.id,
      });

      if (result.success) {
        alert(result.message);
        setCountryCode("");
        setCountryName("");
        setCountryReason("");
        setIsAddingCountry(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error adding country:", error);
      alert("Failed to add country to blacklist");
    }
  };

  const handleRemoveCountry = async (code: string) => {
    if (!confirm(`Remove country ${code} from blacklist?`)) return;

    try {
      const result = await removeCountryFromBlacklist({ countryCode: code });
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error removing country:", error);
      alert("Failed to remove country from blacklist");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Access Control</h1>
        <p className="text-muted-foreground">Manage IP and country-based access restrictions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active IP Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeIpCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Country Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCountryCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total IP Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIpCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Country Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCountryCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* IP Blacklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>IP Address Blacklist</CardTitle>
            </div>
            <Button
              onClick={() => setIsAddingIp(!isAddingIp)}
              size="sm"
              variant={isAddingIp ? "outline" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingIp ? "Cancel" : "Add IP"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingIp && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div>
                <label className="text-sm font-medium">IP Address</label>
                <Input
                  placeholder="192.168.1.100"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Why is this IP being blocked?"
                  value={ipReason}
                  onChange={(e) => setIpReason(e.target.value)}
                  rows={2}
                />
              </div>
              <Button onClick={handleAddIp} className="w-full">
                Add to Blacklist
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {!blacklistedIps || blacklistedIps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No IP addresses blocked
              </p>
            ) : (
              <div className="space-y-2">
                {blacklistedIps.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-mono font-medium">{entry.ipAddress}</span>
                        {entry.isActive ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      {entry.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked: {formatDate(entry.blockedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIp(entry.ipAddress)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Country Blacklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <CardTitle>Country Blacklist</CardTitle>
            </div>
            <Button
              onClick={() => setIsAddingCountry(!isAddingCountry)}
              size="sm"
              variant={isAddingCountry ? "outline" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingCountry ? "Cancel" : "Add Country"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingCountry && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div>
                <label className="text-sm font-medium">Select Country</label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  value={countryCode}
                  onChange={(e) => {
                    const selected = COUNTRIES.find(c => c.code === e.target.value);
                    if (selected) {
                      setCountryCode(selected.code);
                      setCountryName(selected.name);
                    }
                  }}
                >
                  <option value="">-- Select a country --</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {countryCode && `Selected: ${countryName} (${countryCode})`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Why is this country being blocked?"
                  value={countryReason}
                  onChange={(e) => setCountryReason(e.target.value)}
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleAddCountry} 
                className="w-full"
                disabled={!countryCode}
              >
                Add to Blacklist
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {!blacklistedCountries || blacklistedCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No countries blocked
              </p>
            ) : (
              <div className="space-y-2">
                {blacklistedCountries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{entry.countryName}</span>
                        <Badge variant="outline">{entry.countryCode}</Badge>
                        {entry.isActive ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      {entry.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked: {formatDate(entry.blockedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCountry(entry.countryCode)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
