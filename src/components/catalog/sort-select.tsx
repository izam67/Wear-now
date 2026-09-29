"use client";

import type { SortKey } from "@/lib/types";

/**
 * Sort control. Plain navigation rather than a router call so the URL stays the
 * single source of truth; the <select> just points at the prebuilt hrefs.
 */
export function SortSelect({
  options,
  active,
}: {
  options: { value: SortKey; label: string; href: string }[];
  active: SortKey;
}) {
  const activeHref = options.find((o) => o.value === active)?.href ?? options[0]?.href;

  return (
    <label className="flex items-center gap-2 text-[0.8125rem] text-stone">
      <span className="hidden sm:inline">Sort by</span>
      <select
        aria-label="Sort products"
        value={activeHref}
        onChange={(e) => {
          const href = e.target.selectedOptions[0]?.value;
          if (href) window.location.assign(href);
        }}
        className="h-10 cursor-pointer appearance-none rounded-[10px] border border-line bg-paper bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20fill=%22none%22%20stroke=%22%23706f6c%22%20stroke-width=%221.5%22%3E%3Cpath%20d=%22M2.5%204.5%206%208l3.5-3.5%22/%3E%3C/svg%3E')] bg-[position:right_0.8rem_center] bg-no-repeat pr-9 pl-3.5 text-[0.8125rem] text-ink outline-none transition-colors focus:border-ink/45"
      >
        {options.map((o) => (
          <option key={o.value} value={o.href}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}