import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
}

export function ThemeToggle({ className, showLabel = false, size = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  const isDark = theme === "dark";

  const buttonSizes = {
    sm: "h-8 w-8",
    default: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-5 w-5",
  };

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn(
          "w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground",
          className
        )}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            buttonSizes[size],
            "rounded-md text-muted-foreground hover:text-foreground hover:bg-muted",
            className
          )}
        >
          {isDark ? (
            <Sun className={iconSizes[size]} />
          ) : (
            <Moon className={iconSizes[size]} />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
