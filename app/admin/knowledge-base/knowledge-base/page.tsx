"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Trash2, FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function KnowledgeBasePage() {
  const [selectedType, setSelectedType] = useState<"frontend" | "backend">("frontend");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [keywords, setKeywords] = useState("");

  // Queries
  const articles = useQuery(api.knowledgeBase.listArticles, { type: selectedType });
  
  // Mutations
  const createArticle = useMutation(api.knowledgeBase.createArticle);
  const deleteArticle = useMutation(api.knowledgeBase.deleteArticle);

  // Filter articles by search
  const filteredArticles = articles?.filter(article => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(search) ||
      article.content.toLowerCase().includes(search) ||
      article.category.toLowerCase().includes(search) ||
      article.tags.some(tag => tag.toLowerCase().includes(search))
    );
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      toast.error("Please upload a markdown (.md) file");
      return;
    }

    try {
      const text = await file.text();
      setContent(text);
      
      // Extract title from filename
      const filename = file.name.replace('.md', '');
      setTitle(filename);
      
      toast.success("File loaded! Fill in the details and click Create.");
    } catch (error) {
      toast.error("Failed to read file");
      console.error(error);
    }
  };

  const handleCreateArticle = async () => {
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await createArticle({
        type: selectedType,
        title,
        content,
        category: category || "general",
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        status: "published",
      });

      toast.success("Article created successfully");
      
      // Reset form
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      setKeywords("");
      setShowUploadForm(false);
    } catch (error) {
      toast.error("Failed to create article");
      console.error(error);
    }
  };

  const handleDeleteArticle = async (articleId: Id<"knowledge_base">) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteArticle({ articleId });
      toast.success("Article deleted");
    } catch (error) {
      toast.error("Failed to delete article");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Base Management</h1>
        <p className="text-muted-foreground">
          Upload and manage markdown files for your AI chatbot. Frontend knowledge is for public users, Backend knowledge is for authenticated users.
        </p>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as "frontend" | "backend")}>
        <TabsList className="mb-6">
          <TabsTrigger value="frontend">
            Frontend Knowledge (Public)
          </TabsTrigger>
          <TabsTrigger value="backend">
            Backend Knowledge (Authenticated)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType}>
          {/* Search and Add Button */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload Markdown File</CardTitle>
                <CardDescription>
                  Upload a .md file or paste content directly. This will be used by the AI chatbot to answer questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="file-upload">Upload Markdown File</Label>
                  <div className="mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".md"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Business Hours"
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Content (Markdown) *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste or type your markdown content here..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., general, policies, services"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., hours, schedule, availability"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., open, closed, time, when"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleCreateArticle}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Article
                  </Button>
                  <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles?.map((article) => (
              <Card key={article._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteArticle(article._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-2">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.content.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Badge variant="secondary">{article.category}</Badge>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="font-medium">{article.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Version: {article.version}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredArticles?.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No articles match your search query"
                  : `Upload your first ${selectedType} knowledge base article`}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowUploadForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Button>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
