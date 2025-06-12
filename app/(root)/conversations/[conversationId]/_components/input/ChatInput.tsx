"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useConversation from "@/hooks/useConversation";
import useMutationState from "@/hooks/useMutationState";
import { useMessageStore } from "@/store/useMessageStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { SendHorizonal, X, Mic } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { z } from "zod";
import { MessageActionsPopover } from "./MessageActionsPopover";
import { useTheme } from "next-themes";
import EmojiPicker, { Theme } from "emoji-picker-react";
import AudioCapture from "./audio-capture";

const chatMessageSchema = z.object({
  content: z.string().min(1, { message: "this field can't be empty" }),
});

export default function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<any>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const { theme } = useTheme();

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

  const { mutate: createMessage, isPending: isCreating } = useMutationState(
    api.message.create
  );

  const { mutate: editMessageMutation, isPending: isEditing } =
    useMutationState(api.message.edit);

  const setTypingStatus = useMutation(api.conversation.setTypingStatus);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof chatMessageSchema>>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      content: "",
    },
  });

  const content = form.watch("content", "");
  const [showAudioCapture, setShowAudioCapture] = useState(false);

  useEffect(() => {
    if (isEditingMessage && editMessage) {
      textareaRef.current?.focus();
    }
  }, [isEditingMessage, editMessage]);

  const handleCancelEdit = useCallback(() => {
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
      setCursorPosition(selectionStart);
      handleTyping();
    }
  }

  const insertEmoji = (emoji: string) => {
    const newText = [
      content.substring(0, cursorPosition),
      emoji,
      content.substring(cursorPosition),
    ].join("");
    form.setValue("content", newText);
    setCursorPosition(cursorPosition + emoji.length);
  };
  async function handleSubmit(values: z.infer<typeof chatMessageSchema>) {
    try {
      // Clear typing status when sending message
      setTypingStatus({
        conversationId: conversationId as Id<"conversations">,
        isTyping: false,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

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

  const handleTyping = () => {
    setTypingStatus({
      conversationId: conversationId as Id<"conversations">,
      isTyping: true,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing status
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({
        conversationId: conversationId as Id<"conversations">,
        isTyping: false,
      });
      typingTimeoutRef.current = null;
    }, 1000); // Reduced to 1 second for better UX
  };

  // Clear typing status when component unmounts or when input is empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //
  //
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!value.content) {
        setTypingStatus({
          conversationId: conversationId as Id<"conversations">,
          isTyping: false,
        });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, form, setTypingStatus]);

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
      <div className="absolute bottom-16 bg-amber-400" ref={emojiPickerRef}>
        <EmojiPicker
          open={emojiPickerOpen}
          theme={theme as Theme}
          onEmojiClick={(emojiDetails) => {
            insertEmoji(emojiDetails.emoji);
            setEmojiPickerOpen(false);
          }}
          lazyLoadEmojis
        />
      </div>
      <div className="flex gap-2 items-end">
        <MessageActionsPopover setEmojiPickerOpen={setEmojiPickerOpen} />
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
            {content.trim() ? (
              <Button
                disabled={isCreating || isEditing}
                className=""
                size="icon"
                type="submit"
              >
                <SendHorizonal />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => setShowAudioCapture(true)}
                variant="outline"
              >
                <Mic />
              </Button>
            )}
          </form>
        </Form>
      </div>
      {showAudioCapture && (
        <AudioCapture onAudioSent={() => setShowAudioCapture(false)} />
      )}
    </Card>
  );
}
