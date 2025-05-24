import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useUser as useClerkUser } from "@clerk/nextjs";

export default function useUser() {
  const { user: clerkUser } = useClerkUser();
  const user = useQuery(api.users.get, { clerkId: clerkUser?.id });
  return user;
}
