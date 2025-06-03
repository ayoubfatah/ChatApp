"use client";
import ConversationFallback from "@/components/shared/conversation/ConversationFallback";
import ItemList from "@/components/shared/item-list/itemList";
import DesktopNav from "@/components/shared/sidebar/nav/DesktopNav";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import AddFriendDialog from "./_components/AddFriendDialog";
import Request from "./_components/Request";
import SentRequest from "./_components/SentRequest";

export default function FriendsPage() {
  const requests = useQuery(api.requests.get);

  const requestsSent = useQuery(api.requests.getSentRequests);

  return (
    <>
      <ItemList title="Friends" action={<AddFriendDialog />}>
        {requests ? (
          requests.length === 0 ? (
            <p className="w-full flex items-center justify-center">
              No friend Request found
            </p>
          ) : (
            requests.map((request) => {
              return (
                <Request
                  key={request.request._id}
                  id={request.request._id}
                  imgUrl={request.sender.imgUrl}
                  username={request.sender.username}
                  email={request.sender.email}
                />
              );
            })
          )
        ) : (
          <Loader2 className="size-4 animate-spin" />
        )}
        <div className="mt-auto w-full">
          {requestsSent && requestsSent.length > 0 && (
            <div className="w-full -translate-y-[80px] p-2 border border-card rounded-sm mt-auto">
              <h3 className="text-md font-semibold mb-3">Requests Sent:</h3>
              <div className="space-y-2">
                {requestsSent.map((request) => (
                  <SentRequest
                    key={request.request._id}
                    receiver={request.receiver}
                    request={request.request}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center ">
            <DesktopNav />
          </div>
        </div>
      </ItemList>
      <ConversationFallback />
    </>
  );
}
