import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    console.log("type li kayji ", args.type);

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

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
    // creating the message
    const message = await ctx.db.insert("messages", {
      senderId: currentUser._id,
      ...args,
    });
    await ctx.db.patch(args.conversationId, { lastMessageId: message });
    return message;
  },
});
