"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadCaptureFormProps {
  config: {
    formTitle: string;
    formDescription: string;
    requiredFields: string[];
    customFields: Array<{
      fieldName: string;
      fieldLabel: string;
      fieldType: "text" | "email" | "phone" | "select" | "textarea";
      isRequired: boolean;
      options?: string[];
      placeholder?: string;
    }>;
  };
  onSubmit: (data: Record<string, string>) => void;
  onClose: () => void;
}

export function LeadCaptureForm({ config, onSubmit, onClose }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate required fields
    config.requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = "This field is required";
      }
    });

    // Validate custom required fields
    config.customFields.forEach((field) => {
      if (field.isRequired && !formData[field.fieldName]?.trim()) {
        newErrors[field.fieldName] = `${field.fieldLabel} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{config.formTitle}</h2>
            <p className="text-gray-600 text-sm">{config.formDescription}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Standard Fields */}
            {config.requiredFields.includes("name") && (
              <div>
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your full name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            {config.requiredFields.includes("email") && (
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your@email.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            )}

            {config.requiredFields.includes("phone") && (
              <div>
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            )}

            {config.requiredFields.includes("company") && (
              <div>
                <Label htmlFor="company">
                  Company <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company"
                  value={formData.company || ""}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="Your company name"
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
              </div>
            )}

            {/* Custom Fields */}
            {config.customFields.map((field) => (
              <div key={field.fieldName}>
                <Label htmlFor={field.fieldName}>
                  {field.fieldLabel}
                  {field.isRequired && <span className="text-red-500"> *</span>}
                </Label>

                {field.fieldType === "text" && (
                  <Input
                    id={field.fieldName}
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder}
                    className={errors[field.fieldName] ? "border-red-500" : ""}
                  />
                )}

                {field.fieldType === "email" && (
                  <Input
                    id={field.fieldName}
                    type="email"
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder}
                    className={errors[field.fieldName] ? "border-red-500" : ""}
                  />
                )}

                {field.fieldType === "phone" && (
                  <Input
                    id={field.fieldName}
                    type="tel"
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder}
                    className={errors[field.fieldName] ? "border-red-500" : ""}
                  />
                )}

                {field.fieldType === "select" && (
                  <Select
                    value={formData[field.fieldName] || ""}
                    onValueChange={(value) => handleChange(field.fieldName, value)}
                  >
                    <SelectTrigger className={errors[field.fieldName] ? "border-red-500" : ""}>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.fieldType === "textarea" && (
                  <Textarea
                    id={field.fieldName}
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={errors[field.fieldName] ? "border-red-500" : ""}
                  />
                )}

                {errors[field.fieldName] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.fieldName]}</p>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Skip
              </Button>
              <Button type="submit" className="flex-1">
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
