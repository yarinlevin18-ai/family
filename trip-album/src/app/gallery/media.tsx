const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i;

export function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url);
}

export function Media({ url, alt }: { url: string; alt: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }
  // Plain <img>: media lives in Supabase storage, no Next image optimization needed.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />;
}
