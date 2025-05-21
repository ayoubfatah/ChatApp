import ConversationFallback from "@/components/shared/conversation/ConversationFallback";
import ItemList from "@/components/shared/item-list/itemList";
import React from "react";

export default function ConversationsPage() {
  return (
    <>
      <ItemList title="Conversations">conversations page</ItemList>
      <ConversationFallback />
    </>
  );
}
