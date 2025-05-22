import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { User, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import useMutationState from "@/hooks/useMutationState";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

interface SentRequestProps {
  receiver: {
    _id: string;
    username: string;
    imgUrl: string;
    email: string;
  };
  request: {
    _id: Id<"requests">;
    _creationTime: number;
  };
}

export default function SentRequest({ receiver, request }: SentRequestProps) {
  const { mutate: removeRequest, isPending } = useMutationState(
    api.request.deleteSentRequest
  );

  async function handleDeleteRequest() {
    try {
      await removeRequest({ id: request._id });
      toast.success(
        `Friend request to ${receiver.username} has been cancelled`
      );
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.message : "Something went wrong"
      );
    }
  }

  return (
    <Card className="w-full py-2">
      <CardHeader className="flex items-center px-2">
        <Avatar className="mr-4">
          <AvatarImage src={receiver.imgUrl} />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{receiver.username}</p>
          <p className="text-sm text-muted-foreground -mt-1">
            {receiver.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(request._creationTime, { addSuffix: true })}
          </p>
        </div>
        <div className="ml-auto flex gap-2 items-center justify-center">
          <Button
            onClick={handleDeleteRequest}
            size="sm"
            className="gap-2"
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
