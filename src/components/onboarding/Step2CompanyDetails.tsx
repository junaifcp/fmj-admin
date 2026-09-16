import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Phone, Globe, User, Sparkles, Edit } from "lucide-react";
import type { ResolvedDetails } from "@/types/onboarding";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import type { Location } from "@/types/location";

const step2Schema = z.object({
  companyName: z.string().min(1, "Company name is required").max(100),
  companyWebsite: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
      "Website must start with http:// or https://"
    ),
  companyPhone: z.string().optional(),
  companyLocation: z.any().optional(),
});

type Step2FormData = z.infer<typeof step2Schema>;

interface Step2CompanyDetailsProps {
  mode: "prefill" | "manual";
  prefill?: ResolvedDetails;
  typedName: string;
  onBack: () => void;
  onContinue: (data: Step2FormData) => void;
  onChangeCompany: () => void;
}

export const Step2CompanyDetails: React.FC<Step2CompanyDetailsProps> = ({
  mode,
  prefill,
  typedName,
  onBack,
  onContinue,
  onChangeCompany,
}) => {
  const isPrefilled = mode === "prefill" && !!prefill;
  const locked = isPrefilled;

  const [locationValue, setLocationValue] = useState<Location | null>(
    prefill?.formattedAddress
      ? {
          placeId: prefill.placeId || "",
          formattedAddress: prefill.formattedAddress,
          lat: prefill.lat || 0,
          lng: prefill.lng || 0,
          source: (prefill.source === "db" ? "google" : prefill.source) as "google" | "mapbox" | "here" | "manual" || "google",
        }
      : null
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
    defaultValues: {
      companyName: prefill?.name || typedName || "",
      companyWebsite: prefill?.website || "",
      companyPhone: prefill?.internationalPhone || prefill?.phone || "",
      companyLocation: locationValue,
    },
  });

  const onSubmit = (data: Step2FormData) => {
    onContinue(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Step 2 of 4</span>
        </div>
        <h3 className="text-lg font-semibold">Company Details</h3>
        <p className="text-sm text-muted-foreground">
          Review and complete your company information
        </p>
      </div>

      {locked && (
        <Alert className="border-primary/20 bg-primary/5">
          <Building2 className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Company details auto-filled from verified source
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onChangeCompany}
              className="h-auto p-1 text-primary hover:text-primary"
            >
              <Edit className="h-3 w-3 mr-1" />
              Change
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Name *
          </Label>
          <Input
            id="companyName"
            {...register("companyName")}
            disabled={locked}
            className={locked ? "bg-muted" : ""}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyWebsite" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Company Website
          </Label>
          <Input
            id="companyWebsite"
            {...register("companyWebsite")}
            placeholder="https://example.com"
            disabled={locked}
            className={locked ? "bg-muted" : ""}
          />
          {errors.companyWebsite && (
            <p className="text-sm text-destructive">{errors.companyWebsite.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyPhone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Company Phone
          </Label>
          <Input
            id="companyPhone"
            {...register("companyPhone")}
            placeholder="+1 (555) 123-4567"
            disabled={locked}
            className={locked ? "bg-muted" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyLocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Company Location
          </Label>
          {locked ? (
            <Input
              id="companyLocation"
              value={prefill?.formattedAddress || ""}
              disabled
              className="bg-muted"
            />
          ) : (
            <Controller
              name="companyLocation"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value as Location | null}
                  onChange={field.onChange}
                  placeholder="Search for location..."
                  allowManual={true}
                />
              )}
            />
          )}
        </div>

      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!isValid} size="lg" className="min-w-[120px]">
          Continue
        </Button>
      </div>
    </form>
  );
};
