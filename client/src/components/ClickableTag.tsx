import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ClickableTagProps {
  tag: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  isActive?: boolean;
  onRemove?: () => void;
  className?: string;
  navigateTo?: string; // Custom navigation path, defaults to /videos?tag=
}

export function ClickableTag({
  tag,
  variant = "secondary",
  size = "default",
  isActive = false,
  onRemove,
  className,
  navigateTo,
}: ClickableTagProps) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetPath = navigateTo || `/videos?tag=${encodeURIComponent(tag)}`;
    setLocation(targetPath);
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge
      variant={isActive ? "default" : variant}
      className={cn(
        "cursor-pointer transition-all hover:scale-105",
        isActive && "ring-2 ring-primary ring-offset-1",
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
    >
      <span className="truncate max-w-[100px]">{tag}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-background/20 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

// Tag group component for displaying multiple tags
interface TagGroupProps {
  tags: string[];
  activeTag?: string;
  maxVisible?: number;
  size?: "sm" | "default" | "lg";
  navigateBase?: string;
  className?: string;
}

export function TagGroup({
  tags,
  activeTag,
  maxVisible = 5,
  size = "sm",
  navigateBase,
  className,
}: TagGroupProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag) => (
        <ClickableTag
          key={tag}
          tag={tag}
          size={size}
          isActive={activeTag === tag}
          navigateTo={navigateBase ? `${navigateBase}?tag=${encodeURIComponent(tag)}` : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}

// Category badge with color coding
interface CategoryBadgeProps {
  category: string;
  onClick?: () => void;
  isActive?: boolean;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  story: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/30" },
  testimonial: { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-400", border: "border-green-500/30" },
  product_request: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/30" },
  pain_point: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-500/30" },
  humor: { bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-500/30" },
  question: { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-500/30" },
  default: { bg: "bg-gray-500/10", text: "text-gray-700 dark:text-gray-400", border: "border-gray-500/30" },
};

const categoryLabels: Record<string, string> = {
  story: "Personal Story",
  testimonial: "Testimonial",
  product_request: "Product Request",
  pain_point: "Pain Point",
  humor: "Humor",
  question: "Question",
};

export function CategoryBadge({ category, onClick, isActive }: CategoryBadgeProps) {
  const colors = categoryColors[category] || categoryColors.default;
  const label = categoryLabels[category] || category.replace("_", " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-all hover:scale-105 border",
        colors.bg,
        colors.text,
        colors.border,
        isActive && "ring-2 ring-offset-1"
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}
