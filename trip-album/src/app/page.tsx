"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/components/avatar";
import { Grid, Heart, ImageIcon, Play, Upload, Users, Video } from "@/components/icons";
import { Media } from "@/components/media";
import { usePhotos } from "@/lib/use-photos";

const TILT = ["-6deg", "4deg", "-3deg", "5deg", "-5deg", "3deg"];

export default function Home() {
  const { photos } = usePhotos();

  const stats = useMemo(() => {
    const list = photos ?? [];
    return {
      images: list.filter((p) => p.media_type === "image").length,
      videos: list.filter((p) => p.media_type === "video").length,
      favorites: list.filter((p) => p.is_favorite).length,
      people: new Set(list.map((p) => p.uploader_name)).size,
    };
  }, [photos]);

  const featured = useMemo(() => {
    const list = photos ?? [];
    const favs = list.filter((p) => p.is_favorite && p.media_type === "image");
    const rest = list.filter((p) => p.media_type === "image" && !p.is_favorite);
    return [...favs, ...rest].slice(0, 6);
  }, [photos]);

  const people = useMemo(
    () => [...new Set((photos ?? []).map((p) => p.uploader_name))].slice(0, 8),
    [photos]
  );

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <div className="animate-fade-up">
          <span className="chip mb-5 !bg-glow/10 !text-glow ring-glow/30">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            האלבום מתעדכן בזמן אמת
          </span>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            כל הרגעים
            <br />
            <span className="text-gradient">מהטיול שלנו</span>
            <br />
            במקום אחד.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-mist-2">
            מעלים תמונה או סרטון, וכולם רואים מיד. בלי חשבון, בלי קבוצות וואטסאפ שנדחסות, בלי
            לאבד איכות.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/upload" className="btn-primary text-base">
              <Upload width={18} height={18} />
              העלאת רגע
            </Link>
            <Link href="/gallery" className="btn-ghost text-base">
              <Grid width={18} height={18} />
              לגלריה
            </Link>
            <Link href="/slideshow" className="btn-ghost text-base">
              <Play width={18} height={18} />
              מצגת
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "תמונות", value: stats.images, icon: ImageIcon },
              { label: "סרטונים", value: stats.videos, icon: Video },
              { label: "מועדפים", value: stats.favorites, icon: Heart },
              { label: "משתתפים", value: stats.people, icon: Users },
            ].map(({ label, value, icon: Icon }, i) => (
              <div
                key={label}
                className="glass animate-fade-up rounded-2xl p-3"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <Icon width={16} height={16} className="text-glow" />
                <dd className="mt-1 text-2xl font-black tabular-nums">
                  {photos ? value : <span className="skeleton inline-block h-7 w-10 rounded-md align-middle" />}
                </dd>
                <dt className="text-xs text-mist-3">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto h-[26rem] w-full max-w-md lg:h-[30rem]">
          <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,181,71,0.22),transparent)] blur-2xl" />
          {featured.length === 0 &&
            TILT.map((tilt, i) => (
              <div
                key={i}
                className="skeleton absolute h-40 w-32 rounded-2xl shadow-2xl ring-1 ring-white/10 sm:h-48 sm:w-36"
                style={{ ...tilePosition(i), ["--tilt" as string]: tilt }}
              />
            ))}
          {featured.map((photo, i) => (
            <Link
              key={photo.id}
              href="/gallery"
              className="animate-float absolute block h-40 w-32 overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/15 transition-transform hover:!scale-110 hover:!rotate-0 sm:h-48 sm:w-36"
              style={{
                ...tilePosition(i),
                ["--tilt" as string]: TILT[i],
                animationDelay: `${i * -1.1}s`,
                zIndex: i,
              }}
            >
              <Media photo={photo} className="h-full w-full object-cover" sizes="160px" />
              {photo.is_favorite && (
                <Heart filled className="absolute end-2 top-2 text-ember drop-shadow" width={16} height={16} />
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            emoji: "⚡",
            title: "מיידי לכולם",
            text: "מישהו מעלה? זה מופיע אצל כולם באותה שנייה, בלי לרענן.",
          },
          {
            emoji: "🎬",
            title: "מצגת קולנועית",
            text: "מסך מלא, תנועה עדינה, וסרטונים שמתנגנים עד הסוף. מושלם לערב הסיכום.",
          },
          {
            emoji: "❤️",
            title: "הרגעים הכי טובים",
            text: "סמנו מועדפים, סננו לפי מי צילם, ושתפו או הורידו בלחיצה.",
          },
        ].map((f, i) => (
          <div
            key={f.title}
            className="glass animate-fade-up rounded-3xl p-6"
            style={{ animationDelay: `${300 + i * 80}ms` }}
          >
            <div className="text-3xl">{f.emoji}</div>
            <h3 className="mt-3 text-lg font-extrabold">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist-2">{f.text}</p>
          </div>
        ))}
      </section>

      {people.length > 0 && (
        <section className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div>
            <h3 className="text-lg font-extrabold">מי כבר שיתף</h3>
            <p className="text-sm text-mist-3">{stats.people} משתתפים, ורק מתחילים.</p>
          </div>
          <div className="flex -space-x-2 space-x-reverse">
            {people.map((name) => (
              <Avatar key={name} name={name} size="lg" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function tilePosition(i: number) {
  const positions = [
    { top: "4%", insetInlineStart: "8%" },
    { top: "0%", insetInlineEnd: "10%" },
    { top: "34%", insetInlineStart: "30%" },
    { top: "40%", insetInlineEnd: "0%" },
    { bottom: "2%", insetInlineStart: "4%" },
    { bottom: "6%", insetInlineEnd: "22%" },
  ];
  return positions[i % positions.length];
}
