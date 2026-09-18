// src/components/admin/BulkUploadButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export interface BulkUploadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

const BulkUploadButton: React.FC<BulkUploadButtonProps> = ({
  onClick,
  disabled = false,
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Open bulk upload",
}) => {
  const sizeClass =
    size === "sm"
      ? "px-3 py-1 text-sm"
      : size === "lg"
      ? "px-5 py-2"
      : "px-4 py-2";

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} ${className}`}
      aria-label={ariaLabel}
    >
      <Upload className="h-4 w-4 mr-2" />
      Bulk Upload
    </Button>
  );
};

export default BulkUploadButton;
