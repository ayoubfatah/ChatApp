"use client";
import ConversationContainer from "@/components/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import Header from "./Header";
import Body from "./_components/body/Body";
import ChatInput from "./_components/input/ChatInput";

type ConversationPageProps = {
  params: {
    conversationId: Id<"conversations">;
  };
};

export default function ConversationPage({
  params: { conversationId },
}: ConversationPageProps) {
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const conversation = useQuery(api.conversation.get, {
    conversationId: conversationId,
  });

  return conversation === undefined ? (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin">
        <Loader2 className="size-8" />
      </div>
    </div>
  ) : conversation === null ? (
    <p className="w-full h-full flex items-center justify-center">
      Conversation not found
    </p>
  ) : (
    <ConversationContainer>
      <Header
        imgUrl={
          conversation.isGroup
            ? undefined
            : conversation.otherMember.imgUrl || ""
        }
        name={
          conversation.isGroup
            ? conversation?.name
            : conversation?.otherMember?.username || ""
        }
        conversationId={conversationId}
        userId={conversation?.otherMember?._id}
        setCallType={setCallType}
      />
      <Body
        setCallType={setCallType}
        callType={callType}
        members={
          conversation.isGroup
            ? conversation.otherMembers
              ? conversation.otherMembers
              : []
            : conversation.otherMember
              ? [conversation.otherMember]
              : []
        }
        isGroup={conversation.isGroup}
      ></Body>
      <ChatInput />
    </ConversationContainer>
  );
}
