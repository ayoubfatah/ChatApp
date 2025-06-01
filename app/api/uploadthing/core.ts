import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// ✅ Fake/mock auth function
const auth = async () => {
  return { id: "fakeUserId" }; // Replace with real logic if needed
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // First route: imageUploader
  imageUploader: f({
    image: {
      maxFileCount: 6,
    },
    video: {
      maxFileCount: 2,
    },
  })
    .middleware(async () => {
      const user = await auth();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url:", file.ufsUrl);
      return { uploadedBy: metadata.userId };
    }),

  // Second route: file
  file: f(["image", "video", "audio", "pdf"])
    .middleware(async () => {
      const user = await auth();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url:", file.ufsUrl);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
