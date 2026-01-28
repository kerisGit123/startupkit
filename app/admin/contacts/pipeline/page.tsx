"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  ArrowLeft,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

type LifecycleStage = "prospect" | "qualified" | "customer" | "at_risk" | "churned";

interface Contact {
  _id: Id<"contacts">;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  type: "lead" | "customer" | "partner";
  lifecycleStage: LifecycleStage;
  leadSource?: string;
  leadScore?: number;
  tags: string[];
  createdAt: number;
}

export default function PipelinePage() {
  const [draggedContact, setDraggedContact] = useState<Contact | null>(null);
  
  const contactsByLifecycle = useQuery(api.contacts.getContactsByLifecycle);
  const updateLifecycle = useMutation(api.contacts.updateContactLifecycle);
  const stats = useQuery(api.contacts.getContactStats);

  const stages: { key: LifecycleStage; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "prospect", label: "Prospect", color: "bg-gray-100 border-gray-300", icon: Users },
    { key: "qualified", label: "Qualified", color: "bg-blue-100 border-blue-300", icon: TrendingUp },
    { key: "customer", label: "Customer", color: "bg-green-100 border-green-300", icon: Users },
    { key: "at_risk", label: "At Risk", color: "bg-yellow-100 border-yellow-300", icon: AlertCircle },
    { key: "churned", label: "Churned", color: "bg-red-100 border-red-300", icon: AlertCircle },
  ];

  const handleDragStart = (contact: Contact) => {
    setDraggedContact(contact);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: LifecycleStage) => {
    if (!draggedContact || draggedContact.lifecycleStage === stage) {
      setDraggedContact(null);
      return;
    }

    try {
      await updateLifecycle({
        id: draggedContact._id,
        lifecycleStage: stage,
      });
      setDraggedContact(null);
    } catch (error) {
      console.error("Failed to update lifecycle stage:", error);
    }
  };

  const getStageContacts = (stage: LifecycleStage): Contact[] => {
    if (!contactsByLifecycle) return [];
    return contactsByLifecycle[stage] || [];
  };

  const getStageCount = (stage: LifecycleStage): number => {
    return stats?.byLifecycle[stage] || 0;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => window.location.href = '/admin/contacts'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sales Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Drag and drop contacts to move them through the sales funnel
            </p>
          </div>
        </div>
        <Button onClick={() => window.location.href = '/admin/contacts/new'}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <Card key={stage.key} className={cn("p-4", stage.color)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-2xl font-bold">{getStageCount(stage.key)}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {stages.map((stage) => {
          const contacts = getStageContacts(stage.key);
          const Icon = stage.icon;
          
          return (
            <div
              key={stage.key}
              className="flex flex-col gap-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              {/* Column Header */}
              <Card className={cn("p-3 border-2", stage.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <h3 className="font-semibold">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary">{contacts.length}</Badge>
                </div>
              </Card>

              {/* Contact Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {contacts.length === 0 ? (
                  <Card className="p-4 border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      No contacts in this stage
                    </p>
                  </Card>
                ) : (
                  contacts.map((contact) => (
                    <Card
                      key={contact._id}
                      draggable
                      onDragStart={() => handleDragStart(contact)}
                      className="p-3 cursor-move hover:shadow-lg transition-all border-l-4 border-l-purple-500"
                      onClick={() => window.location.href = `/admin/contacts/${contact._id}`}
                    >
                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm truncate">
                              {contact.name}
                            </h4>
                            {contact.company && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {contact.company}
                                </span>
                              </div>
                            )}
                          </div>
                          {contact.leadScore && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                contact.leadScore >= 70 && "bg-green-100 text-green-800",
                                contact.leadScore >= 40 && contact.leadScore < 70 && "bg-yellow-100 text-yellow-800",
                                contact.leadScore < 40 && "bg-red-100 text-red-800"
                              )}
                            >
                              {contact.leadScore}
                            </Badge>
                          )}
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {contact.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {contact.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Source & Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          {contact.leadSource && (
                            <span className="capitalize">{contact.leadSource}</span>
                          )}
                          <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-1 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${contact.email}`;
                            }}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Schedule meeting logic
                            }}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Meet
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Tip:</strong> Drag and drop contact cards between columns to update their lifecycle stage. 
          Click on a card to view full details.
        </p>
      </Card>
    </div>
  );
}
