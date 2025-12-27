import { useState, useCallback, useRef } from "react";

interface UseMultiSelectOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

interface UseMultiSelectReturn<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  isSelected: (id: string) => boolean;
  toggle: (id: string, event?: React.MouseEvent) => void;
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (fromId: string, toId: string) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  selectedCount: number;
  handleClick: (id: string, event: React.MouseEvent) => void;
}

export function useMultiSelect<T>({
  items,
  getItemId,
}: UseMultiSelectOptions<T>): UseMultiSelectReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedRef = useRef<string | null>(null);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string, event?: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    lastSelectedRef.current = id;
  }, []);

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    lastSelectedRef.current = id;
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)));
  }, [items, getItemId]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, []);

  const selectRange = useCallback(
    (fromId: string, toId: string) => {
      const ids = items.map(getItemId);
      const fromIndex = ids.indexOf(fromId);
      const toIndex = ids.indexOf(toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(ids[i]);
        }
        return next;
      });
    },
    [items, getItemId]
  );

  // Handle click with shift/ctrl/cmd modifiers
  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.preventDefault();

      // Shift+click for range selection
      if (event.shiftKey && lastSelectedRef.current) {
        selectRange(lastSelectedRef.current, id);
        return;
      }

      // Ctrl/Cmd+click for toggle
      if (event.ctrlKey || event.metaKey) {
        toggle(id);
        return;
      }

      // Regular click - select only this item
      setSelectedIds(new Set([id]));
      lastSelectedRef.current = id;
    },
    [selectRange, toggle]
  );

  const selectedItems = items.filter((item) => selectedIds.has(getItemId(item)));
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;
  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    selectRange,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    handleClick,
  };
}
