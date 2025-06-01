import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@radix-ui/react-dialog";
import Image from "next/image";

import React from "react";

type Props = {
  urls: string[];
};

export const ImagePreview = ({ urls }: Props) => {
  const isVideoFile = (filename: string) => {
    const videoFilePattern = /\.(mp4|webm|ogg|mov)$/i;
    return videoFilePattern.test(filename);
  };

  return (
    <div
      className={cn("grid gap-2 justify-start w-full", {
        "grid-cols-1": urls.length === 1,
        "grid-cols-2": urls.length > 1,
      })}
    >
      {urls.map((url, index) => {
        const isVideo = isVideoFile(url);
        console.log(url, "url dzb");
        return (
          <Dialog key={url + index}>
            <div
              className={cn("relative cursor-pointer w-full", {
                "max-w-full": !isVideo,
              })}
            >
              <DialogTrigger asChild>
                {isVideo ? (
                  <div className="aspect-w-16 aspect-h-9 h-full">
                    <video
                      src=""
                      poster={url}
                      className="object-cover w-full h-full rounded-md"
                    >
                      <source src={`${url}#t=0.1`} type="video/mp4" />
                    </video>
                  </div>
                ) : (
                  <div className="relative aspect-square w-[300px] max-w-[500px] mx-auto">
                    <Image
                      src={url}
                      alt="Uploaded image"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isVideo ? "Video Preview" : "Image Preview"}
                  </DialogTitle>
                </DialogHeader>
                <div className="w-full h-96 relative flex items-center justify-center">
                  {isVideo ? (
                    <video controls poster={url} className="w-full ">
                      <source src={`${url}#t=0.1`} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={url}
                      alt="Uploaded image"
                      referrerPolicy="no-referrer"
                      layout="fill"
                      objectFit="contain"
                    />
                  )}
                </div>
              </DialogContent>
            </div>
          </Dialog>
        );
      })}
    </div>
  );
};
