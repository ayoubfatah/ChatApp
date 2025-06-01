"use client";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useConversation from "@/hooks/useConversation";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useMutation, useQuery } from "convex/react";
import { CheckCheck } from "lucide-react";
import { Dispatch, SetStateAction, useEffect } from "react";
import CallRoom from "./CallRoom";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";

type BodyProps = {
  members: {
    lastSeenMessageId?: Id<"messages">;
    username?: string;
    [key: string]: any;
  }[];
  isGroup?: boolean;
  setCallType: Dispatch<SetStateAction<"audio" | "video" | null>>;
  callType: "audio" | "video" | null;
};

export default function Body({
  callType,
  setCallType,
  members,
  isGroup,
}: BodyProps) {
  const { conversationId } = useConversation();
  const messages = useQuery(api.messages.get, {
    conversationId: conversationId as Id<"conversations">,
  });
  const markRead = useMutation(api.conversation.markRead);
  const typingUsers = useQuery(api.conversation.getTypingStatus, {
    conversationId: conversationId as Id<"conversations">,
  });

  useEffect(() => {
    if (messages && messages.length > 0)
      markRead({
        messageId: messages[0].message._id,
        id: conversationId as Id<"conversations">,
      });
  }, [conversationId, markRead, messages]);

  const formatSeenBy = (names: string[]) => {
    if (!isGroup) {
      return names.length > 0 ? (
        <CheckCheck
          className="text-primary-foreground text-sm text-right"
          size={18}
        />
      ) : null;
    }

    switch (names.length) {
      case 1:
        return (
          <p className="text-muted-foreground text-[8px] text-right">
            Seen by {names[0]}
          </p>
        );

      case 2:
        return (
          <p className="text-muted-foreground text-[8px] text-right">
            Seen by {names[0]} and {names[1]}
          </p>
        );

      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <p className="text-muted-foreground text-[8px] text-right">
                  Seen by {names[0]}, {names[1]} and {names.length - 2}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <ul>
                  {names.map((n, i) => {
                    return <li key={i + n}>{n}</li>;
                  })}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };
  const getSeenMessage = (messageId: Id<"messages">) => {
    const seenUsers = members
      .filter((member) => member.lastSeenMessageId === messageId)
      .map((user) => user.username!.split(" ")[0]);
    if (seenUsers.length === 0) return undefined;
    return formatSeenBy(seenUsers);
  };
  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-3 no-scrollbar">
      {typingUsers && typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}
      {!callType ? (
        messages?.map((message, i) => {
          const seenMessage = message.isCurrentUser
            ? getSeenMessage(message.message._id)
            : undefined;
          return (
            <Message
              isGroup={isGroup}
              replyTo={
                message.message.replyTo
                  ? {
                      messageId: message.message.replyTo,
                      content:
                        messages.find(
                          (m) => m.message._id === message.message.replyTo
                        )?.message.content || [],
                    }
                  : undefined
              }
              seen={seenMessage}
              isEdited={message.message.isEdited}
              key={message.message._id}
              content={message.message.content}
              createdAt={message.message._creationTime}
              fromCurrentUser={message.isCurrentUser}
              lastByUser={
                i === messages.length - 1 ||
                messages[i + 1]?.message.senderId !==
                  messages[i].message.senderId
              }
              senderImage={message.senderImage}
              senderName={message.senderName || ""}
              type={message.message.type}
              isLastMessage={i === 0}
              messageId={message.message._id}
              isSystemMessage={message.message.isSystemMessage}
            />
          );
        })
      ) : (
        <CallRoom />
      )}
    </div>
  );
}
