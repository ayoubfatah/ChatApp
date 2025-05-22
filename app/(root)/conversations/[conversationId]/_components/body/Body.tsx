"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useConversation from "@/hooks/useConversation";
import { useQuery } from "convex/react";
import React from "react";
import Message from "./Message";

export default function Body() {
  const { conversationId } = useConversation();
  const messages = useQuery(api.messages.get, {
    conversationId: conversationId as Id<"conversations">,
  });

  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-3 no-scrollbar">
      {messages?.map((message, i) => (
        <Message
          key={message.message._id}
          content={message.message.content}
          createdAt={message.message._creationTime}
          fromCurrentUser={message.isCurrentUser}
          lastByUser={
            messages[i - 1]?.message.senderId === messages[i].message.senderId
          }
          senderImage={message.senderImage}
          senderName={message.senderName || ""}
          type={message.message.type}
        />
      ))}
    </div>
  );
}
