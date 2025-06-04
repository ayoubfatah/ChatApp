import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import "../body/call-room.css";

interface ControlButtonProps {
  handleClick: () => void;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: "default" | "large";
  isActive?: boolean;
  activeIcon?: LucideIcon;
}

export default function ControlButton({
  handleClick,
  icon: Icon,
  activeIcon: ActiveIcon,
  className,
  iconClassName,
  size = "default",
  isActive = true,
}: ControlButtonProps) {
  return (
    <div className="relative" onClick={handleClick}>
      {!isActive && <div className="pulse-ring pulse-ring-2" />}
      <button
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
          size === "large" && "w-20",
          className
        )}
      >
        {ActiveIcon && isActive ? (
          <ActiveIcon className={cn("h-6 w-6", iconClassName)} />
        ) : (
          <Icon className={cn("h-6 w-6", iconClassName)} />
        )}
      </button>
    </div>
  );
}
