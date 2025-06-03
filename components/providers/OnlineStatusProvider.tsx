"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";

export default function OnlineStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const updateOnlineStatus = useMutation(api.online.updateOnlineStatus);
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (isOnlineRef.current) {
        updateOnlineStatus({ isOnline: false });
        isOnlineRef.current = false;
      }
      return;
    }

    // Set online
    const setOnline = () => {
      updateOnlineStatus({ isOnline: true });
      isOnlineRef.current = true;
    };

    const setOffline = () => {
      updateOnlineStatus({ isOnline: false });
      isOnlineRef.current = false;
    };

    setOnline();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Use pagehide instead of beforeunload - more reliable
    const handlePageHide = () => {
      if (isOnlineRef.current) {
        setOffline();
        isOnlineRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (isOnlineRef.current) {
        setOffline();
      }
    };
  }, [user, isLoaded, isSignedIn, updateOnlineStatus]);

  return <>{children}</>;
}
