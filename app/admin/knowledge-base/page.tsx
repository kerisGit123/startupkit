"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeBasePage() {
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Knowledge Base Management</h1>
        <p className="text-gray-500 mt-1">
          Manage articles for your AI chatbot to reference
        </p>
      </div>

      {/* Chatbot Type Selector */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="frontend">Frontend Chatbot</TabsTrigger>
          <TabsTrigger value="user_panel">User Panel Chatbot</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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

      {/* Articles Grid */}
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
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No articles found</p>
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

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
          <Badge className={statusColors[article.status as keyof typeof statusColors]}>
            {article.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.content}</p>
        
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            {article.category}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {article.tags.slice(0, 3).map((tag: string, idx: number) => (
            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
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
    } catch (error) {
      toast.error("Failed to save article");
      console.error(error);
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
          <p className="text-xs text-gray-500 mt-1">
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
          <p className="text-xs text-gray-500 mt-1">
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
          <p className="text-xs text-gray-500 mt-1">
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
