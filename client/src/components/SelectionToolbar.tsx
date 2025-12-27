import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Tag,
  Folder,
  Trash2,
  Star,
  Archive,
  MoreHorizontal,
  Download,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onTag?: () => void;
  onMoveToFolder?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onTag,
  onMoveToFolder,
  onDelete,
  onFavorite,
  onArchive,
  onExport,
  onDuplicate,
  customActions,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-3 border-r">
            <Badge variant="secondary" className="font-mono">
              {selectedCount}
            </Badge>
            <span className="text-sm text-muted-foreground">selected</span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            {onTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTag}
                className="gap-1.5"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            )}

            {onMoveToFolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveToFolder}
                className="gap-1.5"
              >
                <Folder className="h-4 w-4" />
                <span className="hidden sm:inline">Move</span>
              </Button>
            )}

            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFavorite}
                className="gap-1.5"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Favorite</span>
              </Button>
            )}

            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {customActions?.map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear selection */}
          <div className="pl-2 border-l">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
