"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import useConversation from "@/hooks/useConversation";
import useNavigation from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";

export default function MobileNav() {
  const { paths } = useNavigation();
  const { isActive } = useConversation();

  if (isActive) return null;
  return (
    <Card className="fixed bottom-4 w-[calc(100vw-32px)] flex items-center h-16 p-2 lg:hidden">
      <nav className="w-full">
        <ul className="flex justify-evenly items-center ">
          {paths.map((path, id) => {
            return (
              <li key={id} className="relative">
                <Tooltip delayDuration={400}>
                  <TooltipTrigger>
                    <Button
                      asChild
                      size="icon"
                      variant={path.active ? "default" : "outline"}
                    >
                      <Link href={path.href}>{path.icon}</Link>
                    </Button>
                    {path.count ? (
                      <Badge className="absolute  rounded-full -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
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
          <li className="">
            <ThemeToggle />
          </li>
          <li className="">
            <UserButton />
          </li>
        </ul>
      </nav>
    </Card>
  );
}
