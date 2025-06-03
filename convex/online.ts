import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";
import { Id } from "./_generated/dataModel";

// Update user's online status
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastSeen: args.isOnline ? undefined : Date.now(),
    });
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
      throw new Error("User not found");
    }

    return {
      isOnline: user.isOnline ?? false,
      lastSeen: user.lastSeen,
    };
  },
});
