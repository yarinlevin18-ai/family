import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Trip Album</h1>
      <p className="max-w-md text-zinc-600">
        Share photos and videos from the trip. No account needed.
      </p>
      <div className="flex gap-4">
        <Link
          href="/upload"
          className="rounded-md bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700"
        >
          Upload
        </Link>
        <Link
          href="/gallery"
          className="rounded-md border border-zinc-300 bg-white px-5 py-2 hover:bg-zinc-100"
        >
          Gallery
        </Link>
      </div>
    </div>
  );
}
