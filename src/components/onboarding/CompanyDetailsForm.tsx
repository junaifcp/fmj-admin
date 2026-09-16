// src/components/onboarding/CompanyDetailsForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type {
  ResolvedDetails,
  UpdateRecruiterProfilePayload,
} from "@/types/onboarding";
import { toast } from "sonner";
import { CompanyAutocompleteInput } from "./CompanyAutocompleteInput";
import { useBusinessResolve } from "@/hooks/useBusinessResolve";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

interface CompanyDetailsFormProps {
  mode: "prefill" | "manual";
  prefill?: ResolvedDetails;
  typedName?: string;
  onSubmit: (payload: UpdateRecruiterProfilePayload) => Promise<void>;
  onCancel?: () => void;
}

/** helper used to determine whether prefill contains meaningful fields */
function hasMeaningfulPrefill(d?: ResolvedDetails | null) {
  if (!d) return false;
  const hasName = !!(d.name && String(d.name).trim());
  const hasWebsite = !!(d.website && String(d.website).trim());
  const hasPhone =
    !!(d.internationalPhone && String(d.internationalPhone).trim()) ||
    !!(d.phone && String(d.phone).trim());
  const hasAddress = !!(
    d.formattedAddress && String(d.formattedAddress).trim()
  );
  return hasName || hasWebsite || hasPhone || hasAddress;
}

