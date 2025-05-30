import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./_utils";

export const get = query({
  args: {},
  async handler(ctx) {
    const currentUser = await getAuthenticatedUser(ctx);

    // getting all requests where the current user is the receiver
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_receiver", (q) => q.eq("receiver", currentUser._id))
      .collect();

    // getting the sender of the request
    const requestsWithSender = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.sender);

        if (!sender) {
          throw new ConvexError("Request Sender not found");
        }
        return { sender, request };
      })
    );
    return requestsWithSender;
  },
});

export const getSentRequests = query({
  args: {},
  async handler(ctx) {
    const currentUser = await getAuthenticatedUser(ctx);

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_sender", (q) => q.eq("sender", currentUser._id))
      .collect();

    const requestsWithSender = await Promise.all(
      requests.map(async (request) => {
        const receiver = await ctx.db.get(request.receiver);

        if (!receiver) {
          throw new ConvexError("Request  not found");
        }
        return { receiver, request };
      })
    );
    return requestsWithSender;
  },
});

export const count = query({
  args: {},
  async handler(ctx) {
    const currentUser = await getAuthenticatedUser(ctx);

    // getting all requests where the current user is the receiver
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_receiver", (q) => q.eq("receiver", currentUser._id))
      .collect();

    // returning the number of requests
    return requests.length;
  },
});
