import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const deleteGroup = mutation({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("unauthorized");
    }

    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new ConvexError("conversation not found");
    }

    const memberShips = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .collect();
    if (!memberShips || memberShips.length <= 1) {
      throw new ConvexError("Invalid conversation members");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .collect();

    if (!messages) {
      throw new ConvexError("this chat doesn't exist");
    }
    await ctx.db.delete(conversation._id);

    // Delete all messages concurrently using Promise.all
    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));
    await Promise.all(memberShips.map((member) => ctx.db.delete(member._id)));
  },
});

export const leaveGroup = mutation({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("unauthorized");
    }

    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new ConvexError("conversation not found");
    }

    const memberShip = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.id)
      )
      .unique();

    if (!memberShip) {
      throw new ConvexError(
        "You are not part of this group therefor you can't leave it "
      );
    }

    // Record the leave
    await ctx.db.insert("groupLeaves", {
      userId: currentUser._id,
      conversationId: args.id,
      username: currentUser.username,
      leftAt: Date.now(),
    });

    // Create a system message
    await ctx.db.insert("messages", {
      senderId: currentUser._id,
      conversationId: args.id,
      type: "text",
      content: [`${currentUser.username} left the group`],
      isEdited: false,
      isSystemMessage: true,
    });

    await ctx.db.delete(memberShip._id);
  },
});

export const addUsersToGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("unauthorized");
    }

    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.isGroup) {
      throw new ConvexError("conversation not found or not a group");
    }

    // Check if current user is a member of the group
    const currentUserMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q
          .eq("memberId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!currentUserMembership) {
      throw new ConvexError("You are not a member of this group");
    }

    // Add each user to the group
    await Promise.all(
      args.userIds.map(async (userId) => {
        // Check if user is already a member
        const existingMembership = await ctx.db
          .query("conversationMembers")
          .withIndex("by_memberId_conversationId", (q) =>
            q.eq("memberId", userId).eq("conversationId", args.conversationId)
          )
          .unique();

        if (!existingMembership) {
          const user = await ctx.db.get(userId);
          if (user) {
            // Add user to conversation members
            await ctx.db.insert("conversationMembers", {
              memberId: userId,
              conversationId: args.conversationId,
            });

            // Add system message for user joining
            await ctx.db.insert("messages", {
              senderId: userId,
              conversationId: args.conversationId,
              type: "text",
              content: [`${user.username} joined the group`],
              isEdited: false,
              isSystemMessage: true,
            });
          }
        }
      })
    );
  },
});
