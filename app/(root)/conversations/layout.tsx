"use client";
import ItemList from "@/components/shared/item-list/itemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import DMconversationItem from "./_components/DMconversationItem";

export default function ConversationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const conversations = useQuery(api.conversations.get);
  console.log(conversations, "conversations");
  return (
    <>
      <ItemList title="Conversations">
        {conversations ? (
          conversations.length === 0 ? (
            <p className="h-full w-full flex justify-center items-center">
              No conversations found
            </p>
          ) : (
            conversations.map((conversation) => {
              return conversation.conversation.isGroup ? null : (
                <DMconversationItem
                  key={conversation?.conversation?._id}
                  id={conversation?.conversation?._id}
                  imgUrl={conversation?.otherMember?.imgUrl}
                  username={conversation?.otherMember?.username || ""}
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
