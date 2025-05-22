import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { User } from "lucide-react";
import Link from "next/link";
import React from "react";

type DMconversationItemProps = {
  id: Id<"conversations">;
  imgUrl: string;
  username: string;
};
export default function DMconversationItem({
  id,
  imgUrl,
  username,
}: DMconversationItemProps) {
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
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex flex-col truncate">
            <h4 className="truncate">{username}</h4>
            <p className="text-sm text-muted-foreground truncate">
              Start the conversation
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
