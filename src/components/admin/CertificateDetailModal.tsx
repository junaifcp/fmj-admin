import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Certificate } from "@/types/admin";

interface CertificateDetailModalProps {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  open,
  onOpenChange,
}) => {
  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificate Details</DialogTitle>
          <DialogDescription>
            {certificate.studentName} - {certificate.course}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student Name</p>
              <p className="font-medium">{certificate.studentName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Course</p>
              <p className="font-medium">{certificate.course}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batch</p>
              <p className="font-medium">{certificate.batch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
              <p className="font-mono font-medium">{certificate.serialNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(certificate.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Certificate Image</p>
            {certificate.certificateImageUrl ? (
              <img
                src={certificate.certificateImageUrl}
                alt="Certificate"
                className="w-full max-h-80 object-contain rounded border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No image</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Student Photo</p>
            {certificate.studentPhotoUrl ? (
              <img
                src={certificate.studentPhotoUrl}
                alt="Student"
                className="w-32 h-32 object-contain rounded border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No photo</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateDetailModal;
