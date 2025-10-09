"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function UserInfoBadge() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) return null;

  const name = session.user.name || "User";
  const role = (session.user as any).role || "user";
  const tokens = (session.user as any).tokens;

  return (
    <div className="hidden sm:flex items-center gap-2 mr-3">
      {typeof tokens === "number" && (
        <Link href="/credits">
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            Tokens: {tokens}
          </Badge>
        </Link>
      )}
      {/* <Badge variant="outline">{role}</Badge> */}
      <span className="text-sm text-muted-foreground max-w-[140px] truncate">
        {name}
      </span>
    </div>
  );
}


