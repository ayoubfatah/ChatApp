"use client";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { api } from "@/convex/_generated/api";
import useConversation from "@/hooks/useConversation";
import useMutationState from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConvexError } from "convex/values";
import React, { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { SendHorizonal, X } from "lucide-react";
import { useMessageStore } from "@/store/useMessageStore";

const chatMessageSchema = z.object({
  content: z.string().min(1, { message: "this field can't be empty" }),
});

export default function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { conversationId } = useConversation();
  const {
    editMessage,
    isEditingMessage,
    setEditMessage,
    setIsEditingMessage,
    replyTo,
    isReplying,
    setReplyTo,
    setIsReplying,
  } = useMessageStore();

  console.log("ChatInput - Current state:", { editMessage, isEditingMessage });

  const { mutate: createMessage, isPending: isCreating } = useMutationState(
    api.message.create
  );

  const { mutate: editMessageMutation, isPending: isEditing } =
    useMutationState(api.message.edit);

  const form = useForm<z.infer<typeof chatMessageSchema>>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    console.log("Edit mode changed:", { isEditingMessage, editMessage });
    if (isEditingMessage && editMessage) {
      console.log("Focusing textarea for editing");
      textareaRef.current?.focus();
    }
  }, [isEditingMessage, editMessage]);

  const handleCancelEdit = useCallback(() => {
    console.log("Canceling edit mode");
    setEditMessage(null);
    setIsEditingMessage(false);
    form.reset();
  }, [setEditMessage, setIsEditingMessage, form]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
    setIsReplying(false);
    form.reset();
  }, [setReplyTo, setIsReplying, form]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditingMessage) {
          handleCancelEdit();
        }
        if (isReplying) {
          handleCancelReply();
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isEditingMessage, isReplying, handleCancelEdit, handleCancelReply]);

  function handleInputChange(
    event:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.MouseEvent<HTMLTextAreaElement>
  ) {
    const target = event.target as HTMLTextAreaElement;
    const { value, selectionStart } = target;
    if (selectionStart !== null) {
      form.setValue("content", value);
    }
  }

  async function handleSubmit(values: z.infer<typeof chatMessageSchema>) {
    console.log("Submit called with values:", values);
    try {
      if (isEditingMessage && editMessage) {
        await editMessageMutation({
          messageId: editMessage,
          content: [values.content],
        });
        handleCancelEdit();
      } else {
        await createMessage({
          conversationId,
          type: "text",
          content: [values.content],
          replyTo: isReplying ? replyTo?.messageId : undefined,
        });
        if (isReplying) {
          handleCancelReply();
        } else {
          form.reset();
        }
      }
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Unexpected error occurred "
      );
    }
  }

  return (
    <Card className="w-full p-2 rounded-lg relative">
      {(isEditingMessage || isReplying) && (
        <div className="absolute w-[101%] sm:w-[100.3%] -m-[1px] -top-[35px] left-0 right-0 flex items-center justify-between bg-muted border border-muted p-2 rounded-t-lg">
          <p className="text-sm text-muted-foreground">
            {isEditingMessage
              ? "Editing message"
              : `Replying to: ${replyTo?.content[0]}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={isEditingMessage ? handleCancelEdit : handleCancelReply}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
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
                      autoFocus
                      ref={textareaRef}
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
                      placeholder={
                        isEditingMessage
                          ? "Edit your message..."
                          : isReplying
                            ? "Write a reply..."
                            : "Type a message..."
                      }
                      className="min-h-full w-full resize-none border-0 outline-0 bg-card text-card-foreground placeholder:text-muted-foreground p-1.5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              disabled={isCreating || isEditing}
              className=""
              size="icon"
              type="submit"
            >
              <SendHorizonal />
            </Button>
          </form>
        </Form>
      </div>
    </Card>
  );
}
