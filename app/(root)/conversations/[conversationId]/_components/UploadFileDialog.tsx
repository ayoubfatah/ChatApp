"use client";
import { Uploader } from "@/components/shared/uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/convex/_generated/api";
import useConversation from "@/hooks/useConversation";
import useMutationState from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { ConvexError } from "convex/values";
import { File, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Props = {
  open: boolean;
  toggle: (newState: boolean) => void;
  type: "imageUploader" | "file";
};
const uploadTypeSchema = z.object({
  files: z
    .string()
    .array()
    .min(1, { message: "You must select at least  1 file" }),
});

export const UploadFileDialog = ({ open, toggle, type }: Props) => {
  const { conversationId } = useConversation();
  const form = useForm<z.infer<typeof uploadTypeSchema>>({
    resolver: zodResolver(uploadTypeSchema),
    defaultValues: {
      files: [],
    },
  });

  const files = form.watch("files");

  const { mutate: createMessage, isPending } = useMutationState(
    api.message.create
  );

  async function handleSubmit(values: z.infer<typeof uploadTypeSchema>) {
    try {
      await createMessage({
        conversationId,
        type: type,
        content: [values.files],
        replyTo: undefined,
      });
      setTimeout(() => {
        form.reset();
        toggle(false);
      }, 0);
    } catch (error) {
      form.reset();
      toggle(false);
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected error occurred"
      );
    }
  }
  return (
    <Dialog open={open} onOpenChange={(open) => toggle(open)}>
      <DialogTrigger asChild>
        <div>
          <Button size="icon" variant="outline">
            {type === "imageUploader" ? (
              <Image aria-label="Upload image" />
            ) : (
              <File aria-label="Upload file" />
            )}
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            {type === "imageUploader"
              ? "Upload Images and videos"
              : "Upload Image ,video , audio or pdf"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="py-4">
                      <Uploader
                        type={type}
                        onChange={(urls) => field.onChange([...files, ...urls])}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => toggle(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!files.length || isPending}>
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
