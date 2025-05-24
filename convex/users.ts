import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const get = query({
  args: {
    clerkId: v.string(),
  },
  async handler(ctx, args) {
    const user = await getUserByClerkId({
      ctx,
      clerkId: args.clerkId,
    });
    return user;
  },
});
