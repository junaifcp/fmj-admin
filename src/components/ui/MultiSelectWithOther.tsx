// src/components/ui/MultiSelectWithOther.tsx
import React, { useEffect, useRef, useState } from "react";
import type { AllowanceOption } from "@/constants/allowanceOptions";
import { Check } from "lucide-react";

interface Props {
  options: AllowanceOption[]; // options array
  value: Array<string>; // array of selected values (either known 'value' keys or custom strings)
  onChange: (v: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

const MultiSelectWithOther: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  maxItems = 10,
}) => {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<string[]>(value || []);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setLocal(value || []), [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowOtherInput(false);
        setOtherText("");
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const lookupByValue = (val: string) => options.find((o) => o.value === val);
  const lookupByLabel = (lbl: string) => options.find((o) => o.label === lbl);

  const isKnownValueSelected = (val: string) =>
    local.includes(val) && !!lookupByValue(val);

  const toggleKnownOption = (opt: AllowanceOption) => {
    // if clicked 'other' option: open the inline input and set placeholder entry if not present
    if (opt.value === "other") {
      const placeholderKey = `__OTHER_PLACEHOLDER__`; // not persisted; replaced by custom text
      const hasPlaceholder = local.includes(placeholderKey);
      if (hasPlaceholder) {
        // uncheck other: remove placeholder
        const next = local.filter((x) => x !== placeholderKey);
        setLocal(next);
        onChange(next);
        setShowOtherInput(false);
        setOtherText("");
      } else {
        const next = [...local, placeholderKey].slice(0, maxItems);
        setLocal(next);
        onChange(next);
        setShowOtherInput(true);
        setOpen(true);
      }
      return;
    }

    // toggle known option by key
    const has = local.includes(opt.value);
    let next = [...local];
    if (has) next = next.filter((x) => x !== opt.value);
    else {
      if (next.length >= maxItems) return;
      next.push(opt.value);
    }
    setLocal(next);
    onChange(next);
  };

  const removeChip = (item: string) => {
    const next = local.filter((x) => x !== item);
    setLocal(next);
    onChange(next);
    // if placeholder removed, close other input
    if (item === "__OTHER_PLACEHOLDER__") {
      setShowOtherInput(false);
      setOtherText("");
    }
  };

  const confirmOther = () => {
    const txt = otherText.trim();
    if (!txt) return;
    // replace placeholder token with actual custom string
    const placeholderIndex = local.indexOf("__OTHER_PLACEHOLDER__");
    let next = [...local];
    if (placeholderIndex !== -1) {
      next.splice(placeholderIndex, 1, txt);
    } else {
      if (next.length < maxItems) next.push(txt);
    }
    // dedupe and preserve order
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const x of next) {
      if (!seen.has(x)) {
        seen.add(x);
        deduped.push(x);
      }
    }
    const final = deduped.slice(0, maxItems);
    setLocal(final);
    onChange(final);
    setOtherText("");
    setShowOtherInput(false);
    setOpen(false);
  };

  const handleOtherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmOther();
    } else if (e.key === "Escape") {
      setShowOtherInput(false);
      setOtherText("");
    }
  };

  // render label for a stored item: if known value key -> show label; else show the string itself
  const renderChipLabel = (item: string) => {
    if (item === "__OTHER_PLACEHOLDER__") {
      // show the "Other (specify)" label while filling
      const opt = options.find((o) => o.value === "other");
      return opt?.label ?? "Other";
    }
    const found = lookupByValue(item);
    if (found) return found.label;
    // possibly someone saved a label string already (fallback)
    return item;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="min-h-[44px] w-full border rounded-md px-3 py-2 flex items-center gap-2 flex-wrap cursor-text"
        onClick={() => setOpen((s) => !s)}
        role="button"
        aria-haspopup="listbox"
      >
        {local.length === 0 ? (
          <div className="text-muted-foreground">{placeholder}</div>
        ) : (
          local.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span className="max-w-xs truncate">{renderChipLabel(item)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(item);
                }}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${renderChipLabel(item)}`}
              >
                ×
              </button>
            </span>
          ))
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {local.length}/{maxItems}
        </div>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2">
            {options.map((opt) => {
              const isOther = opt.value === "other";
              const placeholderKey = "__OTHER_PLACEHOLDER__";
              const checked = isOther
                ? local.includes(placeholderKey)
                : local.includes(opt.value);

              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleKnownOption(opt);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleKnownOption(opt);
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

            {showOtherInput && (
              <div className="mt-2 flex gap-2">
                <input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  onKeyDown={handleOtherKeyDown}
                  placeholder="Type custom allowance and press Enter"
                  className="flex-1 border rounded-md px-3 py-2"
                />
                <button
                  type="button"
                  onClick={confirmOther}
                  className="px-3 py-2 rounded-md border bg-gray-50"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectWithOther;
