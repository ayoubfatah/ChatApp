import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import {
  CircleArrowLeft,
  MoreVertical,
  UserMinus,
  LogOut,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DeleteFriendDialog from "./_components/DeleteFriendDialog";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import DeleteGroupDialog from "./_components/DeleteGroupDialog";
import LeaveGroupDialog from "./_components/LeaveGroupDialog";

type HeaderProps = {
  imgUrl?: string;
  name: string;
  conversationId: Id<"conversations">;
};

export default function Header({ imgUrl, name, conversationId }: HeaderProps) {
  const [isDeleteFriendDialogOpen, setIsDeleteFriendDialogOpen] =
    useState(false);
  const [isDeleteGroupeDialogOpen, setIsDeleteGroupeDialogOpen] =
    useState(false);

  const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);

  const conversation = useQuery(api.conversation.get, {
    conversationId,
  });

  return (
    <Card className="w-full flex items-center p-0 !border-none shadow-none justify-betweens ">
      <div className="flex w-full items-center gap-2  ">
        <Link href={"/conversations"} className="block lg:hidden">
          <CircleArrowLeft />
        </Link>
        <Avatar className="size-8">
          <AvatarImage src={imgUrl} />
          <AvatarFallback>{name.charAt(0).toLocaleUpperCase()}</AvatarFallback>
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
              {conversation?.isGroup ? (
                <>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setIsLeaveGroupDialogOpen(true)}
                  >
                    <LogOut className="size-4 mr-2 text-destructive" />
                    Leave Group
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setIsDeleteGroupeDialogOpen(true)}
                  >
                    <Trash className="size-4 mr-2 text-destructive" />
                    Delete Group
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setIsDeleteFriendDialogOpen(true)}
                >
                  <UserMinus className="size-4 mr-2 text-destructive" />
                  Delete Friend
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteFriendDialog
            isOpen={isDeleteFriendDialogOpen}
            onOpenChange={setIsDeleteFriendDialogOpen}
            conversationId={conversationId}
          />
          <DeleteGroupDialog
            isOpen={isDeleteGroupeDialogOpen}
            onOpenChange={setIsDeleteGroupeDialogOpen}
            conversationId={conversationId}
          />
          <LeaveGroupDialog
            isOpen={isLeaveGroupDialogOpen}
            onOpenChange={setIsLeaveGroupDialogOpen}
            conversationId={conversationId}
          />
        </div>
      </div>
    </Card>
  );
}
