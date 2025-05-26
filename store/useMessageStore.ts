import { create } from "zustand";

interface MessageStore {
  editMessage: string | null;
  isEditingMessage: boolean;
  replyTo: { messageId: string; content: string[] } | null;
  isReplying: boolean;
  setEditMessage: (messageId: string | null) => void;
  setIsEditingMessage: (isEditing: boolean) => void;
  setReplyTo: (
    message: { messageId: string; content: string[] } | null
  ) => void;
  setIsReplying: (isReplying: boolean) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  editMessage: null,
  isEditingMessage: false,
  replyTo: null,
  isReplying: false,
  setEditMessage: (messageId) => set({ editMessage: messageId }),
  setIsEditingMessage: (isEditing) => set({ isEditingMessage: isEditing }),
  setReplyTo: (message) => set({ replyTo: message }),
  setIsReplying: (isReplying) => set({ isReplying }),
}));
