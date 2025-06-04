// hooks/useCall.tsx
"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useConvex, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// 📋 Define what a call looks like in our frontend
interface CallData {
  _id: Id<"calls">;
  conversationId: Id<"conversations">;
  initiatorId: Id<"users">;
  status: "ringing" | "active" | "ended" | "rejected" | "missed" | "cancelled";
  type: "video" | "audio";
  roomId: string;
  startedAt: number;
  answeredAt?: number;
  endedAt?: number;
  duration?: number;
  initiator?: any; // Info about who started the call
  conversation?: any; // Info about which chat this is
  participation?: any; // Info about this user's participation
}

// 📋 Define what functions our context provides
interface CallContextType {
  activeCalls: CallData[]; // All active calls for this user
  incomingCalls: CallData[]; // Calls where this user should see notification
  ongoingCall: CallData | null; // Currently active call
  initiateCall: (
    conversationId: Id<"conversations">,
    type: "video" | "audio"
  ) => Promise<{ callId: string; roomId: string }>;
  answerCall: (callId: Id<"calls">) => Promise<string>;
  rejectCall: (callId: Id<"calls">) => Promise<void>;
  endCall: (callId: Id<"calls">) => Promise<void>;
  isInCall: boolean; // Quick check if user is in any call
}

// Create the context
const CallContext = createContext<CallContextType | undefined>(undefined);

// 🎯 THE MAIN PROVIDER COMPONENT
export function CallProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const { userId: clerkId, isLoaded } = useAuth();
  const [activeCalls, setActiveCalls] = useState<CallData[]>([]);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  const userData = useQuery(api.users.get, clerkId ? { clerkId } : "skip");

  useEffect(() => {
    if (userData) {
      setUserId(userData._id);
    }
  }, [userData]);

  console.log(userId, " waaa user dzb");

  // ✅ STEP 2: Watch for active calls in real-time
  // This is the MAGIC - whenever a call is created, we'll know immediately
  useEffect(() => {
    if (!userId) return;

    console.log("👀 Starting to watch for calls for user:", userId);

    const unsubscribe = convex
      ?.watchQuery(api?.calls?.getUserActiveCalls, { userId })
      ?.onUpdate(async () => {
        const calls = await convex?.query(api?.calls?.getUserActiveCalls, {
          userId,
        });
        if (calls) {
          console.log("📞 Active calls updated:", calls);
          setActiveCalls(calls);
        }
      });

    return unsubscribe;
  }, [userId, convex]);

  // ✅ STEP 3: Separate incoming vs ongoing calls
  const incomingCalls = activeCalls.filter(
    (call) => call.status === "ringing" && call.initiatorId !== userId
  );

  const ongoingCall =
    activeCalls.find((call) => call.status === "active") || null;

  // ✅ STEP 4: Define our action functions
  const initiateCall = useCallback(
    async (conversationId: Id<"conversations">, type: "video" | "audio") => {
      if (!isLoaded || !userId) throw new Error("User not authenticated");

      console.log("🚀 Starting call:", { conversationId, type });

      const result = await convex?.mutation(api?.calls?.initiateCall, {
        conversationId,
        initiatorId: userId,
        type,
      });
      return result;
    },
    [isLoaded, userId, convex]
  );

  const answerCall = async (callId: Id<"calls">) => {
    if (!isLoaded || !userId) throw new Error("User not authenticated");

    console.log("📞 Answering call:", callId);

    const roomId = await convex?.mutation(api?.calls?.answerCall, {
      callId,
      userId,
    });

    return roomId; // Return room ID so we can connect to LiveKit
  };

  const rejectCall = async (callId: Id<"calls">) => {
    if (!isLoaded || !userId) throw new Error("User not authenticated");

    console.log("❌ Rejecting call:", callId);

    await convex?.mutation(api?.calls?.rejectCall, {
      callId,
      userId,
    });
  };

  const endCall = async (callId: Id<"calls">) => {
    if (!isLoaded || !userId) throw new Error("User not authenticated");

    console.log("🏁 Ending call:", callId);

    await convex?.mutation(api?.calls?.endCall, {
      callId,
      userId,
    });
  };

  // ✅ STEP 5: Provide everything to child components
  return (
    <CallContext.Provider
      value={{
        activeCalls,
        incomingCalls, // These will trigger notification modals
        ongoingCall, // This will show the call room
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        isInCall: !!ongoingCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

// ✅ Hook to use the context
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
};
