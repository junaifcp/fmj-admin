import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onToggle: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  selected,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={selected}
      className={cn(
        "relative p-6 rounded-lg border-2 text-left transition-all duration-200",
        "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "group cursor-pointer",
        selected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-scale-in">
          <Check className="h-4 w-4" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {selected && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <span className="text-xs font-medium text-primary">✓ Selected</span>
        </div>
      )}
    </button>
  );
};
