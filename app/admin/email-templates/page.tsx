"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Edit, Trash2, Eye, Search } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

export default function EmailTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "custom" | "system">("all");
  const templates = useQuery(api.emailTemplates.listTemplates);
  const deleteTemplate = useMutation(api.emailTemplates.deleteTemplate);
  const updateTemplate = useMutation(api.emailTemplates.updateTemplate);

  const filteredTemplates = templates?.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase());
    const isCustom = t.type === "custom";
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "custom" && isCustom) ||
      (typeFilter === "system" && !isCustom);
    return matchesSearch && matchesType;
  });

  const handleToggleActive = async (id: Id<"email_templates">, currentStatus: boolean) => {
    await updateTemplate({ id, isActive: !currentStatus });
  };

  const handleDelete = async (id: Id<"email_templates">, name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      await deleteTemplate({ id });
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      welcome: "bg-green-100 text-green-800",
      password_reset: "bg-red-100 text-red-800",
      subscription: "bg-blue-100 text-blue-800",
      payment: "bg-purple-100 text-purple-800",
      usage_alert: "bg-yellow-100 text-yellow-800",
      admin_notification: "bg-gray-100 text-gray-800",
      custom: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage email templates for your transactional and marketing emails
          </p>
        </div>
        <Link href="/admin/email-templates/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "custom", "system"] as const).map((filter) => (
          <Button
            key={filter}
            variant={typeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(filter)}
          >
            {filter === "all" ? "All Templates" : filter === "custom" ? "Custom" : "System"}
            {templates && (
              <Badge variant="secondary" className="ml-2">
                {filter === "all"
                  ? templates.length
                  : filter === "custom"
                    ? templates.filter((t) => t.type === "custom").length
                    : templates.filter((t) => t.type !== "custom").length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {!templates ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : filteredTemplates && filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try a different search term" : "Create your first email template to get started"}
            </p>
            {!searchTerm && (
              <Link href="/admin/email-templates/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates?.map((template) => (
            <Card key={template._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                    <Badge className={getTypeColor(template.type)}>
                      {formatType(template.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => handleToggleActive(template._id, template.isActive)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm line-clamp-2">{template.subject}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.length > 0 ? (
                        template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No variables</span>
                      )}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      <span className={`text-xs ${template.isActive ? "text-green-600" : "text-gray-400"}`}>
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/email-templates/${template._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/email-templates/${template._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template._id, template.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {templates && templates.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">Total Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Active Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">
                {templates.filter(t => !t.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Inactive Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {templates.filter(t => t.isDefault).length}
              </div>
              <p className="text-xs text-muted-foreground">Default Templates</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
