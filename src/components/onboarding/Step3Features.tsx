import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { GiftAnimation } from "./GiftAnimation";
import type { SelectedFeature } from "@/types/onboarding";

interface Step3FeaturesProps {
  onBack: () => void;
  onFinish: (selectedFeatures: SelectedFeature[]) => void;
  isSubmitting: boolean;
}

const FEATURES = [
  {
    id: "hrms" as SelectedFeature,
    title: "HRMS",
    description: "Human Resource Management System for managing employees, payroll, and HR operations",
    icon: "👥",
  },
  {
    id: "recruitment_platform" as SelectedFeature,
    title: "Recruitment Platform",
    description: "Advanced tools for job posting, candidate tracking, and hiring workflows",
    icon: "🎯",
  },
] as const;

export const Step3Features: React.FC<Step3FeaturesProps> = ({
  onBack,
  onFinish,
  isSubmitting,
}) => {
  const [selected, setSelected] = useState<SelectedFeature[]>([]);

  const toggleFeature = (featureId: SelectedFeature) => {
    setSelected((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleFinish = () => {
    onFinish(selected);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Step 4 of 4</span>
        </div>
        
        <GiftAnimation />
        
        <h3 className="text-lg font-semibold">What do you need?</h3>
        <p className="text-sm text-muted-foreground">
          Select the features you're interested in to unlock your free trial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.id}
            {...feature}
            selected={selected.includes(feature.id)}
            onToggle={() => toggleFeature(feature.id)}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 animate-scale-in">
          <div className="flex items-center justify-center gap-2 text-primary mb-1">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-semibold">Unlocking Perks</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selected.length} feature{selected.length > 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={isSubmitting}
          size="lg"
          className="min-w-[120px]"
        >
          {isSubmitting ? "Finishing..." : "Finish"}
        </Button>
      </div>
    </div>
  );
};
