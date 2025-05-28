import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const currentUser = await getAuthenticatedUser(ctx);

    // 3. Get all conversation memberships where the current user is a member
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .collect();

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
    // getting the messages with the sender details
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
