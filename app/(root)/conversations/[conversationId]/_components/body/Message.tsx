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
import { Edit, Reply, Copy, Trash2 } from "lucide-react";
import { copyToClipboard } from "@/utils/utils";
import { api } from "@/convex/_generated/api";
import useMutationState from "@/hooks/useMutationState";
import { toast } from "sonner";
import { useCallback } from "react";

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
  seen?: React.ReactNode;
  isGroup: boolean;
  isSystemMessage?: boolean;
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
  seen,
  isGroup,
  isEdited,
  replyTo,
  isSystemMessage,
}: Message) {
  const { setEditMessage, setIsEditingMessage, setReplyTo, setIsReplying } =
    useMessageStore();

  const { mutate: deleteMessage, isPending: isDeleting } = useMutationState(
    api.message.remove
  );

  const handleEdit = () => {
    setEditMessage(messageId);
    setIsEditingMessage(true);
  };

  const handleReply = () => {
    setReplyTo({ messageId, content });
    setIsReplying(true);
  };

  const handleCopy = () => {
    copyToClipboard(content[0]);
  };

  const handleDelete = async () => {
    try {
      await deleteMessage({ messageId });
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleReplyClick = useCallback(() => {
    if (replyTo?.messageId) {
      const originalMessage = document.getElementById(
        `message-${replyTo.messageId}`
      );
      if (originalMessage) {
        originalMessage.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight effect
        const messageBox = originalMessage.querySelector(".message-box");
        if (messageBox) {
          messageBox.classList.add("message-highlight");
          const timeoutId = setTimeout(() => {
            messageBox.classList.remove("message-highlight");
          }, 1000);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [replyTo?.messageId]);

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-muted/50 px-4 py-1 rounded-full text-xs text-muted-foreground">
          {content[0]}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <p className=" bg-[#e1e4e6]"></p>{" "}
      <div
        id={`message-${messageId}`}
        className={cn(
          "flex w-fit max-w-[80%] gap-2 cursor-context-menu transition-colors duration-200",
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
        <div className="flex flex-col gap-1 ">
          <div
            className={cn(
              "flex flex-col",
              fromCurrentUser ? "items-end" : "items-start"
            )}
          >
            {replyTo && replyTo.content && replyTo.content.length > 0 && (
              <div
                onClick={() => {
                  handleReplyClick();
                }}
                className="text-[10px] text-muted-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
              >
                Replying to: {replyTo.content[0]}
              </div>
            )}{" "}
            <DropdownMenuTrigger
              className="transition-colors duration-300"
              asChild
            >
              <div
                className={cn(
                  "message-box transition-colors duration-300 rounded-lg px-4 py-2",
                  fromCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  type === "text" &&
                    "text-wrap break-words whitespace-pre-wrap break-all",
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
                    "text-[9px] flex items-center gap-2",
                    fromCurrentUser
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(createdAt, {
                    addSuffix: true,
                  })}
                  {!isGroup && seen}
                </p>
              </div>
            </DropdownMenuTrigger>
            {!fromCurrentUser && isEdited && (
              <span className="text-[9px] text-muted-foreground ml-1">
                (edited)
              </span>
            )}
          </div>
        </div>
      </div>
      <DropdownMenuContent
        align={fromCurrentUser ? "start" : "end"}
        className="w-40"
        side={fromCurrentUser ? "left" : "right"}
      >
        {fromCurrentUser && (
          <>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className=""
              disabled={isDeleting}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={handleReply}>
          <Reply className="size-4 mr-2" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="size-4 mr-2" />
          Copy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
