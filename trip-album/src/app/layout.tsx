import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ToastProvider } from "@/components/toast";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "האלבום שלנו",
    template: "%s · האלבום שלנו",
  },
  description: "אלבום תמונות וסרטונים משותף מהטיול. בלי חשבון, בלי סיבוכים.",
  openGraph: {
    title: "האלבום שלנו",
    description: "כל הרגעים מהטיול, במקום אחד.",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">
            {children}
          </main>
          <footer className="px-4 pb-6 text-center text-xs text-mist-3">
            נבנה באהבה לטיול שלנו · כל התמונות נשמרות בענן
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
