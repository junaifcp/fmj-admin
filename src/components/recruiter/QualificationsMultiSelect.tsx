// src/components/recruiter/QualificationsMultiSelect.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  educationOptions,
  type EducationLevel,
} from "@/constants/educationOptions";
import { Check } from "lucide-react";

interface Props {
  value: EducationLevel[]; // selected EducationLevel enum values
  onChange: (v: EducationLevel[]) => void;
  placeholder?: string;
  maxItems?: number;
}

const QualificationsMultiSelect: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Select qualifications...",
  maxItems = 7, // Max 7 since there are only 7 EducationLevel values
}) => {
  const [open, setOpen] = useState(false);
  const [localSelections, setLocalSelections] = useState<EducationLevel[]>(
    value || []
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalSelections(value || []);
  }, [value]);

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const toggleOption = (opt: { label: string; value: EducationLevel }) => {
    let next = [...localSelections];
    if (next.includes(opt.value)) {
      next = next.filter((x) => x !== opt.value);
    } else {
      if (next.length >= maxItems) return;
      next.push(opt.value);
    }
    setLocalSelections(next);
    onChange(next);
  };

  const removeChip = (value: EducationLevel) => {
    const next = localSelections.filter((x) => x !== value);
    setLocalSelections(next);
    onChange(next);
  };

  const getLabelForValue = (val: EducationLevel): string => {
    return educationOptions.find((o) => o.value === val)?.label || val;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Chips / control */}
      <div
        className="min-h-[44px] w-full border rounded-md px-3 py-2 flex items-center gap-2 flex-wrap cursor-text"
        onClick={() => setOpen((s) => !s)}
        role="button"
        aria-haspopup="listbox"
      >
        {localSelections.length === 0 ? (
          <div className="text-muted-foreground">{placeholder}</div>
        ) : (
          localSelections.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span className="max-w-xs truncate">{getLabelForValue(val)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(val);
                }}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${getLabelForValue(val)}`}
              >
                ×
              </button>
            </span>
          ))
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {localSelections.length}/{maxItems}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2">
            {educationOptions.map((opt) => {
              const checked = localSelections.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    // prevent outer click toggles interfering
                    e.stopPropagation();
                    toggleOption(opt);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOption(opt);
                    }}
                    className="form-checkbox h-4 w-4"
                  />
                  <div className="flex-1 text-sm">
                    <div>{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-muted-foreground">
                        {opt.description}
                      </div>
                    )}
                  </div>
                  {checked && <Check className="h-4 w-4 text-green-600" />}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationsMultiSelect;
