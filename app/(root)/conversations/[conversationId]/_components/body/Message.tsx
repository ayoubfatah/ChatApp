import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";
import { Edit, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MessageContent = {
  message: {
    _id: string;
    senderId: string;
  };
};

type Message = {
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  type: string;
  isLastMessage: boolean;
  messageId: string;
  messages: MessageContent[];
  currentUserId: string;
};

export default function Message({
  content,
  createdAt,
  fromCurrentUser,
  lastByUser,
  senderImage,
  senderName,
  type,
  isLastMessage,
  messageId,
  messages,
  currentUserId,
}: Message) {
  const isLastMessageByUser = (
    messageId: string,
    messages: MessageContent[],
    currentUserId: string
  ) =>
    messages?.find((m) => m.message.senderId === currentUserId)?.message._id ===
    messageId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex w-fit max-w-[80%] gap-2 cursor-context-menu",
            fromCurrentUser && "self-end"
          )}
        >
          {!fromCurrentUser && (
            <div className="flex flex-col gap-1 translate-y-[-15px]">
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
              "flex flex-col",
              fromCurrentUser ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "rounded-lg px-4 py-2",
                fromCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
                type === "text" && "text-wrap break-words whitespace-pre-wrap",
                lastByUser && !fromCurrentUser && "rounded-tl-none",
                isLastMessage && fromCurrentUser && "rounded-br-none"
              )}
            >
              {content.map((text, i) => (
                <p className="" key={i}>
                  {text}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {isLastMessageByUser(messageId, messages, currentUserId) && (
                <p className="text-[9px] text-muted-foreground">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={fromCurrentUser ? "start" : "end"}
        className="w-40"
      >
        {fromCurrentUser && (
          <DropdownMenuItem>
            <Edit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <Reply className="size-4 mr-2" />
          Reply
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
