"use client";

import { useCallback, useState } from "react";

/**
 * Upload files to Uploadthing via the /api/uploadthing endpoint.
 * Returns URLs that can be stored in the database.
 */
export function useUploadThing() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = useCallback(async (files, endpoint = "productImage") => {
    if (!files || files.length === 0) return [];

    setUploading(true);
    setProgress(0);

    try {
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("files", file);

        const res = await fetch(`/api/uploadthing?endpoint=${endpoint}`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Upload failed:", res.status, await res.text());
          continue;
        }

        const data = await res.json();
        if (data?.url) {
          results.push(data.url);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      return results;
    } catch (err) {
      console.error("Upload error:", err);
      return [];
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return { uploadFiles, uploading, progress };
}
