// Skills and job titles 4.4 — the Review tab on Management → Skills / Job Titles:
// settle open AI decisions, audit automatic ones, undo a wrong one.
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Ban,
  RefreshCw,
  Search,
  Star,
  Undo2,
  X,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addTaxonomyNeverMerge,
  approveTaxonomyProposal,
  bulkTaxonomyProposals,
  getTaxonomyProposals,
  makeStandardTaxonomyProposal,
  rejectTaxonomyProposal,
  repointTaxonomyProposal,
  searchTaxonomyTargets,
} from "@/api/admin";
import {
  PaginationResponse,
  ProposalStatus,
  SkillKind,
  TaxonomyActionResult,
  TaxonomyProposalItem,
  TaxonomyRowBrief,
  TaxonomyRowType,
} from "@/types/admin";

const STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "auto", label: "Automatic" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const KINDS: SkillKind[] = ["hard", "tool", "soft", "language", "certification"];
const ALL = "__all__";

const ACTION_LABEL: Record<string, string> = {
  alias: "Same as",
  split: "Split into",
  new: "Standard",
  title: "Is a job title",
  skill: "Is a skill",
};

function rowLabel(r: TaxonomyRowBrief) {
  const tag =
    r.origin === "esco"
      ? "ESCO"
      : r.verified === "verified"
        ? "verified"
        : r.canonical
          ? "standard"
          : r.verified === "rejected"
            ? "rejected"
            : "pending";
  return tag;
}

function RowName({ row }: { row: TaxonomyRowBrief }) {
  return (
    <div className="min-w-0">
      <div className="font-medium break-words">{row.name}</div>
      <div className="flex flex-wrap gap-1 mt-1">
        <Badge variant="outline">{rowLabel(row)}</Badge>
        {row.aliasOfName && <Badge variant="secondary">→ {row.aliasOfName}</Badge>}
        {row.splitCount ? <Badge variant="secondary">→ {row.splitCount} rows</Badge> : null}
        {row.kind && row.kind !== "unknown" && <Badge variant="outline">{row.kind}</Badge>}
      </div>
    </div>
  );
}

function Targets({ item }: { item: TaxonomyProposalItem }) {
  if (!item.targets.length) {
    return <span className="text-muted-foreground">{ACTION_LABEL[item.action] ?? item.action}</span>;
  }
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">
        {ACTION_LABEL[item.action] ?? item.action}
        {item.needs === "choice" && item.status === "open" ? " (choose)" : ""}
      </div>
      {item.targets.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-1">
          <span className="break-words">{t.name}</span>
          <Badge variant="outline">{rowLabel(t)}</Badge>
        </div>
      ))}
      {item.score != null && (
        <div className="text-xs text-muted-foreground">cosine {item.score.toFixed(3)}</div>
      )}
    </div>
  );
}

