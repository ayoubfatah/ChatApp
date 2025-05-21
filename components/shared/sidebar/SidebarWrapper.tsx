import React from "react";
import DesktopNav from "./DesktopNav";

type Props = React.PropsWithChildren<{
  name?: string;
}>;

const SidebarWrapper = ({ children }: Props) => {
  return (
    <div className="h-full w-full flex flex-col lg:flex-row p-4 gap-4">
      <main className="h-[calc(100%-80px)] lg:h-full w-full flex gap-4">
        <DesktopNav />
        {children}
      </main>
    </div>
  );
};

export default SidebarWrapper;
