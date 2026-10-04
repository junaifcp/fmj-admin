// src/pages/admin/candidates/FitMySkillDataPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Filter, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fitmyskillLeadsApi } from "@/api/fitmyskillLeads";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import type { Location } from "@/types/location";
import {
  LEAD_FILTER_KEYS,
  LEAD_LIST_ARRAY_KEYS,
  LEAD_LIST_PARAM_KEYS,
  type Assignee,
  type CourseKey,
  type LeadDetail,
  type LeadFilterValue,
  type LeadListResponse,
  type LeadOptionsCatalog,
  type LeadRow,
  type LeadStatus,
  type OptionSearchField,
  type PlaceLabel,
  type SavedFilter,
  type SearchOption,
} from "@/types/fitmyskillLeads";

// ---------------------------------------------------------------------------
// Constants and URL helpers
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = "25";
const DEFAULT_SORT = "lastActive";
const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS = [
  { value: "lastActive", label: "Last active" },
  { value: "signup", label: "Signup date" },
  { value: "experience", label: "Experience" },
  { value: "name", label: "Name" },
];
const LIMIT_OPTIONS = ["25", "50", "100"];
const LAST_ACTIVE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];
const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  enrolled: "Enrolled",
  not_interested: "Not interested",
};

const splitList = (v: string | null): string[] =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

const DEFAULT_RADIUS_KM = "50";

type RadiusPrefix = "current" | "dreamJob";

function placeFromParams(p: URLSearchParams, prefix: RadiusPrefix): Location | null {
  const latRaw = p.get(`${prefix}Lat`);
  const lngRaw = p.get(`${prefix}Lng`);
  if (!latRaw || !lngRaw) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    placeId: `${prefix}-radius`,
    formattedAddress: p.get(`${prefix}Place`) ?? "",
    lat,
    lng,
    source: "google",
  };
}

function writeRadius(next: URLSearchParams, prefix: RadiusPrefix, place: Location | null, km: string) {
  const latKey = `${prefix}Lat`;
  const lngKey = `${prefix}Lng`;
  const kmKey = `${prefix}RadiusKm`;
  const placeKey = `${prefix}Place`;
  if (
    !place ||
    !Number.isFinite(place.lat) ||
    !Number.isFinite(place.lng) ||
    (place.lat === 0 && place.lng === 0)
  ) {
    next.delete(latKey);
    next.delete(lngKey);
    next.delete(kmKey);
    next.delete(placeKey);
    return;
  }
  next.set(latKey, String(place.lat));
  next.set(lngKey, String(place.lng));
  next.set(kmKey, km.trim() || DEFAULT_RADIUS_KM);
  const label = place.formattedAddress.trim();
  if (label) next.set(placeKey, label);
  else next.delete(placeKey);
}

// Old country/city checkbox params. Apply and Clear all drop them so a stale link cannot filter.
const RETIRED_LOCATION_KEYS = ["dreamJobLocations", "currentLocations"];

interface Draft {
  dreamJobTitles: SearchOption[];
  industries: string[];
  salaryMin: string;
  salaryMax: string;
  skillsHave: SearchOption[];
  skillsHaveMode: "any" | "all";
  skillsNotHave: SearchOption[];
  languages: string[];
  educationLevels: string[];
  fieldOfStudyIds: SearchOption[];
  passingYearFrom: string;
  passingYearTo: string;
  workStatuses: string[];
  experienceMin: string;
  experienceMax: string;
  currentRadiusPlace: Location | null;
  currentRadiusKm: string;
  dreamJobRadiusPlace: Location | null;
  dreamJobRadiusKm: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  lastActive: string; // "" | 7d | 30d | 90d | custom (custom is UI only)
  lastActiveFrom: string;
  lastActiveTo: string;
  signupFrom: string;
  signupTo: string;
  leadStatuses: string[];
}

// Params that the draft edits. search, currentJobTitle, sort, page and limit are not part of it.
const DRAFT_PARAM_KEYS = LEAD_FILTER_KEYS.filter(
  (k) => k !== "search" && k !== "currentJobTitle"
);

// ---------------------------------------------------------------------------
// Typeahead (ids only; never creates master rows)
// ---------------------------------------------------------------------------

interface OptionSearchProps {
  field: OptionSearchField;
  placeholder: string;
  selected: SearchOption[];
  onChange: (next: SearchOption[]) => void;
  onSeen: (option: SearchOption) => void;
}

