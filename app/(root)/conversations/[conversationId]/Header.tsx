import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Users,
  UserPlus,
  Phone,
  Video,
} from "lucide-react";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";
import DeleteFriendDialog from "./_components/DeleteFriendDialog";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import DeleteGroupDialog from "./_components/DeleteGroupDialog";
import LeaveGroupDialog from "./_components/LeaveGroupDialog";
import AddUsersDialog from "./_components/AddUsersDialog";
import { formatLastSeen } from "@/utils/formatLastSeen";
import { formatDistanceToNow } from "date-fns";

type HeaderProps = {
  imgUrl?: string;
  name: string;
  conversationId: Id<"conversations">;
  setCallType: Dispatch<SetStateAction<"audio" | "video" | null>>;
  userId?: Id<"users">;
};

export default function Header({
  imgUrl,
  name,
  conversationId,
  setCallType,
  userId,
}: HeaderProps) {
  const [isDeleteFriendDialogOpen, setIsDeleteFriendDialogOpen] =
    useState(false);
  const [isDeleteGroupeDialogOpen, setIsDeleteGroupeDialogOpen] =
    useState(false);
  const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);

  const conversation = useQuery(api.conversation.get, {
    conversationId: conversationId as Id<"conversations">,
  });

  const groupInfo = useQuery(
    api.conversation.getGroupInfo,
    conversation?.isGroup
      ? {
          conversationId: conversationId as Id<"conversations">,
        }
      : "skip"
  );

  // Get user's online status if it's a DM conversation
  const userStatus = useQuery(
    api.online.getUserStatus,
    !conversation?.isGroup && userId
      ? {
          userId: userId,
        }
      : "skip"
  );

  return (
    <Card className="w-full flex items-center p-0 !border-none shadow-none justify-betweens  ">
      <div className="flex w-full items-center gap-2  ">
        <Link href={"/conversations"} className="block lg:hidden">
          <CircleArrowLeft />
        </Link>
        <div className="relative">
          <Avatar className="size-8">
            <AvatarImage src={imgUrl} />
            <AvatarFallback>
              {name.charAt(0).toLocaleUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!conversation?.isGroup && userId && userStatus && (
            <span
              className={`absolute bottom-0 right-0 size-2 rounded-full border-2 border-background ${
                userStatus.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          )}
        </div>
        <div className="flex flex-col">
          <h2 className="font-semibold">{name}</h2>
          {!conversation?.isGroup &&
            userId &&
            userStatus &&
            (userStatus.isOnline ? (
              <span className="text-xs text-green-500">Online</span>
            ) : userStatus.lastSeen ? (
              <span className="text-xs text-muted-foreground">
                Last seen {formatLastSeen(userStatus.lastSeen)}
              </span>
            ) : null)}
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/conversation/${conversationId}`}>
            <Button
              className=""
              variant="ghost"
              size="icon"
              onClick={() => setCallType("audio")}
            >
              <Phone />
            </Button>
          </Link>

          <Button
            className=""
            variant="ghost"
            size="icon"
            onClick={() => setCallType("video")}
          >
            <Video />
          </Button>
        </div>
        <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation?.isGroup ? (
                <>
                  <DropdownMenuItem onClick={() => setIsGroupMembersOpen(true)}>
                    <Users className="size-4 mr-2" />
                    Group Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAddUsersOpen(true)}>
                    <UserPlus className="size-4 mr-2" />
                    Add Users
                  </DropdownMenuItem>
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
          <Dialog
            open={isGroupMembersOpen}
            onOpenChange={setIsGroupMembersOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Group Members</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current Members</h3>
                  <div className="space-y-2">
                    {groupInfo?.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={member.imgUrl} />
                          <AvatarFallback>
                            {member.username?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {groupInfo?.recentLeaves.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recently Left</h3>
                    <div className="space-y-2">
                      {groupInfo.recentLeaves.map((leave, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          <span>{leave.username}</span>
                          <span className="text-sm">
                            (
                            {formatDistanceToNow(leave.leftAt, {
                              addSuffix: true,
                            })}
                            )
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <AddUsersDialog
            isOpen={isAddUsersOpen}
            onOpenChange={setIsAddUsersOpen}
            conversationId={conversationId}
          />
        </div>
      </div>
    </Card>
  );
}
