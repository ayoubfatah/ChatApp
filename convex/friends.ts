import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const get = query({
  args: {},

  async handler(ctx) {
    // 1. Get the current user's identity from Clerk auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }
    // 2. Get the current user's details from our database using their Clerk ID
    const currentUser = await getAuthenticatedUser(ctx);

    if (!currentUser) {
      throw new ConvexError("User not found in requests");
    }
    // 3. get all friendships where current user is User1
    const friendShip1 = await ctx.db
      .query("friends")
      .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
      .collect();
    //4.  get all friendships where current user is User2
    const friendShip2 = await ctx.db
      .query("friends")
      .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
      .collect();

    const friendships = [...friendShip1, ...friendShip2];
    // getting details of each friend
    return await Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(
          friendship.user1 === currentUser._id
            ? friendship.user2
            : friendship.user1
        );
        if (!friend) {
          throw new ConvexError("friend couldn't be found");
        }
        return friend;
      })
    );
  },
});

export const createGroup = mutation({
  args: {
    members: v.array(v.id("users")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      name: args.name,
    });

    await Promise.all(
      [...args.members, currentUser._id].map(async (memberId) => {
        console.log("members", ...args.members, currentUser._id);
        await ctx.db.insert("conversationMembers", {
          memberId,
          conversationId,
        });
      })
    );
  },
});

//
//
//
//
//
export const deleteFriend = mutation({
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
