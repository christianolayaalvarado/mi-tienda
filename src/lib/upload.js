/**
 * Upload utility with client-side compression.
 * Compresses images to fit Vercel's 4.5MB serverless limit before uploading.
 */

const UPLOAD_ENDPOINT = "/api/uploads/image";
const MAX_CLIENT_SIZE = 3.5 * 1024 * 1024; // 3.5MB safe threshold
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Compress an image file client-side using Canvas.
 * Returns a new File compressed to fit under the size limit.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_CLIENT_SIZE && file.type === "image/jpeg") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let quality = JPEG_QUALITY;
      let result;

      // Binary search for optimal quality under size limit
      let lo = 0.4, hi = quality;
      for (let i = 0; i < 6; i++) {
        quality = (lo + hi) / 2;
        result = canvas.toDataURL("image/jpeg", quality);
        const sizeBytes = Math.round((result.length * 3) / 4);
        if (sizeBytes > MAX_CLIENT_SIZE) {
          hi = quality;
        } else {
          lo = quality;
        }
      }

      result = canvas.toDataURL("image/jpeg", lo);
      const compressed = dataUriToFile(result, file.name.replace(/\.[^.]+$/, ".jpg"));
      resolve(compressed);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: send original
    };

    img.src = url;
  });
}

/**
 * Upload a file to Uploadthing via our API.
 * Compresses client-side first if needed.
 */
export async function uploadImage(fileOrDataUri, options = {}) {
  if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("http")) {
    return fileOrDataUri;
  }

  try {
    let file;
    if (fileOrDataUri instanceof File || fileOrDataUri instanceof Blob) {
      file = fileOrDataUri;
    } else if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("data:")) {
      file = dataUriToFile(fileOrDataUri, `upload_${Date.now()}.jpg`);
    } else {
      throw new Error("Invalid file format");
    }

    // Compress before upload
    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append("files", compressed);

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
