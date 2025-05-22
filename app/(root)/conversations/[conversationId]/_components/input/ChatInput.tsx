"use client";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { api } from "@/convex/_generated/api";
import useConversation from "@/hooks/useConversation";
import useMutationState from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConvexError } from "convex/values";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

const chatMessageSchema = z.object({
  content: z.string().min(1, { message: "this field can't be empty" }),
});

export default function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { conversationId } = useConversation();

  console.log(conversationId, "conversation id ");
  const { mutate: createMessage, isPending } = useMutationState(
    api.message.create
  );

  const form = useForm<z.infer<typeof chatMessageSchema>>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      content: "",
    },
  });

  function handleInputChange(event: any) {
    const { value, selectionStart } = event.target;
    if (selectionStart !== null) {
      form.setValue("content", value);
    }
  }

  async function handleSubmit(values: z.infer<typeof chatMessageSchema>) {
    try {
      await createMessage({
        conversationId,
        type: "text",
        content: [values.content],
      });
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected error occurred "
      );
      console.log(error);
    }
  }

  return (
    <Card className="w-full p-2 rounded-lg relative">
      <div className="flex gap-2 items-end">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex gap-2 items-end w-full"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="h-full w-full">
                  <FormControl>
                    <TextareaAutosize
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          await form.handleSubmit(handleSubmit)();
                        }
                      }}
                      rows={1}
                      maxRows={3}
                      {...field}
                      onChange={handleInputChange}
                      onClick={handleInputChange}
                      placeholder="type a message..."
                      className="min-h-full w-full resize-none border-0 outline-0 bg-card text-card-foreground placeholder:text-muted-foreground p-1.5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button disabled={isPending} className="" size="icon" type="submit">
              <SendHorizonal />
            </Button>{" "}
          </form>
        </Form>
      </div>
    </Card>
  );
}
