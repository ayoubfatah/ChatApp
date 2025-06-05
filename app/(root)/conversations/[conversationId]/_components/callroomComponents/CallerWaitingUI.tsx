"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import PulseButton from "./pulseButton";

type CallerWaitingUIProps = {
  callerName: string;
  callerAvatar?: string;
  onEndCall: () => void;
};

export default function CallerWaitingUI({
  callerName,
  callerAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKggN5o0di2XQXBIO8M7oHrE_qIXo27PwzWw&s",
  onEndCall,
}: CallerWaitingUIProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
      <div className="relative">
        <div className="pulse-ring pulse-ring-1" />
        <div className="pulse-ring pulse-ring-2" />
        <Avatar className="size-[150px] z-[1000]">
          <AvatarImage src={callerAvatar} />
        </Avatar>
      </div>
      <div className="my-4">
        <span className="flex items-center gap-1 mt-4">
          Waiting for {callerName} to answer
          <span className="dots-animation">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </span>
      </div>
      <div className="flex items-center gap-12 mt-6">
        <PulseButton
          icon={X}
          handleClick={onEndCall}
          className="bg-red-500 hover:bg-red-600"
          iconClassName="text-white"
          fill="white"
        />
      </div>
    </div>
  );
}
