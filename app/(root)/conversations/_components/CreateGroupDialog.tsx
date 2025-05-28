"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import useMutationState from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { MailPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, { message: "This field can't be empty" }),
  members: z
    .string()
    .array()
    .min(1, { message: "You must select at least 1 friend" }),
});

export const CreateGroupDialog = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const friends = useQuery(api.friends.get);
  const { mutate: createGroup, isPending } = useMutationState(
    api.friends.createGroup
  );
  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      members: [],
      name: "",
    },
  });

  const members = form.watch("members", []);

  async function handleSubmit(values: z.infer<typeof createGroupSchema>) {
    try {
      console.log(values);
      await createGroup({ name: values.name, members: values.members });
      form.reset();
      setOpenDialog(false);
      toast.success(
        `Group ${values.name} has been created with ${members.length} members`
      );
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected Error occurred"
      );
    }
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" className="relative">
              <MailPlus size={4} />
              <span className="absolute top-50 left-50 text-xs">+</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create Group</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Create a new group chat with your friends!
        </DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name:</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="members"
              render={() => (
                <FormItem>
                  <FormLabel>Select Members:</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {friends?.map((friend) => (
                        <div
                          key={friend._id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={friend._id}
                            checked={members.includes(friend._id)}
                            onCheckedChange={(checked) => {
                              const newMembers = checked
                                ? [...members, friend._id]
                                : members.filter((id) => id !== friend._id);
                              form.setValue("members", newMembers);
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button disabled={isPending} type="submit">
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
