import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  showPagination?: boolean;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  compact?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  pageSize = 50,
  showPagination = true,
  emptyMessage = "No data available",
  className,
  stickyHeader = true,
  compact = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getValue = (row: T, accessor: keyof T | ((row: T) => any)) => {
    if (typeof accessor === "function") {
      return accessor(row);
    }
    return row[accessor];
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((c) => c.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = getValue(a, column.accessor);
      const bVal = getValue(b, column.accessor);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column?.sortable) return;

    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = new Set(paginatedData.map((row) => row[keyField]));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(row[keyField]));
  const someSelected =
    paginatedData.some((row) => selectedIds.has(row[keyField])) && !allSelected;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-background")}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {selectable && (
                  <TableHead className="w-[40px] px-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "font-semibold text-xs uppercase tracking-wider",
                      column.sortable && "cursor-pointer select-none hover:bg-muted/80",
                      compact ? "py-2 px-3" : "py-3 px-4",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    onClick={() => handleSort(column.id)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      {column.header}
                      {column.sortable && (
                        <span className="ml-1">
                          {sortColumn === column.id ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const rowId = row[keyField];
                  const isSelected = selectedIds.has(rowId);

                  return (
                    <TableRow
                      key={rowId}
                      className={cn(
                        "transition-colors",
                        isSelected && "bg-primary/5",
                        onRowClick && "cursor-pointer hover:bg-muted/50"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell
                          className="px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectRow(rowId, checked as boolean)
                            }
                            aria-label={`Select row ${rowId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = getValue(row, column.accessor);
                        return (
                          <TableCell
                            key={column.id}
                            className={cn(
                              compact ? "py-2 px-3" : "py-3 px-4",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right"
                            )}
                          >
                            {column.render ? column.render(value, row) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// View toggle component
interface ViewToggleProps {
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border rounded-lg p-1 bg-muted/30">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewChange("list")}
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Helper components for common cell types
export function ThumbnailCell({
  src,
  alt,
  size = "sm",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-16 h-9",
    md: "w-24 h-14",
    lg: "w-32 h-18",
  };

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded object-cover",
        sizeClasses[size]
      )}
    />
  );
}

export function NumberCell({
  value,
  format = "compact",
}: {
  value: number;
  format?: "compact" | "full";
}) {
  const formatted =
    format === "compact"
      ? new Intl.NumberFormat("en", { notation: "compact" }).format(value)
      : new Intl.NumberFormat("en").format(value);

  return <span className="font-mono text-sm">{formatted}</span>;
}

export function DateCell({
  value,
  format = "short",
}: {
  value: string | Date;
  format?: "short" | "long" | "relative";
}) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (format === "relative") {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return <span>Today</span>;
    if (days === 1) return <span>Yesterday</span>;
    if (days < 7) return <span>{days} days ago</span>;
    if (days < 30) return <span>{Math.floor(days / 7)} weeks ago</span>;
    if (days < 365) return <span>{Math.floor(days / 30)} months ago</span>;
    return <span>{Math.floor(days / 365)} years ago</span>;
  }

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" };

  return <span className="text-sm">{date.toLocaleDateString("en-US", options)}</span>;
}

export function LinkCell({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-primary hover:underline flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {external && <ExternalLink className="h-3 w-3" />}
    </a>
  );
}

export function TagsCell({
  tags,
  max = 3,
  onClick,
}: {
  tags: string[];
  max?: number;
  onClick?: (tag: string) => void;
}) {
  const visible = tags.slice(0, max);
  const hidden = tags.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            "text-xs",
            onClick && "cursor-pointer hover:bg-secondary/80"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(tag);
          }}
        >
          {tag}
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hidden}
        </Badge>
      )}
    </div>
  );
}
