"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";

import Link from "next/link";
import React from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

type GroupConversationItemProps = {
  id: Id<"conversations">;
  name: string;
  lastMessageSender?: string;
  lastMessageContent?: string;
  unSeenCount?: number;
};

export default function GroupConversationItem({
  id,
  name,
  lastMessageContent,
  lastMessageSender,
  unSeenCount = 0,
}: GroupConversationItemProps) {
  const { userId, isLoaded } = useAuth();
  const user = useQuery(isLoaded && api.users.get, { clerkId: userId });
  const currentUserUsername = user?.username;

  return (
    <Link href={`/conversations/${id}`} className="w-full">
      <Card className="p-2 flex flex-row items-center gap-4 truncate rounded-sm">
        <div className="flex flex-row items-center gap-4 truncate">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarFallback>
                {name.charAt(0).toLocaleUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex flex-col truncate">
            <h4 className="truncate">{name}</h4>
            {lastMessageSender && lastMessageContent ? (
              <span className="text-sm text-muted-foreground flex truncate overflow-ellipsis">
                <p className="font-semibold">
                  {lastMessageSender === currentUserUsername ? "You :" : ""}
                </p>
                <p className="truncate overflow-ellipsis">
                  {lastMessageContent}
                </p>
              </span>
            ) : (
              <p className="text-sm text-muted-foreground truncate">
                Start the conversation
              </p>
            )}
          </div>
        </div>
        {unSeenCount > 0 && (
          <div className="ml-auto bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 text-xs">
            {unSeenCount}
          </div>
        )}
      </Card>
    </Link>
  );
}
