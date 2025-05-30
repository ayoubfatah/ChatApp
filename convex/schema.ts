import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    imgUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
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
});
