import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMessageStore } from "@/store/useMessageStore";
import { formatDistanceToNow } from "date-fns";
import { Edit, Reply } from "lucide-react";

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
  isEdited: boolean;
  replyTo?: { messageId: string; content: string[] };
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
  isEdited,
  replyTo,
}: Message) {
  const { setEditMessage, setIsEditingMessage, setReplyTo, setIsReplying } =
    useMessageStore();

  const handleEdit = () => {
    setEditMessage(messageId);
    setIsEditingMessage(true);
  };

  const handleReply = () => {
    setReplyTo({ messageId, content });
    setIsReplying(true);
  };

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
            {replyTo && replyTo.content && replyTo.content.length > 0 && (
              <div className="text-[10px] text-muted-foreground mb-1">
                Replying to: {replyTo.content[0]}
              </div>
            )}
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
                <div key={i}>
                  <p className="">{text}</p>
                </div>
              ))}
              <p
                className={cn(
                  "text-[9px]",
                  fromCurrentUser
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {formatDistanceToNow(createdAt, {
                  addSuffix: true,
                })}
              </p>
            </div>
            {!fromCurrentUser && isEdited && (
              <span className="text-[9px] text-muted-foreground ml-1">
                (edited)
              </span>
            )}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={fromCurrentUser ? "start" : "end"}
        className="w-40"
        side={fromCurrentUser ? "left" : "right"}
      >
        {fromCurrentUser && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleReply}>
          <Reply className="size-4 mr-2" />
          Reply
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
