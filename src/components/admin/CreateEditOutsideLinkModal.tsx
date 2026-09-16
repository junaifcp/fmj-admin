import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "./RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OutsideLink, Tag } from "@/types/admin";
import { X, Check } from "lucide-react";
import { apiBaseUrl } from "@/config/env";
import { getTags } from "@/api/admin";

interface CreateEditOutsideLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    outsideLink: string;
    bannerImage?: string;
    isActive?: boolean;
    tags?: string[];
  }, bannerFile?: File) => Promise<void>;
  item: OutsideLink | null;
  loading?: boolean;
}

export const CreateEditOutsideLinkModal: React.FC<CreateEditOutsideLinkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    outsideLink: "",
    isActive: true,
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsSearch, setTagsSearch] = useState("");

  const fetchTags = useCallback(async (searchTerm = "") => {
    try {
      setTagsLoading(true);
      const result = await getTags(1, 100, searchTerm);
      setTags(result.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      setTagsSearch("");
    }
  }, [isOpen, fetchTags]);

  useEffect(() => {
    if (!isOpen) return;
    const debounceTimer = setTimeout(() => {
      fetchTags(tagsSearch);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [tagsSearch, isOpen, fetchTags]);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || "",
        outsideLink: item.outsideLink,
        isActive: item.isActive,
      });
      setBannerPreview(item.bannerImage || null);
      setBannerFile(null);
      setSelectedTagIds(item.tags?.map((tag) => tag._id) || []);
    } else {
      setFormData({
        title: "",
        description: "",
        outsideLink: "",
        isActive: true,
      });
      setBannerPreview(null);
      setBannerFile(null);
      setSelectedTagIds([]);
    }
  }, [item, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert("Please select a JPEG or PNG image");
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be less than 2MB");
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.outsideLink.trim()) {
      return;
    }

    try {
      await onSubmit(
        {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          outsideLink: formData.outsideLink.trim(),
          bannerImage: item?.bannerImage || undefined,
          isActive: formData.isActive,
          tags: selectedTagIds,
        },
        bannerFile || undefined
      );
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const getBannerUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${apiBaseUrl}${url}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {item ? "Edit Outside Link" : "Create Outside Link"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Update the details for this outside link."
              : "Add a new outside link to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter link title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              placeholder="Add description with formatting (headings, lists, bold, etc.)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outsideLink">Outside Link URL *</Label>
            <Input
              id="outsideLink"
              type="url"
              value={formData.outsideLink}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, outsideLink: e.target.value }))
              }
              placeholder="https://example.com/careers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerImage">Banner Image (optional)</Label>
            {bannerPreview ? (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-4">
                <Input
                  id="bannerImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  JPEG or PNG, max 2MB
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="space-y-2">
              <Input
                placeholder="Search tags..."
                value={tagsSearch}
                onChange={(e) => setTagsSearch(e.target.value)}
                className="mb-2"
              />
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {tagsLoading ? (
                  <div className="text-sm text-muted-foreground py-2">
                    Loading tags...
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No tags found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag._id);
                      return (
                        <label
                          key={tag._id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTagToggle(tag._id)}
                            className="h-4 w-4"
                          />
                          <span className="flex-1 text-sm">{tag.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags
                    .filter((tag) => selectedTagIds.includes(tag._id))
                    .map((tag) => (
                      <Badge
                        key={tag._id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.title.trim() ||
                !formData.outsideLink.trim() ||
                loading
              }
            >
              {loading ? "Saving..." : item ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
