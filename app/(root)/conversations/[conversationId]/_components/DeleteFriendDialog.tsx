import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useMutationState from "@/hooks/useMutationState";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type DeleteFriendDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: Id<"conversations">;
};

export default function DeleteFriendDialog({
  isOpen,
  onOpenChange,
  conversationId,
}: DeleteFriendDialogProps) {
  const router = useRouter();
  const { mutate: deleteFriend, isPending } = useMutationState(
    api.friends.deleteFriend
  );

  const handleDelete = async () => {
    try {
      await deleteFriend({ id: conversationId });
      toast.success("Friend deleted successfully");
      onOpenChange(false);
      setTimeout(() => {
        router.replace("/conversations");
      }, 100);
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Failed to delete friend"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Friend</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this friend? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
