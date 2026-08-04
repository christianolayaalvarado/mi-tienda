/**
 * Unified upload utility.
 * Tries Uploadthing first, falls back to Cloudinary.
 * When Cloudinary is reactivated, it works automatically.
 */

const UPLOADTHING_ENDPOINT = "/api/upload";

/**
 * Upload a file (File, Blob, or data URI) to the best available storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(fileOrDataUri, options = {}) {
  const { folder = "mi_tienda" } = options;

  // If it's already a URL, return it
  if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("http")) {
    return fileOrDataUri;
  }

  // Try Uploadthing first
  try {
    const formData = new FormData();

    if (fileOrDataUri instanceof File || fileOrDataUri instanceof Blob) {
      formData.append("files", fileOrDataUri);
    } else if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("data:")) {
      // Convert data URI to File
      const file = dataUriToFile(fileOrDataUri, `upload_${Date.now()}.jpg`);
      formData.append("files", file);
    } else {
      throw new Error("Invalid file format");
    }

    const res = await fetch(UPLOADTHING_ENDPOINT, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Uploadthing failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.urls && data.urls.length > 0) {
      return data.urls[0];
    }
  } catch (utErr) {
    console.warn("Uploadthing failed, trying Cloudinary:", utErr.message);
  }

  // Fallback: try Cloudinary (server-side)
  try {
    const dataUri = fileOrDataUri instanceof File || fileOrDataUri instanceof Blob
      ? await fileToDataUri(fileOrDataUri)
      : fileOrDataUri;

    const res = await fetch("/api/uploads/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ image: dataUri, folder }),
    });

    if (!res.ok) throw new Error(`Cloudinary failed: ${res.status}`);

    const data = await res.json();
    return data.url;
  } catch (cErr) {
    console.error("All upload methods failed:", cErr.message);
    throw new Error("No se pudo subir la imagen. Intenta de nuevo.");
  }
}

/**
 * Upload multiple files.
 */
export async function uploadImages(files, options = {}) {
  const results = [];
  for (const file of files) {
    try {
      const url = await uploadImage(file, options);
      results.push(url);
    } catch (err) {
      console.error("Error uploading file:", err.message);
    }
  }
  return results;
}

/**
 * Convert File/Blob to data URI (for Cloudinary fallback).
 */
function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert data URI to File (for Uploadthing).
 */
function dataUriToFile(dataUri, filename) {
  const arr = dataUri.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
