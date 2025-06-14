"use client";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import useNavigation from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import { TooltipContent } from "@radix-ui/react-tooltip";
import Link from "next/link";
import React from "react";

export default function DesktopNav() {
  const { paths } = useNavigation();

  return (
    <Card className="hidden lg:flex lg:flex-row lg:justify-between lg:items-center lg:h-16 lg:px-4 lg:py-2 mt-auto -translate-y-[40px] shadow-none bg-transparent border-none ">
      <nav>
        <ul className="flex justify-center gap-7 items-center">
          {paths.map((path, id) => {
            return (
              <li key={id} className="relative">
                <Tooltip delayDuration={400}>
                  <TooltipTrigger>
                    <Button
                      asChild
                      size="icon"
                      variant={path.active ? "default" : "outline"}
                      className="relative"
                    >
                      <Link href={path.href}>{path.icon}</Link>
                    </Button>
                    {path.count ? (
                      <Badge className="absolute rounded-full -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                        {path.count}
                      </Badge>
                    ) : null}
                  </TooltipTrigger>
                  <TooltipContent className="z-[10000] bg-popover text-popover-foreground px-3 py-2 text-sm font-medium rounded-md shadow-md border border-border">
                    {path.name}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
          <li>
            <ThemeToggle />
          </li>
          <li className="translate-y-[4px]">
            <UserButton afterSwitchSessionUrl="/" afterSignOutUrl="/" />
          </li>
        </ul>
      </nav>
    </Card>
  );
}
