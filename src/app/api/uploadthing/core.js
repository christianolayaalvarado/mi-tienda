import { createUploadthing } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .input(z.object({ storeId: z.string().optional() }))
    .middleware(async ({ input }) => {
      return { storeId: input.storeId || "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name, size: file.size };
    }),
};
