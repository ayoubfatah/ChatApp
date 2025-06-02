"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function OnlineStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const updateOnlineStatus = useMutation(api.online.updateOnlineStatus);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Set user as online when they connect
    const setOnline = async () => {
      try {
        await updateOnlineStatus({ isOnline: true });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };
    setOnline();

    // Set user as offline when they disconnect
    const handleBeforeUnload = async () => {
      try {
        await updateOnlineStatus({ isOnline: false });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Set offline when component unmounts
      try {
        updateOnlineStatus({ isOnline: false });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };
  }, [user, isLoaded, updateOnlineStatus]);

  return <>{children}</>;
}
