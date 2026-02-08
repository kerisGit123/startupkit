"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Calendar,
  Tag
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ContactType = "all" | "lead" | "customer" | "partner";
type LifecycleStage = "prospect" | "qualified" | "customer" | "at_risk" | "churned";

export default function ContactsPage() {
  const [activeType, setActiveType] = useState<ContactType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleStage | "all">("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Fetch contacts with filters
  const allContacts = useQuery(api.contacts.getAllContacts, {
    type: activeType === "all" ? undefined : activeType,
    lifecycleStage: lifecycleFilter === "all" ? undefined : lifecycleFilter,
  });

  const stats = useQuery(api.contacts.getContactStats);

  // Filter by search query
  const filteredContacts = allContacts?.filter((contact: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      (contact.company && contact.company.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.includes(query))
    );
  });

  const getLifecycleColor = (stage: LifecycleStage) => {
    switch (stage) {
      case "prospect": return "bg-gray-100 text-gray-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "customer": return "bg-green-100 text-green-800";
      case "at_risk": return "bg-yellow-100 text-yellow-800";
      case "churned": return "bg-red-100 text-red-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lead": return <UserPlus className="w-4 h-4" />;
      case "customer": return <Users className="w-4 h-4" />;
      case "partner": return <Building2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const toggleContactSelection = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Unified view of all customers, leads, and partners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/contacts/pipeline'}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Pipeline View
          </Button>
          <Button onClick={() => window.location.href = '/admin/contacts/new'}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{stats?.leads || 0}</p>
            </div>
            <UserPlus className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold">{stats?.customers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Qualified</p>
              <p className="text-2xl font-bold">{stats?.byLifecycle.qualified || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Partners</p>
              <p className="text-2xl font-bold">{stats?.partners || 0}</p>
            </div>
            <Building2 className="w-8 h-8 text-indigo-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Type Tabs */}
          <Tabs value={activeType} onValueChange={(v) => setActiveType(v as ContactType)}>
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="lead">Leads</TabsTrigger>
              <TabsTrigger value="customer">Customers</TabsTrigger>
              <TabsTrigger value="partner">Partners</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={lifecycleFilter} onValueChange={(v) => setLifecycleFilter(v as LifecycleStage | "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Lifecycle Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedContacts.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedContacts.size} selected
              </span>
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Contacts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === filteredContacts?.length && filteredContacts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContacts(new Set(filteredContacts?.map((contact: any) => contact._id) || []));
                    } else {
                      setSelectedContacts(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lifecycle Stage</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredContacts ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading contacts...
                </TableCell>
              </TableRow>
            ) : filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No contacts found. Add your first contact to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact: any) => (
                <TableRow 
                  key={contact._id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => window.location.href = `/admin/contacts/${contact._id}`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact._id)}
                      onChange={() => toggleContactSelection(contact._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(contact.type)}
                      <span className="capitalize">{contact.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", getLifecycleColor(contact.lifecycleStage))}>
                      {contact.lifecycleStage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{contact.company}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/admin/contacts/${contact._id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
