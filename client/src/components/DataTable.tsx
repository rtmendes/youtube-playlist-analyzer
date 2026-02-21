import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, LayoutList, LayoutGrid } from "lucide-react";

// Helper cells and toggles for use with DataTable or custom tables
export function LinkCell({
  href,
  external,
  children,
}: { href: string; external?: boolean; children: React.ReactNode }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} className="text-primary hover:underline">
      {children}
    </a>
  );
}

export function ThumbnailCell({
  src,
  alt,
  size = "sm",
}: { src: string; alt: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-16 h-9" : "w-24 h-14";
  return (
    <img
      src={src}
      alt={alt}
      className={cn("rounded object-cover bg-muted", dim)}
    />
  );
}

export function NumberCell({ value }: { value: number }) {
  return <span className="tabular-nums">{(value ?? 0).toLocaleString()}</span>;
}

export function DateCell({
  value,
  format = "date",
}: { value: Date | string; format?: "date" | "relative" }) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return <span>Today</span>;
    if (diffDays === 1) return <span>Yesterday</span>;
    if (diffDays < 7) return <span>{diffDays} days ago</span>;
    if (diffDays < 30) return <span>{Math.floor(diffDays / 7)} weeks ago</span>;
    return <span>{d.toLocaleDateString()}</span>;
  }
  return <span>{d.toLocaleDateString()}</span>;
}

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: "list" | "grid";
  onViewChange: (v: "list" | "grid") => void;
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5">
      <Button
        variant={view === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onViewChange("list")}
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onViewChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  copyValue?: (row: T) => string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string);
  className?: string;
  /** If set, show a "Copy" button that copies visible rows as TSV */
  copyable?: boolean;
  maxHeight?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  className,
  copyable = true,
  maxHeight = "min(70vh, 600px)",
}: DataTableProps<T>) {
  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const getKey = (row: T) =>
    typeof keyField === "function" ? keyField(row) : String((row as Record<string, unknown>)[keyField as string]);

  const copyAsTsv = () => {
    const headers = columns.map((c) => c.header).join("\t");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = col.copyValue
            ? col.copyValue(row)
            : col.render
              ? String((col.render(row) ?? "")).replace(/\t|\n/g, " ")
              : String((row as Record<string, unknown>)[col.key] ?? "");
          return val.replace(/\t|\n/g, " ");
        })
        .join("\t")
    );
    const tsv = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden bg-card", className)}>
      {copyable && data.length > 0 && (
        <div className="flex justify-end p-2 border-b border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={copyAsTsv} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy table"}
          </Button>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table ref={tableRef} className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 text-left text-xs font-semibold uppercase tracking-wider border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-foreground whitespace-nowrap"
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, idx) => (
              <tr
                key={getKey(row)}
                className={cn(
                  "hover:bg-muted/40 transition-colors",
                  idx % 2 === 1 && "bg-muted/20"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-foreground align-top"
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
