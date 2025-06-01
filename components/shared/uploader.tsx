import { UploadDropzone } from "@/lib/uploadThing";
import React from "react";
import { toast } from "sonner";
import { UploadThingError } from "uploadthing/server";

type Props = {
  onChange: (urls: string[]) => void;
  type: "imageUploader" | "file";
};

export const Uploader = ({ onChange, type }: Props) => {
  return (
    <UploadDropzone
      endpoint={type}
      onClientUploadComplete={(res) => onChange(res.map((item) => item.ufsUrl))}
      onUploadError={(error: UploadThingError) => {
        toast.error(
          error instanceof UploadThingError
            ? error.message
            : "Something Wrong Happened "
        );
      }}
    />
  );
};
