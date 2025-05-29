import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useMutationState from "@/hooks/useMutationState";
import { ConvexError } from "convex/values";
import { useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

type AddUsersDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: Id<"conversations">;
};

export default function AddUsersDialog({
  isOpen,
  onOpenChange,
  conversationId,
}: AddUsersDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { mutate: addUsers, isPending } = useMutationState(
    api.group.addUsersToGroup
  );
  const friends = useQuery(api.friends.get);
  const groupInfo = useQuery(api.conversation.getGroupInfo, {
    conversationId,
  });

  // Filter out users who are already in the group
  const availableFriends = friends?.filter(
    (friend) =>
      !groupInfo?.members.some((member) => member.username === friend.username)
  );

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await addUsers({
        conversationId,
        userIds: selectedUsers,
      });
      toast.success("Users added to the group");
      onOpenChange(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Failed to add users to the group"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Users to Group</DialogTitle>
          <DialogDescription>
            Select users to add to this group chat
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {availableFriends?.map((friend) => (
              <div key={friend._id} className="flex items-center space-x-2">
                <Checkbox
                  id={friend._id}
                  checked={selectedUsers.includes(friend._id)}
                  onCheckedChange={(checked) => {
                    setSelectedUsers(
                      checked
                        ? [...selectedUsers, friend._id]
                        : selectedUsers.filter((id) => id !== friend._id)
                    );
                  }}
                />
                <label
                  htmlFor={friend._id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {friend.username}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUsers} disabled={isPending}>
              {isPending ? "Adding..." : "Add Users"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
