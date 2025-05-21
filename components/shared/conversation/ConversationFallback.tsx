import { Card } from "@/components/ui/card";
import React from "react";

export default function ConversationFallback() {
  return (
    <Card className="hidden lg:flex h-full w-full p-2 items-center bg-secondary text-secondary-foreground  justify-center">
        Select/Start a conversation to get started
    </Card>
  );
}
