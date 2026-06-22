"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardFilters, FilterOptions } from "@/lib/types";

const ALL = "all";

export function FilterBar({
  filters,
  options,
  onChange,
  onReset,
}: {
  filters: DashboardFilters;
  options: FilterOptions;
  onChange: (next: Partial<DashboardFilters>) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          min={options.dateRange.min || undefined}
          max={options.dateRange.max || undefined}
          onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          min={options.dateRange.min || undefined}
          max={options.dateRange.max || undefined}
          onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
        />
      </div>

      <FilterSelect
        label="Project"
        value={filters.project}
        options={options.projects}
        onChange={(v) => onChange({ project: v })}
      />
      <FilterSelect
        label="Assigned staff"
        value={filters.staff}
        options={options.staff}
        onChange={(v) => onChange({ staff: v })}
      />
      <FilterSelect
        label="Source"
        value={filters.source}
        options={options.sources}
        onChange={(v) => onChange({ source: v })}
      />
      <FilterSelect
        label="Lead stage"
        value={filters.stage}
        options={options.stages}
        onChange={(v) => onChange({ stage: v })}
      />
      <FilterSelect
        label="Task status"
        value={filters.taskStatus}
        options={options.taskStatuses}
        onChange={(v) => onChange({ taskStatus: v })}
      />

      <div className="flex items-end sm:col-span-2 lg:col-span-4 xl:col-span-7">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Reset filters
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
