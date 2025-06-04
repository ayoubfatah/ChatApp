import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import "../body/call-room.css";
import React from "react";

interface PulseButtonProps {
  handleClick: () => void;
  icon: LucideIcon;
  className?: string;
  fill?: string;
  iconClassName?: string;
}

export default function PulseButton({
  handleClick,
  icon: Icon,
  className,
  fill = "white",
  iconClassName,
}: PulseButtonProps) {
  return (
    <div className="flex justify-center items-center relative ">
      <div className="pulse-ring pulse-ring-1" />
      <div className="pulse-ring pulse-ring-2" />
      <Button
        size="icon"
        onClick={handleClick}
        variant="default"
        className={cn(" rounded-full size-[60px] z-[1000]", className)}
      >
        <Icon
          className={cn("size-[25px] text-transparent", iconClassName)}
          fill={fill}
        />
      </Button>
    </div>
  );
}
