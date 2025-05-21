import SidebarWrapper from "@/components/shared/sidebar/SidebarWrapper";
import React, { ReactNode } from "react";

export default function ConversationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
