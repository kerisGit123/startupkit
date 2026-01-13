"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface TemplateEditorDialogProps {
  template: any;
  onClose: () => void;
}

export function TemplateEditorDialog({ template, onClose }: TemplateEditorDialogProps) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [htmlContent, setHtmlContent] = useState(template?.htmlBody || template?.html || "");
  const [variables, setVariables] = useState<string[]>(template?.variables || []);
  const [newVariable, setNewVariable] = useState("");

  const createTemplate = useMutation(api.emails.templates.createTemplate);
  const updateTemplate = useMutation(api.emails.templates.updateTemplate);

  const handleSave = async () => {
    try {
      if (template) {
        await updateTemplate({
          templateId: template._id,
          name,
          subject,
          htmlContent,
          variables,
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate({
          name,
          subject,
          htmlContent,
          variables,
        });
        toast.success("Template created successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const removeVariable = (variable: string) => {
    setVariables(variables.filter(v => v !== variable));
  };

  const insertVariable = (variable: string) => {
    setHtmlContent(htmlContent + `{{${variable}}}`);
  };

  // Generate preview with sample data
  const previewHtml = htmlContent
    .replace(/\{\{user_name\}\}/g, "John Doe")
    .replace(/\{\{company_name\}\}/g, "Acme Corp")
    .replace(/\{\{amount\}\}/g, "$29.00")
    .replace(/\{\{plan\}\}/g, "Pro")
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            Design your email template with variables and HTML content
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email"
              />
            </div>

            <div>
              <Label>Subject Line</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Welcome to {{company_name}}!"
              />
            </div>

            <div>
              <Label>Variables</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  placeholder="e.g., user_name"
                  onKeyPress={(e) => e.key === "Enter" && addVariable()}
                />
                <Button onClick={addVariable}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => insertVariable(variable)}
                  >
                    {`{{${variable}}}`}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVariable(variable);
                      }}
                      className="ml-2"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click a variable to insert it into the template
              </p>
            </div>

            <div>
              <Label>HTML Content</Label>
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter HTML content..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave}>Save Template</Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg p-4 bg-white">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">{subject}</p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