function Reason({ item }: { item: TaxonomyProposalItem }) {
  return (
    <div className="text-sm break-words">
      <div>{item.judge?.reason || item.reason}</div>
      <div className="text-xs text-muted-foreground mt-1">
        {item.promptVersion ?? "rule"}
        {item.seniority ? ` · seniority ${item.seniority}` : ""}
        {` · ${item.references} reference${item.references === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

interface Props {
  type: TaxonomyRowType;
}

export function ReviewQueue({ type }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ProposalStatus>("open");
  const [action, setAction] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginationResponse<TaxonomyProposalItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pick, setPick] = useState<TaxonomyProposalItem | null>(null);
  const [standard, setStandard] = useState<TaxonomyProposalItem | null>(null);
  const [never, setNever] = useState<TaxonomyProposalItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await getTaxonomyProposals({
          type,
          status,
          action: action || undefined,
          filter: filter || undefined,
          q: search || undefined,
          page,
          limit: 20,
        })
      );
      setSelected([]);
    } catch (error) {
      toast({
        title: "Failed to load the review queue",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [type, status, action, filter, search, page, toast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const done = (title: string, res: TaxonomyActionResult) => {
    toast({
      title,
      description: res.warnings?.length ? res.warnings.join(" ") : undefined,
    });
    load();
  };
  const run = async (id: string, title: string, fn: () => Promise<TaxonomyActionResult>) => {
    setBusy(id);
    try {
      done(title, await fn());
    } catch (error) {
      toast({
        title: "Not done",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };
  const bulk = async (what: "approve" | "reject") => {
    setBusy("bulk");
    try {
      const res = await bulkTaxonomyProposals(selected, what);
      const results = res.result ?? [];
      const failed = results.filter((r) => !r.ok);
      toast({
        title: `${results.length - failed.length} of ${results.length} ${what === "approve" ? "approved" : "rejected"}`,
        description: failed.length
          ? `${failed.length} skipped: ${[...new Set(failed.map((f) => f.error))].join("; ")}`
          : res.warnings?.join(" ") || undefined,
        variant: failed.length ? "destructive" : undefined,
      });
      load();
    } catch (error) {
      toast({
        title: "Bulk action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const items = data?.data ?? [];
  const decided = status !== "open";
  const crossType = (i: TaxonomyProposalItem) => i.targetType !== i.type;

  const actions = (item: TaxonomyProposalItem) => (
    <div className="flex flex-wrap gap-2">
      {item.status === "open" && (
        <Button
          size="sm"
          disabled={busy === item.id || item.needs !== "none"}
          title={item.needs === "choice" ? "Choose a target with Pick another" : undefined}
          onClick={() => run(item.id, "Approved", () => approveTaxonomyProposal(item.id))}
        >
          <Check className="h-4 w-4 mr-1" /> Approve
        </Button>
      )}
      {item.status !== "rejected" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy === item.id}
          onClick={() =>
            run(item.id, item.status === "open" ? "Rejected" : "Undone", () =>
              rejectTaxonomyProposal(item.id)
            )
          }
        >
          {item.status === "open" ? (
            <>
              <X className="h-4 w-4 mr-1" /> Reject
            </>
          ) : (
            <>
              <Undo2 className="h-4 w-4 mr-1" /> Undo
            </>
          )}
        </Button>
      )}
      {item.status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => setPick(item)}>
          <Target className="h-4 w-4 mr-1" /> Pick another
        </Button>
      )}
      {!crossType(item) && item.status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => setStandard(item)}>
          <Star className="h-4 w-4 mr-1" /> Make standard
        </Button>
      )}
      {!crossType(item) && item.targets.length > 0 && (
        <Button size="sm" variant="ghost" disabled={busy === item.id} onClick={() => setNever(item)}>
          <Ban className="h-4 w-4 mr-1" /> Never merge
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(v) => { setStatus(v as ProposalStatus); setPage(1); }}>
        <TabsList aria-label="Decision status" className="flex-wrap h-auto">
          {STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type === "skill" ? "skills" : "job titles"}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={action || ALL} onValueChange={(v) => { setAction(v === ALL ? "" : v); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label="Action">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            <SelectItem value="alias">Same as</SelectItem>
            <SelectItem value="split">Split into</SelectItem>
            <SelectItem value="new">Standard</SelectItem>
            <SelectItem value={type === "skill" ? "title" : "skill"}>
              {type === "skill" ? "Is a job title" : "Is a skill"}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter || ALL} onValueChange={(v) => { setFilter(v === ALL ? "" : v); setPage(1); }}>
          <SelectTrigger className="sm:w-52" aria-label="Filter">
            <SelectValue placeholder="Everything" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Everything</SelectItem>
            <SelectItem value="needs-choice">Needs a choice</SelectItem>
            {type === "title" && <SelectItem value="new-occupation">New occupation?</SelectItem>}
            <SelectItem value="esco-labels">From ESCO labels (3.3)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {data ? `${data.pagination.total} ${status}` : "Loading..."}
          {selected.length ? ` · ${selected.length} selected` : ""}
        </span>
        {selected.length > 0 && (
          <>
            {!decided && (
              <Button size="sm" disabled={busy === "bulk"} onClick={() => bulk("approve")}>
                <Check className="h-4 w-4 mr-1" /> Approve selected
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy === "bulk"} onClick={() => bulk("reject")}>
              {decided ? <Undo2 className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
              {decided ? "Undo selected" : "Reject selected"}
            </Button>
          </>
        )}
      </div>

      {/* Phone: cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={(c) =>
                  setSelected(c ? [...selected, item.id] : selected.filter((x) => x !== item.id))
                }
                aria-label={`Select ${item.row.name}`}
              />
              <RowName row={item.row} />
            </div>
            <Targets item={item} />
            <Reason item={item} />
            {actions(item)}
          </div>
        ))}
        {!loading && !items.length && <p className="text-muted-foreground">Nothing here.</p>}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={items.length > 0 && selected.length === items.length}
                  onCheckedChange={(c) => setSelected(c ? items.map((i) => i.id) : [])}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{type === "skill" ? "Skill" : "Job title"}</TableHead>
              <TableHead>Proposed</TableHead>
              <TableHead>Why</TableHead>
              <TableHead className="w-[22rem]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="align-top">
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...selected, item.id] : selected.filter((x) => x !== item.id))
                    }
                    aria-label={`Select ${item.row.name}`}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <RowName row={item.row} />
                </TableCell>
                <TableCell className="align-top">
                  <Targets item={item} />
                </TableCell>
                <TableCell className="align-top max-w-sm">
                  <Reason item={item} />
                </TableCell>
                <TableCell className="align-top">{actions(item)}</TableCell>
              </TableRow>
            ))}
            {!loading && !items.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nothing here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <PickDialog
        item={pick}
        onClose={() => setPick(null)}
        onPick={(item, ids) =>
          run(item.id, "Repointed", () => repointTaxonomyProposal(item.id, ids)).then(() => setPick(null))
        }
      />
      <StandardDialog
        item={standard}
        onClose={() => setStandard(null)}
        onConfirm={(item, kind) =>
          run(item.id, "Made standard", () => makeStandardTaxonomyProposal(item.id, kind)).then(() =>
            setStandard(null)
          )
        }
      />
      <NeverMergeDialog
        item={never}
        onClose={() => setNever(null)}
        onConfirm={(item, otherId) =>
          run(item.id, "Never merge saved", () => addTaxonomyNeverMerge(item.type, item.row.id, otherId)).then(
            () => setNever(null)
          )
        }
      />
    </div>
  );
}

function PickDialog({
  item,
  onClose,
  onPick,
}: {
  item: TaxonomyProposalItem | null;
  onClose: () => void;
  onPick: (item: TaxonomyProposalItem, ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<TaxonomyRowBrief[]>([]);
  const [chosen, setChosen] = useState<TaxonomyRowBrief[]>([]);
  useEffect(() => {
    setQ("");
    setFound([]);
    setChosen(item?.targets.filter((t) => t.origin === "esco" || t.verified === "verified" || t.canonical) ?? []);
  }, [item]);
  useEffect(() => {
    if (!item || q.trim().length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      searchTaxonomyTargets(item.targetType, q, { signal: ctl.signal })
        .then(setFound)
        .catch(() => undefined);
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, item]);
  const toggle = (r: TaxonomyRowBrief) =>
    setChosen(chosen.some((c) => c.id === r.id) ? chosen.filter((c) => c.id !== r.id) : [...chosen, r]);
  const options = [...(item?.targets ?? []), ...found].filter(
    (r, i, all) => all.findIndex((x) => x.id === r.id) === i && r.id !== item?.row.id
  );
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick another for “{item?.row.name}”</DialogTitle>
          <DialogDescription>
            One choice makes it the same as that {item?.targetType === "skill" ? "skill" : "occupation"}; two or more
            split it. Only standard rows are offered.
          </DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Search standard rows..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {options.map((r) => (
            <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent cursor-pointer">
              <Checkbox checked={chosen.some((c) => c.id === r.id)} onCheckedChange={() => toggle(r)} />
              <span className="flex-1 break-words">{r.name}</span>
              <Badge variant="outline">{rowLabel(r)}</Badge>
            </label>
          ))}
          {!options.length && <p className="text-sm text-muted-foreground px-2">Type at least 2 letters.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!chosen.length || !item} onClick={() => item && onPick(item, chosen.map((c) => c.id))}>
            {chosen.length > 1 ? `Split into ${chosen.length}` : "Use this"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StandardDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: TaxonomyProposalItem | null;
  onClose: () => void;
  onConfirm: (item: TaxonomyProposalItem, kind?: SkillKind) => void;
}) {
  const [kind, setKind] = useState<SkillKind | "">("");
  useEffect(() => {
    const k = item?.row.kind;
    setKind(k && k !== "unknown" ? (k as SkillKind) : "");
  }, [item]);
  const skill = item?.type === "skill";
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make “{item?.row.name}” standard</DialogTitle>
          <DialogDescription>
            It becomes its own standard {skill ? "skill" : "occupation"}
            {item?.status === "auto" || item?.status === "approved" ? "; the current link is undone first" : ""}.
          </DialogDescription>
        </DialogHeader>
        {skill && (
          <Select value={kind || undefined} onValueChange={(v) => setKind(v as SkillKind)}>
            <SelectTrigger aria-label="Kind">
              <SelectValue placeholder="Choose a kind" />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!item || (skill && !kind)} onClick={() => item && onConfirm(item, kind || undefined)}>
            Make standard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NeverMergeDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: TaxonomyProposalItem | null;
  onClose: () => void;
  onConfirm: (item: TaxonomyProposalItem, otherId: string) => void;
}) {
  const [other, setOther] = useState("");
  useEffect(() => setOther(item?.targets[0]?.id ?? ""), [item]);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Never merge “{item?.row.name}”</DialogTitle>
          <DialogDescription>
            Later runs will never make these two the same. If they are merged now, that is undone.
          </DialogDescription>
        </DialogHeader>
        <Select value={other || undefined} onValueChange={setOther}>
          <SelectTrigger aria-label="With">
            <SelectValue placeholder="With..." />
          </SelectTrigger>
          <SelectContent>
            {(item?.targets ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!item || !other} onClick={() => item && onConfirm(item, other)}>
            Never merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReviewQueue;
