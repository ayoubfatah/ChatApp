"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function useConversation() {
  const params = useParams() as { conversationId?: string };

  const conversationId = useMemo(
    () => params?.conversationId?.toString() || "",
    [params?.conversationId]
  );

  const isActive = useMemo(() => !!conversationId, [conversationId]);

  return { conversationId, isActive };
}