const OptionSearch: React.FC<OptionSearchProps> = ({
  field,
  placeholder,
  selected,
  onChange,
  onSeen,
}) => {
  const [text, setText] = useState("");
  const [items, setItems] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const found = await fitmyskillLeadsApi.searchOptions(
          field,
          q,
          controller.signal
        );
        if (!controller.signal.aborted) setItems(found);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text, field]);

  const choices = items.filter((i) => !selected.some((s) => s.id === i.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        {loading && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {open && text.trim().length >= 2 && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            {choices.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {loading ? "Searching…" : "No matches"}
              </div>
            ) : (
              choices.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSeen(c);
                    onChange([...selected, c]);
                    setText("");
                    setItems([]);
                  }}
                >
                  {c.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <Badge key={s.id} variant="secondary" className="gap-1">
              {s.label}
              <button
                type="button"
                aria-label={`Remove ${s.label}`}
                onClick={() => onChange(selected.filter((x) => x.id !== s.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Catalog checkbox list
// ---------------------------------------------------------------------------

interface CheckboxListProps {
  idPrefix: string;
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}

const CheckboxList: React.FC<CheckboxListProps> = ({
  idPrefix,
  options,
  selected,
  onChange,
}) => {
  const [filter, setFilter] = useState("");
  const shown = filter.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(filter.trim().toLowerCase())
      )
    : options;

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No options yet.</p>;
  }
  return (
    <div className="space-y-2">
      {options.length > 12 && (
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter list"
          className="h-8"
        />
      )}
      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {shown.map((o) => {
          const id = `${idPrefix}-${o.value}`;
          const checked = selected.includes(o.value);
          return (
            <div key={o.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(c) =>
                  onChange(
                    c === true
                      ? [...selected, o.value]
                      : selected.filter((v) => v !== o.value)
                  )
                }
              />
              <label htmlFor={id} className="cursor-pointer text-sm">
                {o.label}
                {o.hint && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({o.hint})
                  </span>
                )}
              </label>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="text-sm text-muted-foreground">No matches.</p>
        )}
      </div>
    </div>
  );
};

const FilterGroup: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => (
  <Collapsible defaultOpen={defaultOpen} className="border-b last:border-b-0">
    <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-sm font-medium">
      {title}
      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-3 pb-4">{children}</CollapsibleContent>
  </Collapsible>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-1.5">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    {children}
  </div>
);

const RangeInputs: React.FC<{
  type?: string;
  minLabel: string;
  maxLabel: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}> = ({ type = "number", minLabel, maxLabel, min, max, onMin, onMax }) => (
  <div className="grid grid-cols-2 gap-2">
    <Field label={minLabel}>
      <Input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={min}
        onChange={(e) => onMin(e.target.value)}
      />
    </Field>
    <Field label={maxLabel}>
      <Input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={max}
        onChange={(e) => onMax(e.target.value)}
      />
    </Field>
  </div>
);

const RadiusFields: React.FC<{
  idPrefix: string;
  label: string;
  place: Location | null;
  km: string;
  onPlace: (loc: Location | null) => void;
  onKm: (v: string) => void;
}> = ({ idPrefix, label, place, km, onPlace, onKm }) => (
  <div className="space-y-2">
    <Field label={label}>
      <LocationAutocomplete
        value={place}
        onChange={onPlace}
        allowManual={false}
        placeholder="Search a place"
      />
    </Field>
    <Field label="Radius (km)">
      <Input
        id={`${idPrefix}-km`}
        type="number"
        min={1}
        max={500}
        value={km}
        onChange={(e) => onKm(e.target.value)}
      />
    </Field>
  </div>
);

// ---------------------------------------------------------------------------
// Filter panel (shared by the desktop column and the mobile sheet)
// ---------------------------------------------------------------------------

interface FilterPanelProps {
  idPrefix: string;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  catalog: LeadOptionsCatalog | null;
  catalogError: string | null;
  onRetryCatalog: () => void;
  jobTitleText: string;
  setJobTitleText: (v: string) => void;
  onSeen: (option: SearchOption) => void;
  onApply: () => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  idPrefix,
  draft,
  setDraft,
  catalog,
  catalogError,
  onRetryCatalog,
  jobTitleText,
  setJobTitleText,
  onSeen,
  onApply,
  onClear,
}) => {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const plain = (list: string[] = []) => list.map((v) => ({ value: v, label: v }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {catalogError && (
          <div className="py-3 text-sm text-destructive">
            Could not load filter options.{" "}
            <button type="button" className="underline" onClick={onRetryCatalog}>
              Retry
            </button>
          </div>
        )}

        <FilterGroup title="Dream job" defaultOpen>
          <Field label="Job titles">
            <OptionSearch
              field="jobTitles"
              placeholder="Search job titles"
              selected={draft.dreamJobTitles}
              onChange={(v) => set("dreamJobTitles", v)}
              onSeen={onSeen}
            />
          </Field>
          <RadiusFields
            idPrefix={`${idPrefix}-dj-radius`}
            label="Dream job location"
            place={draft.dreamJobRadiusPlace}
            km={draft.dreamJobRadiusKm}
            onPlace={(loc) => set("dreamJobRadiusPlace", loc)}
            onKm={(v) => set("dreamJobRadiusKm", v)}
          />
          <Field label="Industries">
            <CheckboxList
              idPrefix={`${idPrefix}-ind`}
              options={plain(catalog?.industries)}
              selected={draft.industries}
              onChange={(v) => set("industries", v)}
            />
          </Field>
          <RangeInputs
            minLabel="Salary min (₹)"
            maxLabel="Salary max (₹)"
            min={draft.salaryMin}
            max={draft.salaryMax}
            onMin={(v) => set("salaryMin", v)}
            onMax={(v) => set("salaryMax", v)}
          />
        </FilterGroup>

        <FilterGroup title="Skills" defaultOpen>
          <Field label="Skills have">
            <OptionSearch
              field="skills"
              placeholder="Search skills"
              selected={draft.skillsHave}
              onChange={(v) => set("skillsHave", v)}
              onSeen={onSeen}
            />
          </Field>
          <div className="flex gap-1">
            {(["any", "all"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={draft.skillsHaveMode === mode ? "default" : "outline"}
                onClick={() => set("skillsHaveMode", mode)}
              >
                {mode === "any" ? "Any" : "All"}
              </Button>
            ))}
          </div>
          <Field label="Skills not have">
            <OptionSearch
              field="skills"
              placeholder="Search skills"
              selected={draft.skillsNotHave}
              onChange={(v) => set("skillsNotHave", v)}
              onSeen={onSeen}
            />
          </Field>
          <Field label="Languages">
            <CheckboxList
              idPrefix={`${idPrefix}-lang`}
              options={plain(catalog?.languages)}
              selected={draft.languages}
              onChange={(v) => set("languages", v)}
            />
          </Field>
        </FilterGroup>

        <FilterGroup title="Education">
          <Field label="Qualification">
            <CheckboxList
              idPrefix={`${idPrefix}-edu`}
              options={catalog?.educationLevels ?? []}
              selected={draft.educationLevels}
              onChange={(v) => set("educationLevels", v)}
            />
          </Field>
          <Field label="Course or stream">
            <OptionSearch
              field="streams"
              placeholder="Search streams"
              selected={draft.fieldOfStudyIds}
              onChange={(v) => set("fieldOfStudyIds", v)}
              onSeen={onSeen}
            />
          </Field>
          <RangeInputs
            minLabel="Passing year from"
            maxLabel="Passing year to"
            min={draft.passingYearFrom}
            max={draft.passingYearTo}
            onMin={(v) => set("passingYearFrom", v)}
            onMax={(v) => set("passingYearTo", v)}
          />
        </FilterGroup>

        <FilterGroup title="Work">
          <Field label="Current status">
            <CheckboxList
              idPrefix={`${idPrefix}-ws`}
              options={catalog?.workStatuses ?? []}
              selected={draft.workStatuses}
              onChange={(v) => set("workStatuses", v)}
            />
          </Field>
          <Field label="Current job title">
            <Input
              value={jobTitleText}
              placeholder="e.g. Accountant"
              onChange={(e) => setJobTitleText(e.target.value)}
            />
          </Field>
          <RangeInputs
            minLabel="Experience min (years)"
            maxLabel="Experience max (years)"
            min={draft.experienceMin}
            max={draft.experienceMax}
            onMin={(v) => set("experienceMin", v)}
            onMax={(v) => set("experienceMax", v)}
          />
        </FilterGroup>

        <FilterGroup title="Personal">
          <RadiusFields
            idPrefix={`${idPrefix}-cur-radius`}
            label="Candidate location"
            place={draft.currentRadiusPlace}
            km={draft.currentRadiusKm}
            onPlace={(loc) => set("currentRadiusPlace", loc)}
            onKm={(v) => set("currentRadiusKm", v)}
          />
          <Field label="Gender">
            <Select
              value={draft.gender || "any"}
              onValueChange={(v) => set("gender", v === "any" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {(catalog?.genders ?? []).map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <RangeInputs
            minLabel="Age min"
            maxLabel="Age max"
            min={draft.ageMin}
            max={draft.ageMax}
            onMin={(v) => set("ageMin", v)}
            onMax={(v) => set("ageMax", v)}
          />
        </FilterGroup>

        <FilterGroup title="Activity">
          <Field label="Last active">
            <Select
              value={draft.lastActive || "any"}
              onValueChange={(v) =>
                setDraft((d) =>
                  v === "custom"
                    ? { ...d, lastActive: "custom" }
                    : { ...d, lastActive: v === "any" ? "" : v, lastActiveFrom: "", lastActiveTo: "" }
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAST_ACTIVE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {draft.lastActive === "custom" && (
            <RangeInputs
              type="date"
              minLabel="Last active from"
              maxLabel="Last active to"
              min={draft.lastActiveFrom}
              max={draft.lastActiveTo}
              onMin={(v) => set("lastActiveFrom", v)}
              onMax={(v) => set("lastActiveTo", v)}
            />
          )}
          <RangeInputs
            type="date"
            minLabel="Signup from"
            maxLabel="Signup to"
            min={draft.signupFrom}
            max={draft.signupTo}
            onMin={(v) => set("signupFrom", v)}
            onMax={(v) => set("signupTo", v)}
          />
        </FilterGroup>

        <FilterGroup title="Lead">
          <Field label="Lead status">
            <CheckboxList
              idPrefix={`${idPrefix}-ls`}
              options={catalog?.leadStatuses ?? []}
              selected={draft.leadStatuses}
              onChange={(v) => set("leadStatuses", v)}
            />
          </Field>
        </FilterGroup>
      </div>

      <div className="flex gap-2 border-t p-4">
        <Button type="button" className="flex-1" onClick={onApply}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
          Clear all
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

const placeText = (p?: PlaceLabel) =>
  p ? [p.city, p.country].filter(Boolean).join(", ") : "";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const StatusBadge: React.FC<{ status?: LeadStatus }> = ({ status }) => {
  const s: LeadStatus = status && STATUS_LABELS[status] ? status : "new";
  return <Badge variant={s === "new" ? "secondary" : "outline"}>{STATUS_LABELS[s]}</Badge>;
};

const pageWindow = (page: number, totalPages: number): (number | "…")[] => {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
};

const LeadTableRow: React.FC<{
  row: LeadRow;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  onOpen: () => void;
}> = ({ row, selected, onToggle, onOpen }) => {
  const phone = [row.dialCode, row.phone].filter(Boolean).join(" ");
  const education = row.education
    ? [row.education.level, row.education.stream].filter(Boolean).join(" · ")
    : "";
  return (
    <TableRow
      className="cursor-pointer"
      data-state={selected ? "selected" : undefined}
      onClick={onOpen}
    >
      {/* The checkbox cell must not open the drawer. */}
      <TableCell className="w-8" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={`Select ${row.name}`}
          checked={selected}
          onCheckedChange={(c) => onToggle(c === true)}
        />
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="font-medium">{row.name || "—"}</div>
        {phone && <div className="text-xs text-muted-foreground">{phone}</div>}
        {placeText(row.currentLocation) && (
          <div className="text-xs text-muted-foreground">{placeText(row.currentLocation)}</div>
        )}
      </TableCell>
      <TableCell className="min-w-[200px]">
        {row.dreamJobs?.length ? (
          row.dreamJobs.map((dj, i) => (
            <div key={i} className="mb-1 last:mb-0">
              <div className="text-sm">{dj.title || "—"}</div>
              {dj.locations?.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {dj.locations.map(placeText).filter(Boolean).join(" | ")}
                </div>
              )}
            </div>
          ))
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="min-w-[180px]">
        {row.skills?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.skills.map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
              </Badge>
            ))}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="min-w-[140px]">{education || "—"}</TableCell>
      <TableCell>{row.experienceYears == null ? "—" : `${row.experienceYears} yrs`}</TableCell>
      <TableCell className="whitespace-nowrap">{formatDate(row.lastActive)}</TableCell>
      <TableCell>
        <StatusBadge status={row.leadStatus} />
      </TableCell>
    </TableRow>
  );
};

// ---------------------------------------------------------------------------
// Detail drawer (right sheet; separate from the filter sheet)
// ---------------------------------------------------------------------------

const NONE = "__none__";
const NOTES_MAX = 2000;

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="space-y-1">
    <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
    <div className="text-sm">{children}</div>
  </div>
);

const span = (start?: string, end?: string, present?: boolean) =>
  `${formatDate(start)} – ${present ? "Present" : formatDate(end)}`;

interface DrawerProps {
  candidateId: string | null;
  onClose: () => void;
  catalog: LeadOptionsCatalog | null;
  assignees: Assignee[];
  ensureAssignees: () => void;
  onSaved: () => void;
}

const LeadDetailDrawer: React.FC<DrawerProps> = ({
  candidateId,
  onClose,
  catalog,
  assignees,
  ensureAssignees,
  onSaved,
}) => {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [status, setStatus] = useState<LeadStatus>("new");
  const [course, setCourse] = useState(NONE);
  const [assignee, setAssignee] = useState(NONE);
  const [notes, setNotes] = useState("");

  const seed = (d: LeadDetail) => {
    setStatus(d.leadStatus ?? "new");
    setCourse(d.courseKey ?? NONE);
    setAssignee(d.assignedTo?.id ?? NONE);
    setNotes(d.notes ?? "");
  };

  useEffect(() => {
    if (!candidateId) return;
    ensureAssignees();
    const controller = new AbortController();
    setDetail(null);
    setLoadError(null);
    setSaveError(null);
    setLoading(true);
    fitmyskillLeadsApi
      .getLead(candidateId, controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setDetail(d);
        seed(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return;
        setLoadError(e.message);
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  const save = async () => {
    if (!candidateId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await fitmyskillLeadsApi.updateLead(candidateId, {
        status,
        courseKey: course === NONE ? null : (course as CourseKey),
        assignedTo: assignee === NONE ? null : assignee,
        notes,
      });
      setDetail(updated);
      seed(updated);
      onSaved(); // refetch the list so the table status matches
    } catch (e) {
      setSaveError((e as Error).message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  // Keep the current assignee selectable even if they are no longer in the assignee list.
  const assigneeChoices =
    detail?.assignedTo && !assignees.some((a) => a.id === detail.assignedTo!.id)
      ? [...assignees, { id: detail.assignedTo.id, name: detail.assignedTo.name }]
      : assignees;

  const phone = detail ? [detail.dialCode, detail.phone].filter(Boolean).join(" ") : "";

  return (
    <Sheet open={candidateId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail?.name || "Candidate"}</SheetTitle>
          <SheetDescription>Lead details and tracking</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {loadError && (
          <div role="alert" className="mt-6 rounded-md border border-destructive/50 p-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {detail && (
          <div className="mt-6 space-y-5">
            <Block title="Contact">
              <div>{detail.email || "—"}</div>
              <div>{phone || "—"}</div>
              <div className="text-muted-foreground">{placeText(detail.currentLocation) || "—"}</div>
            </Block>
            <Block title="Dream jobs">
              {detail.dreamJobs.length
                ? detail.dreamJobs.map((dj, i) => (
                    <div key={i}>
                      {dj.title || "—"}
                      {dj.locations.length > 0 && (
                        <span className="text-muted-foreground">
                          {" · "}
                          {dj.locations.map(placeText).filter(Boolean).join(" | ")}
                        </span>
                      )}
                    </div>
                  ))
                : "—"}
            </Block>
            <Block title="Skills">
              {detail.skills.length ? (
                <div className="flex flex-wrap gap-1">
                  {detail.skills.map((sk, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                      {sk.name} · {sk.level}
                    </Badge>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Block>
            <Block title="Education">
              {detail.education.length
                ? detail.education.map((e, i) => (
                    <div key={i}>
                      {[e.level, e.stream].filter(Boolean).join(" · ") || "—"}
                      <div className="text-xs text-muted-foreground">
                        {[e.institutionName, span(e.startDate, e.endDate, e.isPresent)]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                  ))
                : "—"}
            </Block>
            <Block title="Experience">
              {detail.experience.length
                ? detail.experience.map((x, i) => (
                    <div key={i}>
                      {[x.roleName, x.companyName].filter(Boolean).join(" at ") || "—"}
                      <div className="text-xs text-muted-foreground">
                        {span(x.startDate, x.endDate, x.isPresent)}
                      </div>
                    </div>
                  ))
                : "—"}
            </Block>
            <Block title="Work status">
              {catalog?.workStatuses.find((w) => w.value === detail.workStatus)?.label ??
                detail.workStatus ??
                "—"}
            </Block>
            <Block title="Last contacted">{formatDate(detail.lastContactedAt ?? undefined)}</Block>

            <div className="space-y-4 border-t pt-4">
              <Field label="Status">
                <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {STATUS_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Course">
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {(catalog?.courses ?? []).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assignee">
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {assigneeChoices.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Notes (${notes.length}/${NOTES_MAX})`}>
                <Textarea
                  rows={5}
                  maxLength={NOTES_MAX}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              {saveError && (
                <div role="alert" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                  {saveError}
                </div>
              )}
              <Button onClick={save} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FitMySkillDataPage: React.FC = () => {
  const [params, setParams] = useSearchParams();

  // Labels for ids seen in this visit (typeahead picks). Unknown ids fall back to the id.
  const labelCache = useRef(new Map<string, string>());
  const onSeen = useCallback((o: SearchOption) => {
    labelCache.current.set(o.id, o.label);
  }, []);

  // --- catalog, fetched once per visit ---
  const [catalog, setCatalog] = useState<LeadOptionsCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogTry, setCatalogTry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogError(null);
    fitmyskillLeadsApi
      .getOptions(controller.signal)
      .then(setCatalog)
      .catch((e: Error) => {
        if (!controller.signal.aborted) setCatalogError(e.message);
      });
    return () => controller.abort();
  }, [catalogTry]);

  // --- URL -> draft ---
  const draftFromUrl = useCallback(
    (p: URLSearchParams): Draft => {
      const ids = (key: string): SearchOption[] =>
        splitList(p.get(key)).map((id) => ({ id, label: labelCache.current.get(id) ?? id }));
      const lastActive = p.get("lastActive")
        ? p.get("lastActive")!
        : p.get("lastActiveFrom") || p.get("lastActiveTo")
        ? "custom"
        : "";
      return {
        dreamJobTitles: ids("dreamJobTitles"),
        industries: splitList(p.get("industries")),
        salaryMin: p.get("salaryMin") ?? "",
        salaryMax: p.get("salaryMax") ?? "",
        skillsHave: ids("skillsHave"),
        skillsHaveMode: p.get("skillsHaveMode") === "all" ? "all" : "any",
        skillsNotHave: ids("skillsNotHave"),
        languages: splitList(p.get("languages")),
        educationLevels: splitList(p.get("educationLevels")),
        fieldOfStudyIds: ids("fieldOfStudyIds"),
        passingYearFrom: p.get("passingYearFrom") ?? "",
        passingYearTo: p.get("passingYearTo") ?? "",
        workStatuses: splitList(p.get("workStatuses")),
        experienceMin: p.get("experienceMin") ?? "",
        experienceMax: p.get("experienceMax") ?? "",
        currentRadiusPlace: placeFromParams(p, "current"),
        currentRadiusKm: p.get("currentRadiusKm") ?? DEFAULT_RADIUS_KM,
        dreamJobRadiusPlace: placeFromParams(p, "dreamJob"),
        dreamJobRadiusKm: p.get("dreamJobRadiusKm") ?? DEFAULT_RADIUS_KM,
        gender: p.get("gender") ?? "",
        ageMin: p.get("ageMin") ?? "",
        ageMax: p.get("ageMax") ?? "",
        lastActive,
        lastActiveFrom: p.get("lastActiveFrom") ?? "",
        lastActiveTo: p.get("lastActiveTo") ?? "",
        signupFrom: p.get("signupFrom") ?? "",
        signupTo: p.get("signupTo") ?? "",
        leadStatuses: splitList(p.get("leadStatuses")),
      };
    },
    []
  );

  const [draft, setDraft] = useState<Draft>(() => draftFromUrl(params));

  // Re-seed the draft whenever the applied filters in the URL change (apply, chip, clear, back).
  const appliedKey = DRAFT_PARAM_KEYS.map((k) => `${k}=${params.get(k) ?? ""}`).join("&");
  useEffect(() => {
    setDraft(draftFromUrl(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);

  // --- URL writers ---
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void, replace = false) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          next.delete("page");
          return next;
        },
        { replace }
      );
    },
    [setParams]
  );

  const setOrDelete = (next: URLSearchParams, key: string, value: string) => {
    if (value.trim()) next.set(key, value.trim());
    else next.delete(key);
  };

  const applyDraft = () => {
    update((next) => {
      const ids = (xs: SearchOption[]) => xs.map((x) => x.id).join(",");
      setOrDelete(next, "dreamJobTitles", ids(draft.dreamJobTitles));
      setOrDelete(next, "industries", draft.industries.join(","));
      setOrDelete(next, "salaryMin", draft.salaryMin);
      setOrDelete(next, "salaryMax", draft.salaryMax);
      setOrDelete(next, "skillsHave", ids(draft.skillsHave));
      // all is written only with a non-empty skills-have list; any is the default and stays out.
      if (draft.skillsHave.length > 0 && draft.skillsHaveMode === "all") {
        next.set("skillsHaveMode", "all");
      } else {
        next.delete("skillsHaveMode");
      }
      setOrDelete(next, "skillsNotHave", ids(draft.skillsNotHave));
      setOrDelete(next, "languages", draft.languages.join(","));
      setOrDelete(next, "educationLevels", draft.educationLevels.join(","));
      setOrDelete(next, "fieldOfStudyIds", ids(draft.fieldOfStudyIds));
      setOrDelete(next, "passingYearFrom", draft.passingYearFrom);
      setOrDelete(next, "passingYearTo", draft.passingYearTo);
      setOrDelete(next, "workStatuses", draft.workStatuses.join(","));
      setOrDelete(next, "experienceMin", draft.experienceMin);
      setOrDelete(next, "experienceMax", draft.experienceMax);
      writeRadius(next, "dreamJob", draft.dreamJobRadiusPlace, draft.dreamJobRadiusKm);
      writeRadius(next, "current", draft.currentRadiusPlace, draft.currentRadiusKm);
      setOrDelete(next, "gender", draft.gender);
      setOrDelete(next, "ageMin", draft.ageMin);
      setOrDelete(next, "ageMax", draft.ageMax);
      const custom = draft.lastActive === "custom";
      setOrDelete(next, "lastActive", custom ? "" : draft.lastActive);
      setOrDelete(next, "lastActiveFrom", custom ? draft.lastActiveFrom : "");
      setOrDelete(next, "lastActiveTo", custom ? draft.lastActiveTo : "");
      setOrDelete(next, "signupFrom", draft.signupFrom);
      setOrDelete(next, "signupTo", draft.signupTo);
      setOrDelete(next, "leadStatuses", draft.leadStatuses.join(","));
      RETIRED_LOCATION_KEYS.forEach((k) => next.delete(k));
    });
    setSheetOpen(false);
  };

  // Removes every filter and the search; sort and limit stay. Does not touch the session.
  const clearAll = () => {
    update((next) => {
      LEAD_FILTER_KEYS.forEach((k) => next.delete(k));
      RETIRED_LOCATION_KEYS.forEach((k) => next.delete(k));
    });
    setSheetOpen(false);
  };

  // --- debounced text inputs: search and currentJobTitle write the URL themselves ---
  const useDebouncedParam = (key: string) => {
    const urlValue = params.get(key) ?? "";
    const [text, setText] = useState(urlValue);
    const lastWritten = useRef(urlValue);
    const urlValueRef = useRef(urlValue);
    urlValueRef.current = urlValue;

    // Pick up changes made elsewhere (Clear all, back button, shared link).
    useEffect(() => {
      if (urlValue !== lastWritten.current) {
        lastWritten.current = urlValue;
        setText(urlValue);
      }
    }, [urlValue]);

    useEffect(() => {
      const value = text.trim();
      if (value === urlValueRef.current) return;
      const timer = window.setTimeout(() => {
        lastWritten.current = value;
        update((next) => setOrDelete(next, key, value), true);
      }, SEARCH_DEBOUNCE_MS);
      return () => window.clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    return [text, setText] as const;
  };
  const [searchText, setSearchText] = useDebouncedParam("search");
  const [jobTitleText, setJobTitleText] = useDebouncedParam("currentJobTitle");

  // --- list fetch; a newer request aborts the previous one ---
  const apiParams = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of LEAD_LIST_PARAM_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
    return out;
  }, [params]);
  const apiKey = JSON.stringify(apiParams);

  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  // Row selection (current page only) and the detail drawer.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const assigneesRequested = useRef(false);
  const ensureAssignees = useCallback(() => {
    if (assigneesRequested.current) return;
    assigneesRequested.current = true;
    fitmyskillLeadsApi
      .getAssignees()
      .then(setAssignees)
      .catch(() => {
        assigneesRequested.current = false; // allow a retry next time
      });
  }, []);

  const [bulkAssign, setBulkAssign] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // A new page, filter set, sort or page size starts with nothing selected.
  useEffect(() => {
    setSelected(new Set());
    setBulkAssign("");
    setBulkStatus("");
    setBulkError(null);
  }, [apiKey]);

  useEffect(() => {
    if (selected.size > 0) ensureAssignees();
  }, [selected.size, ensureAssignees]);

  const [result, setResult] = useState<LeadListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fitmyskillLeadsApi
      .list(apiParams, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult(res);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return; // superseded; not an error
        setError(e.message || "Could not load leads");
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, reloadTick]);

  // --- chips from the applied URL ---
  const labelFor = useCallback(
    (key: string, value: string): string => {
      const fromList = (list?: { value: string; label: string }[]) =>
        list?.find((o) => o.value === value)?.label;
      switch (key) {
        case "educationLevels":
          return fromList(catalog?.educationLevels) ?? value;
        case "workStatuses":
          return fromList(catalog?.workStatuses) ?? value;
        case "leadStatuses":
          return fromList(catalog?.leadStatuses) ?? value;
        case "gender":
          return fromList(catalog?.genders) ?? value;
        case "dreamJobTitles":
        case "skillsHave":
        case "skillsNotHave":
        case "fieldOfStudyIds":
          return labelCache.current.get(value) ?? value;
        default:
          return value;
      }
    },
    [catalog]
  );

  interface Chip {
    id: string;
    label: string;
    remove: (next: URLSearchParams) => void;
  }
  const chips = useMemo<Chip[]>(() => {
    const out: Chip[] = [];
    const listChips = (key: string, prefix: string) => {
      const values = splitList(params.get(key));
      values.forEach((v) =>
        out.push({
          id: `${key}:${v}`,
          label: `${prefix}: ${labelFor(key, v)}`,
          remove: (next) => {
            const rest = splitList(next.get(key)).filter((x) => x !== v);
            if (rest.length) next.set(key, rest.join(","));
            else {
              next.delete(key);
              if (key === "skillsHave") next.delete("skillsHaveMode");
            }
          },
        })
      );
    };
    listChips("dreamJobTitles", "Dream job");
    listChips("industries", "Industry");
    listChips("skillsHave", params.get("skillsHaveMode") === "all" ? "Has all" : "Has");
    listChips("skillsNotHave", "Lacks");
    listChips("languages", "Language");
    listChips("educationLevels", "Education");
    listChips("fieldOfStudyIds", "Stream");
    listChips("workStatuses", "Status");
    listChips("leadStatuses", "Lead");

    const radiusChip = (prefix: RadiusPrefix, label: string) => {
      const km = params.get(`${prefix}RadiusKm`);
      const lat = params.get(`${prefix}Lat`);
      const lng = params.get(`${prefix}Lng`);
      if (!km || !lat || !lng) return;
      const place = params.get(`${prefix}Place`);
      out.push({
        id: `${prefix}-radius`,
        label: place ? `${label}: ${km} km around ${place}` : `${label}: ${km} km radius`,
        remove: (next) => {
          next.delete(`${prefix}Lat`);
          next.delete(`${prefix}Lng`);
          next.delete(`${prefix}RadiusKm`);
          next.delete(`${prefix}Place`);
        },
      });
    };
    radiusChip("dreamJob", "Dream location");
    radiusChip("current", "Location");

    const range = (label: string, minKey: string, maxKey: string, unit = "") => {
      const min = params.get(minKey);
      const max = params.get(maxKey);
      if (!min && !max) return;
      out.push({
        id: `${minKey}-${maxKey}`,
        label: `${label}: ${min || "any"}–${max || "any"}${unit}`,
        remove: (next) => {
          next.delete(minKey);
          next.delete(maxKey);
        },
      });
    };
    range("Salary ₹", "salaryMin", "salaryMax");
    range("Passing year", "passingYearFrom", "passingYearTo");
    range("Experience", "experienceMin", "experienceMax", " yrs");
    range("Age", "ageMin", "ageMax");
    range("Last active", "lastActiveFrom", "lastActiveTo");
    range("Signup", "signupFrom", "signupTo");

    const preset = params.get("lastActive");
    if (preset) {
      out.push({
        id: "lastActive",
        label: `Last active: ${LAST_ACTIVE_OPTIONS.find((o) => o.value === preset)?.label ?? preset}`,
        remove: (next) => next.delete("lastActive"),
      });
    }
    const gender = params.get("gender");
    if (gender) {
      out.push({
        id: "gender",
        label: `Gender: ${labelFor("gender", gender)}`,
        remove: (next) => next.delete("gender"),
      });
    }
    const title = params.get("currentJobTitle");
    if (title) {
      out.push({
        id: "currentJobTitle",
        label: `Current job: ${title}`,
        remove: (next) => next.delete("currentJobTitle"),
      });
    }
    return out;
  }, [params, labelFor]);

  // --- sort / paging ---
  const sort = params.get("sort") ?? DEFAULT_SORT;
  const limit = params.get("limit") ?? DEFAULT_LIMIT;
  const pageParam = parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const setSort = (v: string) =>
    update((next) => (v === DEFAULT_SORT ? next.delete("sort") : next.set("sort", v)));
  const setLimit = (v: string) =>
    update((next) => (v === DEFAULT_LIMIT ? next.delete("limit") : next.set("limit", v)));
  const goToPage = (n: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (n <= 1) next.delete("page");
      else next.set("page", String(n));
      return next;
    });

  const [sheetOpen, setSheetOpen] = useState(false);

  const pagination = result?.pagination;
  const total = pagination?.total ?? 0;
  const pageLimit = pagination?.limit ?? parseInt(limit, 10);
  const totalPages = pagination?.totalPages ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageLimit + 1;
  const to = Math.min(page * pageLimit, total);
  const rows = result?.data ?? null;

  // --- saved filters (shared by every admin) ---
  const [savedList, setSavedList] = useState<SavedFilter[]>([]);
  const [savedError, setSavedError] = useState<string | null>(null);
  const loadSaved = useCallback(() => {
    fitmyskillLeadsApi
      .listSavedFilters()
      .then((list) => {
        setSavedList(list);
        setSavedError(null);
      })
      .catch((e: Error) => setSavedError(e.message));
  }, []);
  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // The applied filters in the URL as an object: lists as arrays, search and sort included,
  // page and limit left out. Saving and exporting both send this.
  const currentFilters = (): Record<string, LeadFilterValue> => {
    const out: Record<string, LeadFilterValue> = {};
    for (const k of [...LEAD_FILTER_KEYS, "sort"]) {
      const v = params.get(k);
      if (!v) continue;
      out[k] = (LEAD_LIST_ARRAY_KEYS as readonly string[]).includes(k) ? splitList(v) : v;
    }
    return out;
  };

  // Replace the current filter params with the saved ones and return to page 1.
  const applySaved = (sf: SavedFilter) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const keys = [...LEAD_FILTER_KEYS, "sort"];
      keys.forEach((k) => next.delete(k));
      RETIRED_LOCATION_KEYS.forEach((k) => next.delete(k));
      for (const [k, v] of Object.entries(sf.filters)) {
        if (!keys.includes(k)) continue;
        const value = Array.isArray(v) ? v.join(",") : String(v);
        if (value) next.set(k, value);
      }
      next.delete("page");
      return next;
    });

  type NameDialog = { mode: "save" } | { mode: "rename"; id: string };
  const [nameDialog, setNameDialog] = useState<NameDialog | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const openNameDialog = (d: NameDialog, initial = "") => {
    setNameDialog(d);
    setNameValue(initial);
    setNameError(null);
  };

  const submitName = async () => {
    if (!nameDialog) return;
    setNameBusy(true);
    setNameError(null);
    try {
      if (nameDialog.mode === "save") {
        await fitmyskillLeadsApi.createSavedFilter(nameValue, currentFilters());
      } else {
        await fitmyskillLeadsApi.renameSavedFilter(nameDialog.id, nameValue);
      }
      setNameDialog(null);
      loadSaved();
    } catch (e) {
      setNameError((e as Error).message || "Could not save");
    } finally {
      setNameBusy(false);
    }
  };

  const removeSaved = async (sf: SavedFilter) => {
    if (!window.confirm(`Delete the saved filter "${sf.name}"?`)) return;
    try {
      await fitmyskillLeadsApi.deleteSavedFilter(sf.id);
      loadSaved();
    } catch (e) {
      setSavedError((e as Error).message || "Could not delete");
    }
  };

  // --- export: post the filters, poll about once a second, then download ---
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const unmounted = useRef(false);
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const exportToExcel = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const jobId = await fitmyskillLeadsApi.startExport(currentFilters());
      for (;;) {
        await new Promise((r) => window.setTimeout(r, 1000));
        if (unmounted.current) return;
        const st = await fitmyskillLeadsApi.getExportStatus(jobId);
        if (st.status === "pending") continue;
        if (st.status === "failed") throw new Error(st.message || "Export failed");
        const blob = await fitmyskillLeadsApi.downloadExport(jobId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fitmyskill-leads.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      setExportError((e as Error).message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const rowIds = rows?.map((r) => r.id) ?? [];
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleRow = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(rowIds) : new Set());

  const applyBulk = async () => {
    if (selected.size === 0 || (!bulkAssign && !bulkStatus)) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await fitmyskillLeadsApi.bulkUpdate({
        candidateIds: [...selected],
        ...(bulkStatus ? { status: bulkStatus as LeadStatus } : {}),
        ...(bulkAssign ? { assignedTo: bulkAssign === NONE ? null : bulkAssign } : {}),
      });
      setSelected(new Set());
      setBulkAssign("");
      setBulkStatus("");
      reload(); // refetch the current list so the badges change
    } catch (e) {
      setBulkError((e as Error).message || "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const panelProps = {
    draft,
    setDraft,
    catalog,
    catalogError,
    onRetryCatalog: () => setCatalogTry((n) => n + 1),
    jobTitleText,
    setJobTitleText,
    onSeen,
    onApply: applyDraft,
    onClear: clearAll,
  };

  return (
    <div className="flex gap-6">
      {/* Desktop filter column */}
      <aside className="hidden w-80 shrink-0 lg:block">
        <Card className="sticky top-4 h-[calc(100vh-6rem)] overflow-hidden">
          <FilterPanel idPrefix="d" {...panelProps} />
        </Card>
      </aside>

      {/* Below lg the same panel lives in a sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="flex w-[22rem] max-w-full flex-col p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <FilterPanel idPrefix="m" {...panelProps} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={nameDialog !== null} onOpenChange={(open) => !open && setNameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nameDialog?.mode === "rename" ? "Rename saved filter" : "Save this filter"}
            </DialogTitle>
            <DialogDescription>
              {nameDialog?.mode === "rename"
                ? "Saved filters are shared with every admin."
                : "Saves the current filters, search and sort. Every admin can use it."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitName();
            }}
          >
            <Input
              autoFocus
              value={nameValue}
              maxLength={80}
              placeholder="Filter name"
              onChange={(e) => setNameValue(e.target.value)}
            />
            {nameError && (
              <div role="alert" className="text-sm text-destructive">
                {nameError}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNameDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={nameBusy}>
                {nameBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LeadDetailDrawer
        candidateId={detailId}
        onClose={() => setDetailId(null)}
        catalog={catalog}
        assignees={assignees}
        ensureAssignees={ensureAssignees}
        onSaved={reload}
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">FitMySkill Data</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => openNameDialog({ mode: "save" })}>
              Save this filter
            </Button>
            <Button variant="outline" size="sm" disabled={exporting} onClick={exportToExcel}>
              {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {exporting ? "Exporting…" : "Export to Excel"}
            </Button>
          </div>
        </div>

        {exportError && (
          <div role="alert" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
            {exportError}
          </div>
        )}

        {(savedList.length > 0 || savedError) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Saved filters</span>
            {savedList.map((sf) => (
              <Badge key={sf.id} variant="outline" className="gap-1 pr-1">
                <button
                  type="button"
                  className="font-normal hover:underline"
                  title={sf.createdByName ? `Saved by ${sf.createdByName}` : undefined}
                  onClick={() => applySaved(sf)}
                >
                  {sf.name}
                </button>
                <button
                  type="button"
                  aria-label={`Rename ${sf.name}`}
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => openNameDialog({ mode: "rename", id: sf.id }, sf.name)}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${sf.name}`}
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => removeSaved(sf)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {savedError && <span className="text-sm text-destructive">{savedError}</span>}
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, or phone"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1">
              {c.label}
              <button
                type="button"
                aria-label={`Remove ${c.label}`}
                onClick={() => update((next) => c.remove(next))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {loading && rows !== null && <Loader2 className="h-4 w-4 animate-spin" />}
            {rows !== null ? `${total} candidate${total === 1 ? "" : "s"}` : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Select value={bulkAssign} onValueChange={setBulkAssign}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name || a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Change status…" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {STATUS_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={bulkBusy || (!bulkAssign && !bulkStatus)} onClick={applyBulk}>
              {bulkBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
            <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
            {bulkError && <span className="text-sm text-destructive">{bulkError}</span>}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        aria-label="Select all rows on this page"
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(c) => toggleAll(c === true)}
                        disabled={rowIds.length === 0}
                      />
                    </TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Dream job</TableHead>
                    <TableHead>Skills have</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows === null && loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : rows?.map((row) => (
                        <LeadTableRow
                          key={row.id}
                          row={row}
                          selected={selected.has(row.id)}
                          onToggle={(c) => toggleRow(row.id, c)}
                          onOpen={() => setDetailId(row.id)}
                        />
                      ))}
                  {rows !== null && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No candidates match these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {total === 0 ? "Showing 0 of 0" : `Showing ${from}–${to} of ${total}`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </Button>
            {totalPages > 0 &&
              pageWindow(page, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={n}
                    size="sm"
                    variant={n === page ? "default" : "outline"}
                    onClick={() => goToPage(n)}
                  >
                    {n}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={totalPages === 0 || page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitMySkillDataPage;
