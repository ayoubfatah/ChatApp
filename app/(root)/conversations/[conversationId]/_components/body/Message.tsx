import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";

type Message = {
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  type: string;
};
export default function Message({
  content,
  createdAt,
  fromCurrentUser,
  lastByUser,
  senderImage,
  senderName,
  type,
}: Message) {
  console.log(content);
  console.log(lastByUser, "usss");
  return (
    <div
      className={cn(
        "flex w-fit max-w-[80%] gap-2",
        fromCurrentUser && "ml-auto"
      )}
    >
      {!fromCurrentUser && (
        <div className="flex flex-col gap-1">
          {lastByUser && (
            <Avatar>
              <AvatarImage src={senderImage} alt={senderName} />
              <AvatarFallback>{senderName[0]}</AvatarFallback>
            </Avatar>
          )}
          {!lastByUser && <div className="size-8" />}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-1",
          fromCurrentUser ? "items-end" : "items-start"
        )}
      >
        {!fromCurrentUser && lastByUser && (
          <p className="text-sm text-muted-foreground">{senderName}</p>
        )}
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            fromCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
            type === "text" && "text-wrap break-words whitespace-pre-wrap"
          )}
        >
          {content.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
