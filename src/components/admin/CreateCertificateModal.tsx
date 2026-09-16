import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCertificate } from "@/api/admin";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface CreateCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateCertificateModal: React.FC<CreateCertificateModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    studentName: "",
    course: "",
    batch: "",
    serialNumber: "",
  });
  const [certificateImage, setCertificateImage] = useState<File | null>(null);
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [studentPreview, setStudentPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      studentName: "",
      course: "",
      batch: "",
      serialNumber: "",
    });
    setCertificateImage(null);
    setStudentPhoto(null);
    setCertificatePreview(null);
    setStudentPreview(null);
    setSerialError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG, JPG, and PNG images are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleCertificateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      toast({ title: "Invalid certificate image", description: err, variant: "destructive" });
      return;
    }
    setCertificateImage(file);
    const url = URL.createObjectURL(file);
    setCertificatePreview(url);
  };

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      toast({ title: "Invalid student photo", description: err, variant: "destructive" });
      return;
    }
    setStudentPhoto(file);
    const url = URL.createObjectURL(file);
    setStudentPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSerialError(null);

    if (!formData.studentName.trim() || !formData.course.trim() || !formData.batch.trim() || !formData.serialNumber.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (!certificateImage || !studentPhoto) {
      toast({ title: "Certificate image and student photo are required", variant: "destructive" });
      return;
    }

    const fd = new FormData();
    fd.append("studentName", formData.studentName.trim());
    fd.append("course", formData.course.trim());
    fd.append("batch", formData.batch.trim());
    fd.append("serialNumber", formData.serialNumber.trim());
    fd.append("certificateImage", certificateImage);
    fd.append("studentPhoto", studentPhoto);

    try {
      setLoading(true);
      await createCertificate(fd);
      toast({ title: "Certificate created successfully" });
      handleClose(false);
      onSuccess?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg.toLowerCase().includes("serial") || msg.toLowerCase().includes("already in use")) {
        setSerialError("Serial number already in use");
      } else {
        toast({ title: "Failed to create certificate", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 p-0 sm:max-h-[85vh]">
        <DialogHeader className="shrink-0 border-b px-6 py-4 sm:px-6 sm:py-4">
          <DialogTitle>Create Certificate</DialogTitle>
          <DialogDescription>
            Add a new course completion certificate. All fields and both images are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                placeholder="e.g., Full Stack Development"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch *</Label>
              <Input
                id="batch"
                value={formData.batch}
                onChange={(e) =>
                  setFormData({ ...formData, batch: e.target.value })
                }
                placeholder="e.g., Batch 2024-01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => {
                  setFormData({ ...formData, serialNumber: e.target.value });
                  setSerialError(null);
                }}
                placeholder="e.g., CERT-2024-001"
                required
                className={serialError ? "border-destructive" : ""}
              />
              {serialError && (
                <p className="text-sm text-destructive">{serialError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Certificate Image *</Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleCertificateImageChange}
              />
              {certificatePreview && (
                <div className="mt-2 max-w-full">
                  <img
                    src={certificatePreview}
                    alt="Certificate preview"
                    className="max-h-32 w-auto max-w-full rounded border object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Student Photo *</Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleStudentPhotoChange}
              />
              {studentPreview && (
                <div className="mt-2 max-w-full">
                  <img
                    src={studentPreview}
                    alt="Student photo preview"
                    className="max-h-32 w-auto max-w-full rounded border object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.studentName.trim() ||
                !formData.course.trim() ||
                !formData.batch.trim() ||
                !formData.serialNumber.trim() ||
                !certificateImage ||
                !studentPhoto
              }
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCertificateModal;
