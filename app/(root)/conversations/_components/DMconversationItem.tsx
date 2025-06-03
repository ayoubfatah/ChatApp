"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { User } from "lucide-react";
import Link from "next/link";

type DMconversationItemProps = {
  id: Id<"conversations">;
  imgUrl: string;
  username: string;
  lastMessageSender?: string;
  lastMessageContent?: string;
  unSeenCount?: number;
  userId: Id<"users">;
};

export default function DMconversationItem({
  id,
  imgUrl,
  username,
  lastMessageContent,
  lastMessageSender,
  unSeenCount = 0,
  userId,
}: DMconversationItemProps) {
  const { userId: clerkId, isLoaded } = useAuth();
  const user = useQuery(
    isLoaded && api.users.get,
    clerkId
      ? {
          clerkId: clerkId,
        }
      : undefined
  );
  const currentUserUsername = user?.username;

  // Get typing status for this conversation
  const typingUsers = useQuery(api.conversation.getTypingStatus, {
    conversationId: id,
  });

  // Get user's online status
  const userStatus = useQuery(
    isLoaded && api.online.getUserStatus,
    userId
      ? {
          userId: userId,
        }
      : "skip"
  );

  // Check if the other user is typing
  const isOtherUserTyping = typingUsers && typingUsers.length > 0;

  return (
    <Link href={`/conversations/${id}`} className="w-full">
      <Card className="p-2 flex flex-row items-center gap-4 truncate rounded-sm">
        <div className="flex flex-row items-center gap-4 truncate">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage src={imgUrl} />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            {userId &&
              userStatus &&
              (userStatus.isOnline ? (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background" />
              ) : (
                <span className="absolute bottom-0 right-0 size-3 bg-gray-400 rounded-full border-2 border-background" />
              ))}
          </div>
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2">
              <h4 className="truncate">{username}</h4>
            </div>
            {isOtherUserTyping ? (
              <p className="text-sm text-muted-foreground italic">
                {username} is typing...
              </p>
            ) : lastMessageSender && lastMessageContent ? (
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
