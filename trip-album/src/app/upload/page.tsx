"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; url: string }
  | { kind: "error"; message: string };

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function UploadPage() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const uploaderName = name.trim();
    if (!uploaderName || !file) return;

    setStatus({ kind: "uploading" });

    const path = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setStatus({ kind: "error", message: uploadError.message });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

    const { error: insertError } = await supabase
      .from("photos")
      .insert({ uploader_name: uploaderName, url: publicUrl });

    if (insertError) {
      setStatus({ kind: "error", message: insertError.message });
      return;
    }

    setStatus({ kind: "done", url: publicUrl });
    setFile(null);
    (e.target as HTMLFormElement).reset();
  }

  const busy = status.kind === "uploading";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Upload</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Your name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
            placeholder="e.g. Dana"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Photo or video
          <input
            type="file"
            required
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1 file:text-white"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !name.trim() || !file}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      {status.kind === "error" && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Upload failed: {status.message}
        </p>
      )}

      {status.kind === "done" && (
        <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          Uploaded.{" "}
          <Link href="/gallery" className="underline">
            View gallery
          </Link>
        </p>
      )}
    </div>
  );
}
