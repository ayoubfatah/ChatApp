import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
  users: {
    username?: string;
    imgUrl?: string;
  }[];
};

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {users.map((user, i) => (
        <div key={i} className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={user.imgUrl} />
            <AvatarFallback>{user.username?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex gap-1">
            <span className="text-xs text-muted-foreground">
              {user.username}
            </span>
            <span className="text-xs text-muted-foreground">is typing</span>
            <div className="flex gap-1">
              <span className="animate-bounce text-xs text-muted-foreground">
                .
              </span>
              <span className="animate-bounce delay-100 text-xs text-muted-foreground">
                .
              </span>
              <span className="animate-bounce delay-200 text-xs text-muted-foreground">
                .
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
