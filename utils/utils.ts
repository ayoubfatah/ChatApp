import { toast } from "sonner";

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
  } catch {
    toast.error("Failed to copy message");
  }
};
