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

    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .unique();
    if (!friendship) {
      throw new ConvexError("friendship not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .collect();

    console.log("Messages found:", messages);
    console.log("Friendship:", friendship);
    console.log("Conversation:", conversation);
    console.log("MemberShips:", memberShips);

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

    await ctx.db.delete(memberShip._id);
  },
});
