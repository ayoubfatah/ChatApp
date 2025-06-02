import { internalMutation } from "../_generated/server";

export const updateExistingUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (user.isOnline === undefined || user.lastSeen === undefined) {
        await ctx.db.patch(user._id, {
          isOnline: false,
          lastSeen: Date.now(),
        });
      }
    }
  },
});
