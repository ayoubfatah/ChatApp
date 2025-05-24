import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { getMessagesContent, getUserByClerkId } from "./_utils";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {},

  async handler(ctx) {
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
    const conversationMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
      .collect();
    // 4. Get all conversations from the memberships
    const conversations = await Promise.all(
      conversationMemberships?.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) {
          throw new ConvexError("conversation couldn't be found");
        }

        return conversation;
      })
    );
    // 5. For each conversation, get additional details
    return Promise.all(
      conversations.map(async (conversation) => {
        // 5a. Get all members of this conversation
        const allConversationMemberships = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        const lastMessage = await getLastMessageDetails({
          ctx,
          id: conversation.lastMessageId,
        });
        // 5b. Handle group conversations differently from direct messages
        if (conversation.isGroup) {
          // For group chats, just return the conversation
          return { conversation, lastMessage };
        } else {
          // For direct messages, find the other person in the conversation
          const otherMembership = allConversationMemberships.filter(
            (membership) => membership.memberId !== currentUser._id
          )[0];
          // Get the other user's details from the users table
          const otherMember = await ctx.db.get(otherMembership.memberId);
          return {
            conversation,
            otherMember, // Include the other user's details (username, imgUrl, etc.)
            lastMessage,
          };
        }
      })
    );
  },
});

const getLastMessageDetails = async ({
  ctx,
  id,
}: {
  ctx: QueryCtx | MutationCtx;
  id: Id<"messages"> | undefined;
}) => {
  if (!id) return null;
  const message = await ctx.db.get(id);
  if (!message) return null;
  const sender = await ctx.db.get(message.senderId);
  if (!sender) return null;
  const content = getMessagesContent(
    message.type,
    message.content as unknown as string
  );

  return { content, sender: sender.username };
};
