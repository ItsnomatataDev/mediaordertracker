"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the photo");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Could not save the photo"))),
      "image/jpeg",
      0.72,
    );
  });
  return blob;
}

export function PackagePhotos({
  jobId,
  photos,
  token,
}: {
  jobId: string;
  photos: { id: string }[];
  token?: string;
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setPending(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Use the camera or a photo from the library.");
          continue;
        }
        const blob = await compressImage(file);
        const body = new FormData();
        body.append("photo", blob, "buyer.jpg");
        const response = await fetch(`/api/packages/${jobId}/photos`, {
          method: "POST",
          credentials: "include",
          body,
        });
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          setError(data?.error || "Could not save the photo");
          break;
        }
      }
      router.refresh();
    } catch {
      setError("Could not save the photo. Try again.");
    } finally {
      setPending(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (libraryRef.current) libraryRef.current.value = "";
    }
  }

  async function remove(photoId: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/packages/${jobId}/photos/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Could not remove the photo");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove the photo.");
    } finally {
      setPending(false);
    }
  }

  function src(photoId: string) {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return `/api/photos/${photoId}${query}`;
  }

  return (
    <div className="space-y-4">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => upload(event.currentTarget.files)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => upload(event.currentTarget.files)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => cameraRef.current?.click()}
        >
          {pending ? "Saving…" : "Take photo"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pending}
          onClick={() => libraryRef.current?.click()}
        >
          Add from library
        </button>
      </div>
      {error ? <p className="notice notice-error">{error}</p> : null}
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="border border-line bg-white">
              <img src={src(photo.id)} alt="Buyer photo" className="aspect-square w-full object-cover" />
              <button
                type="button"
                className="btn btn-ghost w-full rounded-none border-0 border-t border-line text-xs"
                disabled={pending}
                onClick={() => remove(photo.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No buyer photos yet. Take them here at the desk.</p>
      )}
    </div>
  );
}
