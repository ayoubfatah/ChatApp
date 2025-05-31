import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { getMessagesContent, getAuthenticatedUser } from "./_utils";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {},

  async handler(ctx) {
    const currentUser = await getAuthenticatedUser(ctx);

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
      conversations.map(async (conversation, index) => {
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

        const lastSeenMessage = conversationMemberships[index].lastSeenMessage
          ? await ctx.db.get(conversationMemberships[index].lastSeenMessage!)
          : null;

        const lastSeenMessageTime = lastSeenMessage
          ? lastSeenMessage._creationTime
          : -1;

        const unSeenMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .filter((q) => q.gt(q.field("_creationTime"), lastSeenMessageTime))
          .filter((q) => q.neq(q.field("senderId"), currentUser._id))
          .collect();

        // 5b. Handle group conversations differently from direct messages
        if (conversation.isGroup) {
          // For group chats, just return the conversation
          return {
            conversation,
            lastMessage,
            unSeenCount: unSeenMessages.length,
          };
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
            unSeenCount: unSeenMessages.length,
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

  return {
    content,
    sender: sender.username,
    _creationTime: message._creationTime,
  };
};
