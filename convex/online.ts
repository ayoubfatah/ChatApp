import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

// Update user's online status
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Update the user's online status and last seen timestamp
    await ctx.db.patch(currentUser._id, {
      isOnline: args.isOnline,
      lastSeen: args.isOnline ? Date.now() : Date.now(),
    });

    return { success: true };
  },
});

// Get all online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Get all online users except the current user
    const onlineUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("isOnline"), true),
          q.neq(q.field("_id"), currentUser._id)
        )
      )
      .collect();

    return onlineUsers;
  },
});

// Get user's online status
export const getUserStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    return {
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  },
});
