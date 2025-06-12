"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Phone, X } from "lucide-react";
import PulseButton from "./pulseButton";
import { Dispatch, SetStateAction } from "react";

type ReceiverWaitingUIProps = {
  callerName: string;
  callerAvatar?: string;
  onEndCall: () => void;
  ongoingCall: any;
  endCall: (id: string) => void;
  answerCall: (id: string) => void;
  setCallType: Dispatch<SetStateAction<"video" | "audio" | null>>;
};

export default function ReceiverWaitingUI({
  callerName,
  callerAvatar = "",
  endCall,
  answerCall,
  ongoingCall,
  setCallType,
}: ReceiverWaitingUIProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center  bg-gradient-to-br from-slate-700 to-slate-800 ">
      {/* Customize connecting UI here - you can add ringing sounds */}
      <div className="relative">
        <div className="pulse-ring pulse-ring-1" />
        <div className="pulse-ring pulse-ring-2" />
        <Avatar className="size-[150px] z-[1000]">
          <AvatarImage src={callerAvatar} />
        </Avatar>
      </div>
      <div className="my-4">
        <span className="flex items-center gap-1 mt-4">
          {callerName} calling
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
          handleClick={() => {
            if (ongoingCall) {
              endCall(ongoingCall._id);
            }
            setCallType(null);
          }}
          className=" bg-red-500 hover:bg-red-600"
          iconClassName="text-white"
          fill="white"
        />

        <PulseButton
          icon={Phone}
          handleClick={() => {
            if (ongoingCall) {
              answerCall(ongoingCall._id);
            }
          }}
          className="bg-green-500 hover:bg-green-600"
          fill="white"
        />
      </div>
    </div>
  );
}
