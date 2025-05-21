import SidebarWrapper from "@/components/shared/sidebar/SidebarWrapper";
import React, { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
