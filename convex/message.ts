import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    console.log("type li kayji ", args.type);

    const currentUser = await getAuthenticatedUser(ctx);

    if (!currentUser) {
      throw new ConvexError("User not found in requests");
    }
    // getting the memberShip of the current user in the conversation
    const memberShip = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q
          .eq("memberId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();
    if (!memberShip) {
      throw new ConvexError("You aren't a member of this conversation");
    }
    // If replying to a message, verify the message exists and is in the same conversation
    if (args.replyTo) {
      const repliedMessage = await ctx.db.get(args.replyTo);
      if (!repliedMessage) {
        throw new ConvexError("Message you're replying to doesn't exist");
      }
      if (repliedMessage.conversationId !== args.conversationId) {
        throw new ConvexError(
          "Cannot reply to a message from a different conversation"
        );
      }
    }
    // creating the message
    const message = await ctx.db.insert("messages", {
      senderId: currentUser._id,
      isEdited: false,
      ...args,
    });
    await ctx.db.patch(args.conversationId, { lastMessageId: message });
    return message;
  },
});

export const edit = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getAuthenticatedUser(ctx);

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    console.log(currentUser, "current user ");

    // Get the message to edit
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    console.log(message, "message");

    // Check if the current user is the sender
    if (message.senderId !== currentUser._id) {
      throw new ConvexError("You can only edit your own messages");
    }

    // Check if user is a member of the conversation
    const memberShip = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q
          .eq("memberId", currentUser._id)
          .eq("conversationId", message.conversationId)
      )
      .first();

    console.log(memberShip, "memeberShip");
    if (!memberShip) {
      throw new ConvexError("You aren't a member of this conversation");
    }

    // Update the message
    const updatedMessage = await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
    });

    return updatedMessage;
  },
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getAuthenticatedUser(ctx);

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Get the message to delete
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Check if the current user is the sender
    if (message.senderId !== currentUser._id) {
      throw new ConvexError("You can only delete your own messages");
    }

    // Check if user is a member of the conversation
    const memberShip = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q
          .eq("memberId", currentUser._id)
          .eq("conversationId", message.conversationId)
      )
      .first();

    if (!memberShip) {
      throw new ConvexError("You aren't a member of this conversation");
    }

    // Delete the message
    await ctx.db.delete(args.messageId);

    // If this was the last message in the conversation, update the conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (conversation?.lastMessageId === args.messageId) {
      // Find the new last message
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", message.conversationId)
        )
        .order("desc")
        .first();

      // Update conversation with new last message or null if no messages left
      await ctx.db.patch(message.conversationId, {
        lastMessageId: lastMessage?._id || null,
      });
    }

    return args.messageId;
  },
});
