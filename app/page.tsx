"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import LoadingLogo from "@/components/shared/LoadingLogo";

export default function Home() {
  return (
    <>
      <Authenticated>
        <div className="w-full py-4 flex justify-around items-center">
          <UserButton />
          <Content />
        </div>
      </Authenticated>
      <AuthLoading>
        <LoadingLogo />
      </AuthLoading>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  const messages = useQuery(api.messages.getForCurrentUser);
  return <div className="">Authenticated content: {messages?.length}</div>;
}
