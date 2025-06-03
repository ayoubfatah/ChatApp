import React from "react";

export default function CallRoomProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div id="call_room_portal">{children}</div>;
}
