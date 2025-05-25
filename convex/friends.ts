import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const deleteFriend = mutation({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("unauthorized");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });
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
    if (!memberShips || memberShips.length !== 2) {
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
    await ctx.db.delete(friendship._id);

    // Delete all messages concurrently using Promise.al l
    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));
    await Promise.all(memberShips.map((member) => ctx.db.delete(member._id)));
  },
});
