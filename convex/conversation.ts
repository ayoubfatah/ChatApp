import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
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
            };
          })
      );
      return { ...conversation, otherMembers, otherMember: null };
    }
  },
});


