import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessageSquare, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

export default function useNavigation() {
  const pathname = usePathname();
  const requestsCount = useQuery(api.requests.count);
  const conversations = useQuery(api.conversations.get);

  const unSeenMessagesCount = useMemo(() => {
    return conversations?.reduce((acc, curr) => acc + curr.unSeenCount, 0);
  }, [conversations]);

  console.log(conversations, "ss");
  const paths = useMemo(
    () => [
      {
        name: "Conversations",
        href: "/conversations",
        icon: <MessageSquare />,
        active: pathname.startsWith("/conversations"),
        count: unSeenMessagesCount,
      },
      {
        name: "Friends",
        href: "/friends",
        icon: <Users />,
        active: pathname.startsWith("/friends"),
        count: requestsCount,
      },
    ],
    [pathname, requestsCount, unSeenMessagesCount]
  );
  return { paths };
}
