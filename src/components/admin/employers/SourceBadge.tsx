// Employer admin 6.2: Ad / Dashboard / Invite badge for an employer's sign-up source.
import React from "react";
import { Badge } from "@/components/ui/badge";
import type { EmployerSource } from "@/types/employerAdmin";
import { SOURCE_LABELS } from "./employerLabels";

const SourceBadge: React.FC<{ source: EmployerSource | null }> = ({ source }) =>
  source ? (
    <Badge variant={source === "ad_landing" ? "default" : "outline"}>{SOURCE_LABELS[source]}</Badge>
  ) : (
    <span className="text-xs text-muted-foreground">Not recorded</span>
  );

export default SourceBadge;
