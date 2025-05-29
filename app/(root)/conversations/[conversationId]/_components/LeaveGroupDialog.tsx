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
import { useRef } from "react";
import { toast } from "sonner";

type LeaveGroupDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: Id<"conversations">;
};

export default function LeaveGroupDialog({
  isOpen,
  onOpenChange,
  conversationId,
}: LeaveGroupDialogProps) {
  const router = useRouter();
  const { mutate: deleteGroup, isPending } = useMutationState(
    api.group.leaveGroup
  );
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const handleDelete = async () => {
    try {
      await deleteGroup({ id: conversationId });
      toast.success("You left The Group");
      onOpenChange(false);
      timeoutId.current = setTimeout(() => {
        router.replace("/conversations");
      }, 100);
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Failed to leave the Group"
      );
    } finally {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
          <DialogDescription>
            Are you sure you want to Leave this Group? This action cannot be
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
            {isPending ? "Leaving..." : "Leave"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
