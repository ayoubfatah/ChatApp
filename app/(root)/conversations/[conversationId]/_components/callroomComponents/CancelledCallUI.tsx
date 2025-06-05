"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import PulseButton from "./pulseButton";
import { Dispatch, SetStateAction } from "react";

type CanceledCallUIProps = {
  receiverName: string;
  receiverImg?: string;
  endCall: (id: string) => void;
  ongoingCall: any;
  setCallType: Dispatch<SetStateAction<"audio" | "video" | null>>;
};

export default function CanceledCallUI({
  receiverName,
  receiverImg = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKggN5o0di2XQXBIO8M7oHrE_qIXo27PwzWw&s",
  endCall,
  setCallType,
  ongoingCall,
}: CanceledCallUIProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center  bg-gradient-to-br from-slate-700 to-slate-800 ">
      {/* Customize connecting UI here - you can add ringing sounds */}
      <div className="relative">
        <Avatar className="size-[150px] z-[1000]">
          <AvatarImage src={receiverImg} />
        </Avatar>
      </div>
      <div className="my-4">
        <div className="flex flex-col items-center gap-1 mt-4">
          <h1 className="text-[34px] font-bold">{receiverName}</h1>
          <h1>Busy</h1>
        </div>
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
      </div>
    </div>
  );
}
