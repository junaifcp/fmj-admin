// src/components/admin/recruiters/jobTagOptions.ts
// Job tags 2.2: the job tag list for the Jobs page filter, bulk menus and Edit tags.
import { useEffect, useState } from "react";
import { getTags } from "@/api/admin";
import type { AdminJobTag } from "@/types/recruiterAdmin";

/** Most tags one job may carry (backend MAX_JOB_TAGS). */
export const MAX_JOB_TAGS = 10;

/** Every job tag (up to 100, the existing list limit), loaded once per mount. */
export function useJobTagOptions(enabled = true): { tags: AdminJobTag[]; loading: boolean } {
  const [tags, setTags] = useState<AdminJobTag[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    getTags(1, 100, "", "job")
      .then((r) => {
        if (!alive) return;
        setTags(
          r.data
            .map((t) => ({
              _id: t._id,
              name: t.name,
              slug: t.slug,
              showToCandidates: !!t.showToCandidates,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => alive && setTags([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return { tags, loading };
}
