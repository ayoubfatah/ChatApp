// convex/calls.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 🚀 FUNCTION 1: Start a new call
export const initiateCall = mutation({
  args: {
    conversationId: v.id("conversations"), // Which chat to call
    initiatorId: v.id("users"), // Who's starting the call
    type: v.union(v.literal("video"), v.literal("audio")), // Video or audio
  },
  handler: async (ctx, args) => {
    // ✅ STEP 1: Check if there's already a call happening
    // We don't want multiple calls in the same conversation
    const existingCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "active")
      )
      .first();

    if (existingCall) {
      throw new Error("There's already an active call in this conversation");
    }

    // ✅ STEP 2: Create a unique room ID for LiveKit
    const roomId = `call_${args.conversationId}_${Date.now()}`;

    // ✅ STEP 3: Create the call record
    const callId = await ctx.db.insert("calls", {
      conversationId: args.conversationId,
      initiatorId: args.initiatorId,
      status: "ringing", // 📞 This will trigger notifications!
      type: args.type,
      roomId,
      startedAt: Date.now(),
    });

    // ✅ STEP 4: Add all conversation members as potential participants
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Add each member to the call participants
    for (const member of members) {
      await ctx.db.insert("callParticipants", {
        callId,
        userId: member.memberId,
        role:
          member.memberId === args.initiatorId ? "initiator" : "participant",
      });
    }

    return { callId, roomId };
  },
});

// 📞 FUNCTION 2: Answer an incoming call
export const answerCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ STEP 1: Make sure the call exists and is still ringing
    const call = await ctx.db.get(args.callId);
    if (!call || call.status !== "ringing") {
      throw new Error("Call not found or not ringing");
    }

    const now = Date.now();

    // ✅ STEP 2: Change status to "active" - this stops the ringing notifications
    await ctx.db.patch(args.callId, {
      status: "active",
      answeredAt: now,
    });

    // ✅ STEP 3: Record when this user joined the call
    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        joinedAt: now,
      });
    }

    // Return the room ID so the frontend can connect to LiveKit
    return call.roomId;
  },
});

// ❌ FUNCTION 3: Reject an incoming call
export const rejectCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call || call.status !== "ringing") {
      throw new Error("Call not found or not ringing");
    }

    // Set status to rejected - this will hide the notification
    await ctx.db.patch(args.callId, {
      status: "rejected",
      endedAt: Date.now(),
    });
  },
});

// 🏁 FUNCTION 4: End an active call
export const endCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const now = Date.now();

    // Calculate how long the call lasted
    const duration = call.answeredAt
      ? Math.floor((now - call.answeredAt) / 1000)
      : 0;

    // Mark the call as ended
    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: now,
      duration,
    });

    // Record when this participant left
    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) =>
        q.eq("callId", args.callId).eq("userId", args.userId)
      )
      .first();

    if (participant && !participant.leftAt) {
      await ctx.db.patch(participant._id, {
        leftAt: now,
      });
    }
  },
});

// 📋 FUNCTION 5: Get all active calls for a user (for notifications)
export const getUserActiveCalls = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // ✅ STEP 1: Find all calls this user is part of
    const participations = await ctx.db
      .query("callParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeCalls = [];

    // ✅ STEP 2: For each participation, check if the call is still active
    for (const participation of participations) {
      const call = await ctx.db.get(participation.callId);

      // Only include calls that are ringing or active
      if (call && (call.status === "ringing" || call.status === "active")) {
        // Get extra info for the UI
        const initiator = await ctx.db.get(call.initiatorId);
        const conversation = await ctx.db.get(call.conversationId);

        activeCalls.push({
          ...call,
          participation,
          initiator, // Who started the call
          conversation, // Which chat this is for
        });
      }
    }

    return activeCalls;
  },
});

// 🚫 FUNCTION 6: Cancel a ringing call
export const cancelCall = mutation({
  args: {
    callId: v.id("calls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call || call.status !== "ringing") {
      throw new Error("Call not found or not ringing");
    }

    // Only the initiator can cancel the call
    if (call.initiatorId !== args.userId) {
      throw new Error("Only the initiator can cancel the call");
    }

    // Set status to cancelled
    await ctx.db.patch(args.callId, {
      status: "cancelled",
      endedAt: Date.now(),
    });
  },
});
