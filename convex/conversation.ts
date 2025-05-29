import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const currentUser = await getAuthenticatedUser(ctx);

    // getting conversation details from the conversationId
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }
    // getting the memberShip of the current user in the conversation
    const memberShip = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", conversation._id)
      )
      .unique();

    if (!memberShip) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // getting all the members of the conversation
    const allConversationMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // if the conversation is not a group, we get the other member of the conversation
    if (!conversation.isGroup) {
      const otherMembership = allConversationMemberships.filter(
        (ms) => ms.memberId !== currentUser._id
      )[0];
      const otherMemberDetails = await ctx.db.get(otherMembership.memberId);

      // returning the conversation details with the other member details
      const returnData = {
        ...conversation,
        otherMember: {
          ...otherMemberDetails,
          lastSeenMessageId: otherMembership.lastSeenMessage,
        },
        otherMembers: null,
      };

      return returnData;
    } else {
      const otherMembers = await Promise.all(
        allConversationMemberships
          .filter((mship) => mship.memberId !== currentUser._id)
          .map(async (membership) => {
            const member = await ctx.db.get(membership.memberId);
            if (!member) {
              throw new ConvexError("member couldn't be found ");
            }
            return {
              username: member.username,
              lastSeenMessageId: membership.lastSeenMessage,
              _id: member._id,
            };
          })
      );
      return { ...conversation, otherMembers, otherMember: null };
    }
  },
});

export const markRead = mutation({
  args: {
    id: v.id("conversations"),
    messageId: v.id("messages"),
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

    const lastMessage = await ctx.db.get(args.messageId);
    await ctx.db.patch(memberShip._id, {
      lastSeenMessage: lastMessage ? lastMessage._id : undefined,
    });
  },
});

export const getGroupInfo = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Get all current members
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.memberId);
        return {
          username: user?.username,
          imgUrl: user?.imgUrl,
          lastSeenMessageId: member.lastSeenMessage,
        };
      })
    );

    // Only get recent leaves if it's a group conversation
    const recentLeaves = conversation.isGroup
      ? await ctx.db
          .query("groupLeaves")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", args.conversationId)
          )
          .filter((q) =>
            q.gt(q.field("leftAt"), Date.now() - 24 * 60 * 60 * 1000)
          )
          .collect()
      : [];

    return {
      members: memberDetails,
      recentLeaves: recentLeaves,
      isGroup: conversation.isGroup,
    };
  },
});

export const setTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }

    const existingStatus = await ctx.db
      .query("typingStatus")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingStatus", {
        userId: currentUser._id,
        conversationId: args.conversationId,
        isTyping: args.isTyping,
        lastTypingAt: Date.now(),
      });
    }
  },
});

export const getTypingStatus = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new ConvexError("user not found");
    }

    const typingUsers = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isTyping"), true),
          q.gt(q.field("lastTypingAt"), Date.now() - 5000) // Only show typing for last 5 seconds
        )
      )
      .collect();

    const typingUsersWithDetails = await Promise.all(
      typingUsers
        .filter((status) => status.userId !== currentUser._id) // Don't show current user
        .map(async (status) => {
          const user = await ctx.db.get(status.userId);
          return {
            username: user?.username,
            imgUrl: user?.imgUrl,
          };
        })
    );

    return typingUsersWithDetails;
  },
});
