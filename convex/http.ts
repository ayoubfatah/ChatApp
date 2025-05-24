import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";

const validatePayLoad = async (
  req: Request
): Promise<WebhookEvent | undefined> => {
  const payload = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
  try {
    const event = webhook.verify(payload, svixHeaders) as WebhookEvent;
    return event;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return undefined;
  }
};

const handleClerkWebHook = httpAction(async (ctx, req) => {
  const event = await validatePayLoad(req);
  if (!event) {
    return new Response("Could not validate Clerk payload", {
      status: 400,
    });
  }

  switch (event.type) {
    case "user.created": {
      console.log("Creating new user:", event.data.id);
      await ctx.runMutation(internal.user.create, {
        username: `${event.data.first_name}-${event.data.last_name}`,
        clerkId: event.data.id,
        imgUrl: event.data.image_url,
        email: event.data.email_addresses[0].email_address,
      });
      break;
    }
    case "user.updated": {
      console.log("Creating/Updating User:", event.data.id);
      await ctx.runMutation(internal.user.create, {
        username: `${event.data.first_name}-${event.data.last_name}`,
        clerkId: event.data.id,
        imgUrl: event.data.image_url,
        email: event.data.email_addresses[0].email_address,
      });
      break;
    }
    case "user.deleted": {
      if (!event.data.id) {
        console.error("No user ID provided in delete event");
        return new Response("No user ID provided", { status: 400 });
      }
      console.log("Deleting User:", event.data.id);
      await ctx.runMutation(internal.user.remove, {
        clerkId: event.data.id,
      });
      break;
    }
    default: {
      console.log("Clerk webhook event not supported:", event.type);
    }
  }
  return new Response(null, {
    status: 200,
  });
});


const http = httpRouter();
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: handleClerkWebHook,
});

export default http;
