import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PosterTemplateCard from "./PosterTemplateCard";
import PosterCanvas from "./PosterCanvas";
import LoadingAnimation from "@/components/ui/loading-animation";
import { exportNodeAsImage } from "@/utils/exportImage";
import { posterTemplates } from "@/types/poster";
import type { Job } from "@/types/recruiter";
import type { TemplateId, PosterData } from "@/types/poster";

interface PosterGalleryModalProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  exportSize?: { width: number; height: number };
}

const PosterGalleryModal: React.FC<PosterGalleryModalProps> = ({
  open,
  onClose,
  job,
}) => {
  const [tagline, setTagline] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] =
    useState<TemplateId | null>(null);
  const canvasRefs = useRef<Record<TemplateId, HTMLDivElement | null>>({
    A: null,
    B: null,
    C: null,
    D: null,
  });

  const posterData: PosterData = {
    title: job.title,
    qualifications:
      job.qualifications.length > 0
        ? job.qualifications
        : job.requirements.slice(0, 3),
    companyName: job.company?.name || job.companyName || "Company",
    tagline: tagline || "We're hiring talented professionals",
    logoUrl: job.companyId?.logo,
    website: job.companyId?.website,
  };

  const handleDownload = async (templateId: TemplateId) => {
    const node = canvasRefs.current[templateId];
    if (!node) {
      console.warn("Export canvas not ready for template:", templateId);
      toast.error("Preparing poster. Please try again.");
      return;
    }

    setIsGenerating(true);
    setGeneratingTemplate(templateId);

    try {
      // Ensure browser paints hidden canvas before capture
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const filename = `${job.title
        .replace(/\s+/g, "-")
        .toLowerCase()}-poster-${templateId}.png`;
      await exportNodeAsImage(node, filename, 1080, 1080);

      toast.success("Poster downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download poster"
      );
    } finally {
      setIsGenerating(false);
      setGeneratingTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download Hiring Poster</DialogTitle>
          <DialogDescription>
            Choose a template and download a high-quality poster for {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tagline Input */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Custom Tagline (Optional)</Label>
            <Input
              id="tagline"
              placeholder="e.g., Join our innovative team"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use default: "We're hiring talented professionals"
            </p>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="flex justify-center py-8">
              <LoadingAnimation label="Generating poster" />
            </div>
          )}

          {/* Template Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posterTemplates.map((template) => (
              <PosterTemplateCard
                key={template.id}
                templateId={template.id}
                name={template.name}
                description={template.description}
                data={posterData}
                onDownload={handleDownload}
                isGenerating={
                  isGenerating && generatingTemplate === template.id
                }
              />
            ))}
          </div>

          {/* Offscreen Export Canvases (kept rendered for reliability) */}
          <div
            className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            {posterTemplates.map((t) => (
              <PosterCanvas
                key={`export-${t.id}`}
                ref={(el) => {
                  // Map refs per template for stable access
                  canvasRefs.current[t.id] = el;
                }}
                templateId={t.id}
                data={posterData}
                size="export"
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PosterGalleryModal;
