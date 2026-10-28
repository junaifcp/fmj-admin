// Skills and job titles 4.4 — badges on the Management list: "→ Tally" for an alias row,
// "→ 3 skills" for a split row. Read once per page from /api/admin/taxonomy/links.
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getTaxonomyLinks } from "@/api/admin";
import { ManagedItem, TaxonomyLinks, TaxonomyRowType } from "@/types/admin";

export function useTaxonomyLinks(type: TaxonomyRowType, items: ManagedItem[] | undefined) {
  const [links, setLinks] = useState<TaxonomyLinks>({});
  const key = (items ?? []).map((i) => i._id).join(",");
  useEffect(() => {
    if (!key) {
      setLinks({});
      return;
    }
    let live = true;
    getTaxonomyLinks(type, key.split(","))
      .then((l) => live && setLinks(l ?? {}))
      .catch(() => live && setLinks({}));
    return () => {
      live = false;
    };
  }, [type, key]);
  return links;
}

export function linkColumn(type: TaxonomyRowType, links: TaxonomyLinks) {
  return {
    header: "Standard",
    render: (item: ManagedItem) => {
      const l = links[item._id];
      if (l?.aliasOf) return <Badge variant="secondary">→ {l.aliasOf.name}</Badge>;
      if (l?.splitCount) {
        return (
          <Badge variant="secondary">
            → {l.splitCount} {type === "skill" ? "skills" : "occupations"}
          </Badge>
        );
      }
      return null;
    },
  };
}
