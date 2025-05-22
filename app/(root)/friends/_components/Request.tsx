import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useMutationState from "@/hooks/useMutationState";
import { ConvexError } from "convex/values";
import { Check, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type props = {
  id: Id<"requests">;
  imgUrl: string;
  username: string;
  email: string;
};
export default function Request({ id, imgUrl, username, email }: props) {
  const { mutate: denyRequest, isPending: denyPending } = useMutationState(
    api.request.deny
  );
  const { mutate: acceptRequest, isPending: acceptPending } = useMutationState(
    api.request.accept
  );

  async function handleDenyRequest() {
    try {
      await denyRequest({ id });
      toast.success("Friend Request Denied");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected error occurred "
      );
    }
  }
  async function handleAcceptRequest() {
    try {
      await acceptRequest({ id });
      toast.success("Friend Request Accepted");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected error occurred "
      );
    }
  }

  return (
    <Card className="w-full  py-3 ">
      <CardHeader className="flex items-center px-2 ">
        <Avatar>
          <AvatarImage src={imgUrl} />
          <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{username}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="ml-auto flex gap-2 items-center justify-center">
          <Button
            onClick={handleDenyRequest}
            disabled={denyPending || acceptPending}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAcceptRequest}
            disabled={denyPending || acceptPending}
            size="sm"
            className="gap-2"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
