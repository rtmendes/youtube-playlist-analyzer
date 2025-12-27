import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const [location] = useLocation();

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/", icon: <Home className="h-4 w-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isActive = item.href === location;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              {item.href && !isLast ? (
                <Link href={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1",
                    isLast
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook to build breadcrumbs from current route
export function useBreadcrumbs(): BreadcrumbItem[] {
  const [location] = useLocation();
  const segments = location.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [];
  let path = "";

  const routeLabels: Record<string, string> = {
    videos: "All Videos",
    channels: "All Channels",
    comments: "All Comments",
    intelligence: "Intelligence",
    canvas: "Canvas",
    history: "History",
    projects: "Projects",
    "bulk-analyze": "Analysis",
    analyze: "Analyze",
    video: "Video",
    channel: "Channel",
    help: "Help",
    trash: "Trash",
  };

  segments.forEach((segment, index) => {
    path += `/${segment}`;
    
    // Skip query parameters in breadcrumb labels
    const cleanSegment = segment.split("?")[0];
    
    // Check if this is a dynamic segment (like an ID)
    const isDynamic = !routeLabels[cleanSegment] && index > 0;
    
    if (isDynamic) {
      // For dynamic segments, use a more descriptive label if possible
      const parentSegment = segments[index - 1];
      if (parentSegment === "channel") {
        breadcrumbs.push({ label: "Channel Details", href: path });
      } else if (parentSegment === "video") {
        breadcrumbs.push({ label: "Video Details", href: path });
      } else if (parentSegment === "help") {
        const helpLabels: Record<string, string> = {
          "getting-started": "Getting Started",
          analyze: "Analyze Playlists",
          intelligence: "Comment Intelligence",
          canvas: "Marketing Canvas",
          projects: "Projects & Folders",
          export: "Export & Reports",
          tips: "Tips & Best Practices",
        };
        breadcrumbs.push({ label: helpLabels[cleanSegment] || cleanSegment });
      } else {
        breadcrumbs.push({ label: cleanSegment, href: path });
      }
    } else {
      breadcrumbs.push({
        label: routeLabels[cleanSegment] || cleanSegment,
        href: index < segments.length - 1 ? path : undefined,
      });
    }
  });

  return breadcrumbs;
}

// Page header with breadcrumb
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  const autoBreadcrumbs = useBreadcrumbs();
  const items = breadcrumbs || autoBreadcrumbs;

  return (
    <div className={cn("space-y-4", className)}>
      {items.length > 0 && (
        <Breadcrumb items={items} />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