export const CompanyDetailsForm: React.FC<CompanyDetailsFormProps> = ({
  mode,
  prefill,
  typedName,
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInlineAutocomplete, setShowInlineAutocomplete] = useState(false);

  // tracks whether we should lock fields because they were auto-filled with meaningful values
  const [isPrefillLocked, setIsPrefillLocked] = useState<boolean>(false);

  // form fields
  const [companyName, setCompanyName] = useState(
    mode === "prefill"
      ? prefill?.name || typedName || ""
      : typedName || prefill?.name || ""
  );
  const [website, setWebsite] = useState(prefill?.website || "");
  const [companyPhone, setCompanyPhone] = useState(
    prefill?.internationalPhone || prefill?.phone || ""
  );
  const [location, setLocation] = useState(prefill?.formattedAddress || "");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");

  const { resolve: resolveBusiness } = useBusinessResolve();

  // Only lock if `mode === 'prefill'` AND prefill contains at least one meaningful field.
  useEffect(() => {
    const meaningful = hasMeaningfulPrefill(prefill);
    setIsPrefillLocked(mode === "prefill" && meaningful);

    // ensure fields reflect incoming prefill/typedName changes
    setCompanyName(
      mode === "prefill"
        ? prefill?.name || typedName || ""
        : typedName || prefill?.name || ""
    );
    setWebsite(prefill?.website || "");
    setCompanyPhone(prefill?.internationalPhone || prefill?.phone || "");
    setLocation(prefill?.formattedAddress || "");
  }, [mode, prefill, typedName]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (website && !/^https?:\/\/.+/.test(website)) {
      newErrors.website =
        "Please enter a valid URL (starting with http:// or https://)";
    }

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // When user opens the inline autocomplete, unlock fields so they can edit/search
  const handleOpenAutocomplete = () => {
    setShowInlineAutocomplete(true);
    setIsPrefillLocked(false);
  };

  // Called when user selects an item from the inline autocomplete.
  // IMPORTANT: **do not always unlock** — after resolving we re-lock fields if resolved details are meaningful.
  const handleSelectCompany = async (item: {
    placeId?: string;
    name: string;
  }) => {
    setShowInlineAutocomplete(false);

    // If typed-only selection (no placeId), treat as manual typed: unlock fields
    if (!item.placeId) {
      setIsPrefillLocked(false);
      setCompanyName(item.name);
      setWebsite("");
      setCompanyPhone("");
      setLocation("");
      return;
    }

    // Try to resolve. If resolved details contain meaningful info, fill fields AND lock them.
    // If resolve returns empty details, treat like typed selection (unlock fields but prefill name).
    try {
      const resolved = await resolveBusiness(item.placeId);
      if (resolved?.details && hasMeaningfulPrefill(resolved.details)) {
        const d = resolved.details;
        setCompanyName(d.name || item.name);
        setWebsite(d.website || "");
        setCompanyPhone(d.internationalPhone || d.phone || "");
        setLocation(d.formattedAddress || "");
        // re-lock because this is authoritative prefill with meaningful content
        setIsPrefillLocked(true);
      } else {
        // no meaningful details -> unlock and prefill name only
        setIsPrefillLocked(false);
        setCompanyName(item.name);
        setWebsite("");
        setCompanyPhone("");
        setLocation("");
      }
    } catch (err) {
      console.error("Resolve error", err);
      toast.error("Failed to resolve company details. You can fill manually.");
      setIsPrefillLocked(false);
      setCompanyName(item.name);
      setWebsite("");
      setCompanyPhone("");
      setLocation("");
    }
  };

  // If user chooses "Add typed", keep fields unlocked (they explicitly want manual entry)
  const handleAddTyped = (typed: string) => {
    setShowInlineAutocomplete(false);
    setIsPrefillLocked(false);
    setCompanyName(typed);
    setWebsite("");
    setCompanyPhone("");
    setLocation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateRecruiterProfilePayload = {
        position: position.trim() || undefined,
        phone: phone.trim() || undefined,
        company: {
          // always send the current values (user may have edited)
          name: companyName.trim(),
          website: website.trim() || undefined,
          phone: companyPhone.trim() || undefined,
          // include placeId/location only when we are still locked (meaningful prefill)
          placeId: isPrefillLocked ? prefill?.placeId : undefined,
          location:
            isPrefillLocked && prefill
              ? {
                  placeId: prefill.placeId,
                  formattedAddress: prefill.formattedAddress,
                  lat: prefill.lat,
                  lng: prefill.lng,
                  country: prefill.country,
                  region: prefill.region,
                  city: prefill.city,
                  postalCode: prefill.postalCode,
                  street: prefill.street,
                  components: prefill.components,
                  source: prefill.source || "google",
                  raw: prefill.raw,
                }
              : location.trim()
              ? { formattedAddress: location.trim(), source: "manual" }
              : undefined,
        },
      };

      await onSubmit(payload);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error((err as any)?.message || "Failed to save company details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company name + change button */}
      <div className="space-y-2">
        <Label>
          Company Name <span className="text-destructive">*</span>
        </Label>

        {!showInlineAutocomplete ? (
          <div className="flex items-center gap-2">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              // disable only if prefill provided a name AND fields are locked
              disabled={isPrefillLocked && Boolean(prefill?.name)}
              className={errors.companyName ? "border-destructive" : ""}
            />
            <Button
              variant={mode === "prefill" ? "outline" : "ghost"}
              size="sm"
              onClick={handleOpenAutocomplete}
            >
              Change
            </Button>
          </div>
        ) : (
          <div>
            <CompanyAutocompleteInput
              value={companyName}
              onChange={setCompanyName}
              onSelect={handleSelectCompany}
              onAddTyped={handleAddTyped}
              placeholder="Search your company or type to add…"
            />
            <div className="flex gap-2 justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInlineAutocomplete(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Website</Label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className={errors.website ? "border-destructive" : ""}
            // only disable if prefill provided website and we are still locked
            disabled={isPrefillLocked && Boolean(prefill?.website)}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website}</p>
          )}
        </div>

        <div>
          <Label>Company Phone</Label>
          <Input
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            placeholder="+1 234 567 890"
            // only disable if prefill provided phone and we are still locked
            disabled={
              isPrefillLocked &&
              Boolean(prefill?.phone || prefill?.internationalPhone)
            }
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Label>Location</Label>
          {prefill?.formattedAddress && isPrefillLocked ? (
            <Input value={location} disabled />
          ) : (
            <LocationAutocomplete
              value={
                location ? ({ formattedAddress: location } as any) : undefined
              }
              onChange={(val: any) => setLocation(val?.formattedAddress || "")}
              placeholder="City, State, Country"
            />
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-sm font-medium mb-4">Your Information</h3>

        <div className="space-y-4">
          <div>
            <Label>Your Position</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., HR Manager, Recruiter"
            />
          </div>

          <div>
            <Label>Your Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save and Continue"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CompanyDetailsForm;
