import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    imgUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"]),

  requests: defineTable({
    sender: v.id("users"),
    receiver: v.id("users"),
  })
    .index("by_receiver", ["receiver"])
    .index("by_sender", ["sender"])
    .index("by_receiver_sender", ["receiver", "sender"]),

  friends: defineTable({
    user1: v.id("users"),
    user2: v.id("users"),
    conversationId: v.id("conversations"),
  })
    .index("by_user1", ["user1"])
    .index("by_user2", ["user2"])
    .index("by_conversationId", ["conversationId"]),
  conversations: defineTable({
    name: v.optional(v.string()),
    isGroup: v.boolean(),
    lastMessageId: v.optional(v.id("messages")),
  }),
  // conversation members well keep track of a mapping between users and conversations they are part of
  conversationMembers: defineTable({
    memberId: v.id("users"),
    conversationId: v.id("conversations"),
    lastSeenMessage: v.optional(v.id("messages")),
  })
    .index("by_memberId", ["memberId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_memberId_conversationId", ["memberId", "conversationId"]),
  messages: defineTable({
    senderId: v.id("users"),
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
    isEdited: v.boolean(),
    replyTo: v.optional(v.id("messages")),
    isSystemMessage: v.optional(v.boolean()),
  }).index("by_conversationId", ["conversationId"]),

  groupLeaves: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    username: v.string(),
    leftAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"]),

  typingStatus: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
    lastTypingAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"]),

  calls: defineTable({
    conversationId: v.id("conversations"), // Which conversation is calling
    initiatorId: v.id("users"), // Who started the call

    // Call status - this is KEY for showing notifications
    status: v.union(
      v.literal("ringing"), // 📞 Call just started, waiting for answer
      v.literal("active"), // ✅ Someone answered, call is ongoing
      v.literal("ended"), // 🏁 Call finished normally
      v.literal("rejected"), // ❌ Recipient declined
      v.literal("missed"), // 📵 No one answered
      v.literal("cancelled") // 🚫 Caller cancelled before answer
    ),

    type: v.union(v.literal("video"), v.literal("audio")), // Video or voice call
    roomId: v.string(), // LiveKit room ID for the actual call
    startedAt: v.number(), // When call was initiated
    answeredAt: v.optional(v.number()), // When someone picked up
    endedAt: v.optional(v.number()), // When call ended
    duration: v.optional(v.number()), // How long the call lasted
  })
    // These indexes help us find calls quickly
    .index("by_conversation", ["conversationId"]) // Find calls for a chat
    .index("by_initiator", ["initiatorId"]) // Find calls user started
    .index("by_status", ["status"]) // Find active calls
    .index("by_conversation_status", ["conversationId", "status"]), // Find active calls in a chat

  // 🆕 NEW: This table tracks who's in each call (supports group calls)
  callParticipants: defineTable({
    callId: v.id("calls"), // Which call this is for
    userId: v.id("users"), // Which user this is
    joinedAt: v.optional(v.number()), // When they joined the call
    leftAt: v.optional(v.number()), // When they left the call
    role: v.union(v.literal("initiator"), v.literal("participant")), // Who started vs joined
  })
    .index("by_call", ["callId"]) // Find all participants in a call
    .index("by_user", ["userId"]) // Find all calls a user is in
    .index("by_call_user", ["callId", "userId"]), // Find specific user
});
