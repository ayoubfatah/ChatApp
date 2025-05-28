import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser.email === args.email) {
      throw new ConvexError("Can't send a request to yourself");
    }
    // getting the receiver
    const receiver = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    // checking if receiver exists
    if (!receiver) {
      throw new ConvexError("user not found");
    }

    // CHECKING if both the receiver and sender didnt get the  request
    const requestAlreadySent = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", receiver._id).eq("sender", currentUser._id)
      )
      .unique();

    // throw an error if there is a request already sent
    if (requestAlreadySent) {
      throw new ConvexError("Friend Request Already Sent");
    }

    // checking if the receiver has already sent a request to the sender
    const requestAlreadyReceived = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", currentUser._id).eq("sender", receiver._id)
      )
      .unique();
    if (requestAlreadyReceived) {
      throw new ConvexError("This User already sent you a request");
    }
    // getting all friends of the sender
    const friends1 = await ctx.db
      .query("friends")
      .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
      .collect();
    const friends2 = await ctx.db
      .query("friends")
      .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
      .collect();

    if (
      friends1.some((friend) => friend.user2 === receiver._id) ||
      friends2.some((friend) => friend.user1 === receiver._id)
    ) {
      throw new ConvexError("You are already friend with this user");
    }
    // creating the request
    const request = await ctx.db.insert("requests", {
      sender: currentUser._id,
      receiver: receiver._id,
    });
    return request;
  },
});

export const deny = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // getting the request
    const request = await ctx.db.get(args.id);
    // checking if the request exists and the receiver is the current user
    if (!request || request.receiver !== currentUser._id) {
      throw new ConvexError("There was an error denying this request");
    }
    // deleting the request
    await ctx.db.delete(request._id);
  },
});

export const accept = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // getting the request
    const request = await ctx.db.get(args.id);
    // checking if the request exists and the receiver is the current user
    if (!request || request.receiver !== currentUser._id) {
      throw new ConvexError("There was an error Accepting this request");
    }
    // creating the conversation
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
    });

    // creating the friend
    await ctx.db.insert("friends", {
      user1: currentUser._id,
      user2: request.sender,
      conversationId,
    });
    // creating the friend
    await ctx.db.insert("conversationMembers", {
      memberId: currentUser._id,
      conversationId,
    });
    // creating the conversation member
    await ctx.db.insert("conversationMembers", {
      memberId: request.sender,
      conversationId,
    });
    // deleting the request
    await ctx.db.delete(request._id);
  },
});

export const deleteSentRequest = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const request = await ctx.db.get(args.id);

    await ctx.db.delete(request._id);
  },
});
