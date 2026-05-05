"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, BookOpen, Globe, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

export default function ChatbotSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chatbot</h1>
        <p className="text-gray-500 mt-1">Configure chatbot widgets and manage knowledge base</p>
      </div>

      <Tabs defaultValue="widget">
        <TabsList>
          <TabsTrigger value="widget">Widget Settings</TabsTrigger>
          <TabsTrigger value="knowledge_base">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="widget">
          <WidgetSettingsTab />
        </TabsContent>

        <TabsContent value="knowledge_base">
          <KnowledgeBaseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WidgetSettingsTab() {
  const frontendConfig = useQuery(api.chatbot.getConfig, { type: "frontend" });
  const userPanelConfig = useQuery(api.chatbot.getConfig, { type: "user_panel" });
  const updateConfig = useMutation(api.chatbot.updateConfig);

  return (
    <div className="mt-4 grid md:grid-cols-2 gap-6">
      <WidgetCard
        label="Frontend Widget"
        description="Chat widget shown on your public website"
        icon={<Globe className="w-4 h-4" />}
        config={frontendConfig}
        type="frontend"
        onUpdate={updateConfig}
      />
      <WidgetCard
        label="User Panel Widget"
        description="Chat widget shown inside the user dashboard"
        icon={<LayoutDashboard className="w-4 h-4" />}
        config={userPanelConfig}
        type="user_panel"
        onUpdate={updateConfig}
      />
    </div>
  );
}

interface WidgetCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  config: any;
  type: "frontend" | "user_panel";
  onUpdate: any;
}

function WidgetCard({ label, description, icon, config, type, onUpdate }: WidgetCardProps) {
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) setIsActive(config.isActive || false);
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        type,
        isActive,
        n8nWebhookUrl: "",
        primaryColor: "#854fff",
        secondaryColor: "#6b3fd4",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        userMessageBgColor: "#854fff",
        aiMessageBgColor: "#f1f1f1",
        userMessageTextColor: "#ffffff",
        aiMessageTextColor: "#333333",
        aiBorderColor: "#e0e0e0",
        aiTextColor: "#333333",
        welcomeMessage: config?.welcomeMessage || "Hi, how can we help?",
        responseTimeText: config?.responseTimeText || "We typically respond right away",
        firstBotMessage: config?.firstBotMessage || "Hi there! How can I help today?",
        placeholderText: config?.placeholderText || "Type your message here...",
        position: config?.position || "right",
        theme: config?.theme || "light",
        roundness: config?.roundness || 12,
        companyName: config?.companyName || "Your Company",
        showThemeToggle: false,
        showCompanyLogo: true,
        showResponseTime: true,
        enableSoundNotifications: false,
        enableTypingIndicator: true,
        mobileFullScreen: false,
        mobilePosition: "bottom",
      });
      toast.success(`${label} saved`);
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Widget</Label>
            <p className="text-sm text-muted-foreground">Show chat widget to users</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function KnowledgeBaseTab() {
  const [selectedType, setSelectedType] = useState<"frontend" | "user_panel">("frontend");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const articles = useQuery(api.knowledgeBase.listArticles, { type: selectedType });

  const filteredArticles = articles?.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingArticle(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={selectedType === "frontend" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("frontend")}
        >
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          Frontend
        </Button>
        <Button
          variant={selectedType === "user_panel" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("user_panel")}
        >
          <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
          User Panel
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <ArticleEditor
              article={editingArticle}
              type={selectedType}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles?.map((article) => (
          <ArticleCard
            key={article._id}
            article={article}
            onEdit={() => handleEdit(article)}
          />
        ))}
        {filteredArticles?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No articles found</p>
            <Button variant="outline" onClick={handleNew} className="mt-4">
              Create your first article
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, onEdit }: any) {
  const deleteArticle = useMutation(api.knowledgeBase.deleteArticle);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this article?")) {
      await deleteArticle({ articleId: article._id });
      toast.success("Article deleted");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">{article.title}</CardTitle>
          <Badge
            className={
              article.status === "published"
                ? "bg-green-100 text-green-800 hover:bg-green-100 shrink-0"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 shrink-0"
            }
          >
            {article.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{article.content}</p>
        <Badge variant="outline" className="text-xs mb-2">{article.category}</Badge>
        <div className="flex flex-wrap gap-1 mb-3">
          {article.tags.slice(0, 3).map((tag: string, idx: number) => (
            <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">#{tag}</span>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{article.tags.length - 3} more</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleEditor({ article, type, onClose }: any) {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    category: article?.category || "",
    tags: article?.tags?.join(", ") || "",
    keywords: article?.keywords?.join(", ") || "",
    status: article?.status || "draft",
  });

  const createArticle = useMutation(api.knowledgeBase.createArticle);
  const updateArticle = useMutation(api.knowledgeBase.updateArticle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      keywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      status: formData.status as "draft" | "published",
      type,
    };
    try {
      if (article) {
        await updateArticle({ articleId: article._id, ...data });
        toast.success("Article updated");
      } else {
        await createArticle(data);
        toast.success("Article created");
      }
      onClose();
    } catch {
      toast.error("Failed to save article");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{article ? "Edit Article" : "New Article"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="How to reset your password"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Account Management"
            required
          />
        </div>
        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write the article content here..."
            rows={8}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            This content will be used by the AI to answer user questions
          </p>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="password, reset, account (comma-separated)"
          />
        </div>
        <div>
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="forgot password, can't login (comma-separated)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Keywords help the AI match user questions to this article
          </p>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Only published articles will be used by the chatbot
          </p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {article ? "Update" : "Create"} Article
          </Button>
        </div>
      </form>
    </>
  );
}
