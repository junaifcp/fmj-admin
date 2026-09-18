// src/components/common/IndustrySelect.tsx

import React from "react";
import { industries, IndustryType } from "@/constants/industries";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface IndustrySelectProps {
  value?: IndustryType | string;
  onChange: (value: IndustryType | string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  label = "Industry",
  placeholder = "Select an industry...",
  disabled = false,
  required = false,
}) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {industries.map((industry) => (
            <SelectItem key={industry} value={industry}>
              {industry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default IndustrySelect;
