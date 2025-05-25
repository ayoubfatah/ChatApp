import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CircleArrowLeft, MoreVertical, User, UserMinus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import DeleteFriendDialog from "./_components/DeleteFriendDialog";

type HeaderProps = {
  imgUrl?: string;
  name: string;
  conversationId: Id<"conversations">;
};

export default function Header({ imgUrl, name, conversationId }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="w-full flex items-center p-2 justify-betweens shadow-none">
      <div className="flex w-full items-center gap-2">
        <Link href={"/conversations"} className="block lg:hidden">
          <CircleArrowLeft />
        </Link>
        <Avatar className="size-8">
          <AvatarImage src={imgUrl} />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{name}</h2>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsOpen(true)}
              >
                <UserMinus className="size-4 mr-2 text-destructive" />
                Delete Friend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteFriendDialog
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            conversationId={conversationId}
          />
        </div>
      </div>
    </Card>
  );
}
