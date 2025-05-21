"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

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
  return <div className=""></div>;
}
