"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingLogo from "@/components/shared/LoadingLogo";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/conversations");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return <LoadingLogo />;
  }

  return null;
}
