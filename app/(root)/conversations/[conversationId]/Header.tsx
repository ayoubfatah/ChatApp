import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CircleArrowLeft, MoreVertical, User } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  imgUrl?: string;
  name: string;
};

export default function Header({ imgUrl, name }: HeaderProps) {
  return (
    <Card className="w-full flex   items-center  p-2 justify-betweens r">
      <div className="flex  w-full items-center gap-2">
        <Link href={"/conversations"} className="block lg:hidden ">
          <CircleArrowLeft />
        </Link>
        <Avatar className="size-8">
          <AvatarImage src={imgUrl} />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{name}</h2>
        <div className="ml-auto">
          <MoreVertical className="size-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
