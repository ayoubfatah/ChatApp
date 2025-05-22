import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    // 1. Get the current user's identity from Clerk auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // 2. Get the current user's details from our database using their Clerk ID
    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found in requests");
    }

    // 3. Get all conversation memberships where the current user is a member

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .collect();

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
    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const messageSender = await ctx.db.get(message.senderId);
        if (!messageSender) {
          throw new ConvexError("Couldn't find sender of message");
        }
        return {
          message,
          senderImage: messageSender.imgUrl,
          senderName: messageSender.username,
          isCurrentUser: messageSender._id === currentUser._id,
        };
      })
    );
    return messagesWithUsers;
  },
});
