/**
 * Unified upload utility using Uploadthing.
 */

const UPLOAD_ENDPOINT = "/api/uploads/image";

/**
 * Upload a file (File, Blob, or data URI) to Uploadthing.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(fileOrDataUri, options = {}) {
  if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("http")) {
    return fileOrDataUri;
  }

  try {
    const formData = new FormData();

    if (fileOrDataUri instanceof File || fileOrDataUri instanceof Blob) {
      formData.append("files", fileOrDataUri);
    } else if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("data:")) {
      const file = dataUriToFile(fileOrDataUri, `upload_${Date.now()}.jpg`);
      formData.append("files", file);
    } else {
      throw new Error("Invalid file format");
    }

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.url) return data.url;
    if (data.urls && data.urls.length > 0) return data.urls[0];
    throw new Error("No URL returned");
  } catch (err) {
    console.error("Upload failed:", err.message);
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

function dataUriToFile(dataUri, filename) {
  const arr = dataUri.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
