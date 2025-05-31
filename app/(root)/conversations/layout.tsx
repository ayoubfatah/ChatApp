"use client";
import ItemList from "@/components/shared/item-list/itemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { ReactNode, useMemo } from "react";
import DMconversationItem from "./_components/DMconversationItem";
import { CreateGroupDialog } from "./_components/CreateGroupDialog";
import GroupConversationItem from "./_components/GroupConversations";

export default function ConversationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const conversations = useQuery(api.conversations.get);

  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    return [...conversations].sort((a, b) => {
      // If both have lastMessage, sort by their creation time
      if (a.lastMessage?._creationTime && b.lastMessage?._creationTime) {
        return b.lastMessage._creationTime - a.lastMessage._creationTime;
      }
      // If only one has lastMessage, prioritize the one with a message
      if (a.lastMessage?._creationTime) return -1;
      if (b.lastMessage?._creationTime) return 1;
      // If neither has messages, sort by conversation creation time
      return b.conversation._creationTime - a.conversation._creationTime;
    });
  }, [conversations]);

  return (
    <>
      <ItemList title="Conversations" action={<CreateGroupDialog />}>
        {conversations ? (
          sortedConversations.length === 0 ? (
            <p className="h-full w-full flex justify-center items-center">
              No conversations found
            </p>
          ) : (
            sortedConversations.map((conversation) => {
              return conversation.conversation.isGroup ? (
                <GroupConversationItem
                  key={conversation?.conversation?._id}
                  id={conversation?.conversation?._id}
                  name={conversation?.conversation.name}
                  lastMessageContent={
                    conversation?.lastMessage?.content ||
                    "star a new conversation"
                  }
                  lastMessageSender={conversation?.lastMessage?.sender || ""}
                  unSeenCount={conversation?.unSeenCount}
                />
              ) : (
                <DMconversationItem
                  key={conversation?.conversation?._id}
                  id={conversation?.conversation?._id}
                  imgUrl={conversation?.otherMember?.imgUrl}
                  username={conversation?.otherMember?.username || ""}
                  lastMessageContent={
                    conversation?.lastMessage?.content ||
                    "star a new conversation"
                  }
                  lastMessageSender={conversation?.lastMessage?.sender || ""}
                  unSeenCount={conversation?.unSeenCount}
                />
              );
            })
          )
        ) : (
          <div className="animate-spin">
            <Loader2 />
          </div>
        )}
      </ItemList>

      {children}
    </>
  );
}
