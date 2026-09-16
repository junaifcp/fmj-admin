// src/components/onboarding/CompanyOnboardingModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Step1CompanySearch } from "./Step1CompanySearch";
import { Step2CompanyDetails } from "./Step2CompanyDetails";
import { Step3YourInfo } from "./Step3YourInfo";
import { Step3Features } from "./Step3Features";
import { useBusinessResolve } from "@/hooks/useBusinessResolve";
import type {
  BusinessSuggestItem,
  ResolvedDetails,
  UpdateRecruiterProfilePayload,
  SelectedFeature,
} from "@/types/onboarding";
import { updateRecruiterProfile } from "@/api/recruiter";
import { toast } from "sonner";

interface CompanyOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "search" | "details" | "yourinfo" | "features";

interface Step2Data {
  companyName: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyLocation?: string;
}

interface Step3Data {
  position: string;
  yourPhone?: string;
}

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

export const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  open,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"prefill" | "manual">("manual");
  const [prefillData, setPrefillData] = useState<ResolvedDetails | undefined>();
  const [typedName, setTypedName] = useState<string>("");
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resolve, loading: resolving } = useBusinessResolve();

  const handleSelectSuggestion = async (item: BusinessSuggestItem) => {
    if (!item.placeId) {
      setTypedName(item.name);
      setMode("manual");
      setPrefillData(undefined);
      return;
    }

    try {
      const resolved = await resolve(item.placeId);
      if (resolved && hasMeaningfulPrefill(resolved.details)) {
        setPrefillData(resolved.details);
        setMode("prefill");
        setTypedName("");
      } else {
        setPrefillData(undefined);
        setMode("manual");
        setTypedName(item.name || "");
      }
    } catch (err) {
      console.error("Resolve error", err);
      toast.error(
        "Failed to resolve company details. You can add the company manually."
      );
      setPrefillData(undefined);
      setMode("manual");
      setTypedName(item.name || "");
    }
  };

  const handleAddTyped = (typed: string) => {
    setTypedName(typed);
    setMode("manual");
    setPrefillData(undefined);
  };

  const handleStep1Next = () => {
    if (!typedName && !prefillData) return;
    setStep("details");
  };

  const handleStep2Continue = (data: Step2Data) => {
    setStep2Data(data);
    setStep("yourinfo");
  };

  const handleStep2Back = () => {
    setStep("search");
  };

  const handleStep3Continue = (data: Step3Data) => {
    setStep3Data(data);
    setStep("features");
  };

  const handleStep3Back = () => {
    setStep("details");
  };

  const handleStep4Back = () => {
    setStep("yourinfo");
  };

  const handleChangeCompany = () => {
    setStep("search");
    setPrefillData(undefined);
    setTypedName("");
    setMode("manual");
  };

  const handleFinish = async (selectedFeatures: SelectedFeature[]) => {
    if (isSubmitting || !step2Data || !step3Data) return;
    setIsSubmitting(true);

    try {
      const payload: UpdateRecruiterProfilePayload = {
        position: step3Data.position,
        phone: step3Data.yourPhone,
        features: selectedFeatures,
        company: {
          name: step2Data.companyName,
          website: step2Data.companyWebsite,
          phone: step2Data.companyPhone,
          ...(mode === "prefill" && prefillData?.placeId
            ? {
                placeId: prefillData.placeId,
                location: {
                  placeId: prefillData.placeId,
                  formattedAddress: prefillData.formattedAddress,
                  lat: prefillData.lat,
                  lng: prefillData.lng,
                  country: prefillData.country,
                  region: prefillData.region,
                  city: prefillData.city,
                  postalCode: prefillData.postalCode,
                  street: prefillData.street,
                  components: prefillData.components,
                  source: prefillData.source,
                  raw: prefillData.raw,
                },
              }
            : {}),
        },
      };

      await updateRecruiterProfile(payload);

      toast.success("🎉 Profile completed! Your free trial is now active.");

      try {
        onComplete();
      } catch (err) {
        console.warn("onComplete handler threw:", err);
      }
    } catch (err: any) {
      console.error("Submit error", err);
      toast.error(err?.message || "Failed to complete profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* intentionally no-op — parent controls modal visibility */
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            {step === "search" &&
              "Search for your company or add it manually to continue."}
            {step === "details" && "Provide your company details."}
            {step === "yourinfo" && "Tell us about your role."}
            {step === "features" &&
              "Select features to unlock your free trial and perks."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "search" && (
            <Step1CompanySearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectSuggestion={handleSelectSuggestion}
              onAddTyped={handleAddTyped}
              onNext={handleStep1Next}
              hasSelection={!!(typedName || prefillData)}
              resolving={resolving}
            />
          )}

          {step === "details" && (
            <Step2CompanyDetails
              mode={mode}
              prefill={prefillData}
              typedName={typedName}
              onBack={handleStep2Back}
              onContinue={handleStep2Continue}
              onChangeCompany={handleChangeCompany}
            />
          )}

          {step === "yourinfo" && (
            <Step3YourInfo
              onBack={handleStep3Back}
              onContinue={handleStep3Continue}
            />
          )}

          {step === "features" && (
            <Step3Features
              onBack={handleStep4Back}
              onFinish={handleFinish}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyOnboardingModal;
