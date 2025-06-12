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
import { Edit, Reply, Copy, Trash2, EllipsisVertical } from "lucide-react";
import { copyToClipboard } from "@/utils/utils";
import { api } from "@/convex/_generated/api";
import useMutationState from "@/hooks/useMutationState";
import { toast } from "sonner";
import { useCallback, useState } from "react";
import { ImagePreview } from "./ImagePreview";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./FilePreview";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <DropdownMenu onOpenChange={setIsMenuOpen}>
      <div
        id={`message-${messageId}`}
        className={cn(
          "flex w-fit max-w-[80%] gap-2 group relative transition-colors duration-200",
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
        <div className="flex flex-col gap-1">
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
                Replying to:{" "}
                {replyTo.content[0].startsWith("http")
                  ? "attachment"
                  : replyTo.content[0]}
              </div>
            )}
            <div className="flex flex-col relative">
              <div className={cn("flex items-center gap-2")}>
                {fromCurrentUser && (
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "border-none !bg-transparent p-1 transition-opacity duration-200",
                        isMenuOpen
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                )}
                {type === "text" && (
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
                    <div className="flex items-center justify-between">
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
                  </div>
                )}
                {type === "imageUploader" && (
                  <div className="message-box">
                    <ImagePreview urls={content} />
                    <div className="flex items-center justify-between mt-2">
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
                  </div>
                )}
                {type === "file" && (
                  <div className="message-box">
                    <FilePreview url={content[0]} />
                    <div className="flex items-center justify-between mt-2">
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
                  </div>
                )}
                {type === "audio" && (
                  <div className="message-box">
                    <audio controls className="max-w-xs">
                      <source src={content[0]} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="flex items-center justify-between mt-2">
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
                  </div>
                )}

                {!fromCurrentUser && (
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "border-none !bg-transparent p-1 transition-opacity duration-200",
                        isMenuOpen
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                )}
              </div>
            </div>
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
            {type === "text" && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
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
