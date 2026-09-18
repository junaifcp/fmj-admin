import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  EmailTemplate,
  EmailTemplateCreatePayload,
} from "@/api/admin";
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  Eye,
  Sparkles,
} from "lucide-react";
import { extractVariablesFromTemplate } from "@/utils/emailTemplateUtils";
import { previewEmailTemplate } from "@/api/admin";

const TemplateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [formData, setFormData] = useState<EmailTemplateCreatePayload>({
    name: "",
    description: "",
    subject: "",
    category: "custom",
    type: "transactional",
    htmlBody: "",
    textBody: "",
    companyLogoUrl: "",
    primaryColor: "#6366f1",
    secondaryColor: "",
    fontFamily: "Arial, sans-serif",
    isActive: true,
    isPublic: false,
    tags: [],
  });

  useEffect(() => {
    if (isEditing && id) {
      const fetchTemplate = async () => {
        try {
          setLoading(true);
          const template = await getEmailTemplate(id);
          setFormData({
            name: template.name,
            description: template.description || "",
            subject: template.subject,
            category: template.category,
            type: template.type,
            htmlBody: template.htmlBody,
            textBody: template.textBody || "",
            companyLogoUrl: template.companyLogoUrl || "",
            primaryColor: template.primaryColor || "#6366f1",
            secondaryColor: template.secondaryColor || "",
            fontFamily: template.fontFamily || "Arial, sans-serif",
            isActive: template.isActive,
            isPublic: template.isPublic,
            tags: template.tags || [],
          });
        } catch (error) {
          toast({
            title: "Failed to load template",
            description:
              error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
          navigate("/admin/email/templates");
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [id, isEditing, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.subject.trim() ||
      !formData.htmlBody.trim()
    ) {
      toast({
        title: "Validation error",
        description: "Name, subject, and HTML body are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (isEditing && id) {
        await updateEmailTemplate(id, formData);
        toast({
          title: "Template updated successfully",
        });
      } else {
        await createEmailTemplate(formData);
        toast({
          title: "Template created successfully",
        });
      }
      navigate("/admin/email/templates");
    } catch (error) {
      toast({
        title: isEditing
          ? "Failed to update template"
          : "Failed to create template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/email/templates")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Template" : "Create New Template"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update your email template"
              : "Create a new email template with Handlebars syntax"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide basic details about your email template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Welcome Email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this template"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="job-opening">Job Opening</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="password-reset">
                        Password Reset
                      </SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transactional">
                        Transactional
                      </SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Subject line and HTML body with Handlebars syntax
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="e.g., Welcome {{userName}}!"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use Handlebars syntax like {`{{variableName}}`} for dynamic
                  content
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="htmlBody">
                    HTML Body <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const vars = extractVariablesFromTemplate(
                          formData.htmlBody,
                          formData.subject
                        );
                        setExtractedVariables(vars);
                        toast({
                          title: "Variables Extracted",
                          description: `Found ${vars.length} variable(s): ${
                            vars.join(", ") || "None"
                          }`,
                        });
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Extract Variables
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open("https://unlayer.com/editor", "_blank");
                        toast({
                          title: "Opening Unlayer",
                          description:
                            "Create your template in Unlayer, then copy the HTML and paste it below.",
                        });
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create with Unlayer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!formData.htmlBody.trim()) {
                          toast({
                            title: "No HTML content",
                            description: "Please add HTML content first",
                            variant: "destructive",
                          });
                          return;
                        }
                        setShowPreview(true);
                        try {
                          // Create a temporary preview with sample data
                          const sampleVars: Record<string, any> = {};
                          const vars = extractVariablesFromTemplate(
                            formData.htmlBody,
                            formData.subject
                          );
                          vars.forEach((v) => {
                            if (v === "userName") sampleVars[v] = "John Doe";
                            else if (v === "firstName") sampleVars[v] = "John";
                            else if (v === "lastName") sampleVars[v] = "Doe";
                            else if (v === "email")
                              sampleVars[v] = "john.doe@example.com";
                            else sampleVars[v] = `Sample ${v}`;
                          });

                          // Simple template replacement (client-side preview without Handlebars)
                          let previewSubject =
                            formData.subject || "Email Subject";
                          let previewHtml = formData.htmlBody;

                          // Replace {{variable}} with sample values
                          Object.entries(sampleVars).forEach(([key, value]) => {
                            const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
                            previewSubject = previewSubject.replace(
                              regex,
                              String(value)
                            );
                            previewHtml = previewHtml.replace(
                              regex,
                              String(value)
                            );
                          });

                          setEmailPreview({
                            subject: previewSubject,
                            html: previewHtml,
                          });
                        } catch (error) {
                          toast({
                            title: "Preview failed",
                            description:
                              error instanceof Error
                                ? error.message
                                : "Could not generate preview",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Textarea
                      id="htmlBody"
                      value={formData.htmlBody}
                      onChange={(e) => {
                        const newHtml = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          htmlBody: newHtml,
                        }));
                        // Auto-extract variables when HTML changes
                        const vars = extractVariablesFromTemplate(
                          newHtml,
                          formData.subject
                        );
                        setExtractedVariables(vars);
                      }}
                      placeholder="<div>Hello {{userName}}!</div>"
                      className="font-mono text-sm"
                      rows={15}
                      required
                    />
                    <div className="space-y-1">
                      {extractedVariables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <p className="text-xs text-muted-foreground">
                            Variables found:
                          </p>
                          {extractedVariables.map((v) => (
                            <Badge
                              key={v}
                              variant="secondary"
                              className="text-xs"
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use Handlebars syntax for dynamic variables. Examples:{" "}
                        <code className="text-xs">{`{{userName}}`}</code> or{" "}
                        <code className="text-xs">{`{{#if condition}}...{{/if}}`}</code>
                      </p>
                    </div>
                  </div>

                  {/* Preview Pane */}
                  {showPreview && emailPreview && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Preview</Label>
                      <div className="border rounded-lg bg-background overflow-hidden">
                        <div className="p-3 border-b bg-muted">
                          <p className="text-sm font-medium">
                            Subject: {emailPreview.subject}
                          </p>
                        </div>
                        <div className="max-h-[400px] overflow-auto">
                          <iframe
                            srcDoc={emailPreview.html}
                            className="w-full h-[400px] border-0"
                            title="Email Preview"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textBody">Plain Text Version (Optional)</Label>
                <Textarea
                  id="textBody"
                  value={formData.textBody}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      textBody: e.target.value,
                    }))
                  }
                  placeholder="Plain text version of the email"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, will be auto-generated from HTML
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Design Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Design & Branding</CardTitle>
              <CardDescription>
                Customize colors, fonts, and logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
                <Input
                  id="companyLogoUrl"
                  type="url"
                  value={formData.companyLogoUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyLogoUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  URL to company logo image (PNG, JPG, or SVG)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || "#000000"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={formData.fontFamily}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fontFamily: e.target.value,
                    }))
                  }
                  placeholder="Arial, sans-serif"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Template visibility and activation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this template for use
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other admins to use this template
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/email/templates")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TemplateEditor;
