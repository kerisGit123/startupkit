"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, Send } from "lucide-react";

export function SupportTicketDialog() {
  const { user } = useUser();
  const createTicket = useMutation(api.tickets.createTicket);
  
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState<"billing" | "plans" | "usage" | "general" | "credit" | "technical" | "invoice" | "service" | "other">("general");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        userEmail: user.emailAddresses[0]?.emailAddress || "",
        userName: user.fullName || user.username || "User",
      });

      setSuccess(true);
      setSubject("");
      setDescription("");
      setPriority("medium");
      setCategory("general");
      
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Ticket className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Submit a Support Ticket</DialogTitle>
          <DialogDescription className="text-center">
            Need help? Our support team is here to assist you. Submit a ticket and we&apos;ll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Ticket submitted successfully!</h3>
            <p className="text-gray-600">Our team will respond soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Ticket Type <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="plans">Plans</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General inquiry</SelectItem>
                  <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                  <SelectItem value="high">High - Critical issue</SelectItem>
                  <SelectItem value="urgent">Urgent - System down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={submitting}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Include any relevant details, error messages, or steps to reproduce the issue.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-gray-500">
                Fields marked with <span className="text-red-500">*</span> are required
              </p>
              <Button
                type="submit"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
