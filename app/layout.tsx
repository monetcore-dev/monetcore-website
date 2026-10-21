import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./offering.css";
import SiteFooter from "./components/SiteFooter";
import PreviewNotice from "./components/PreviewNotice";
import {
  isReviewPreview,
  isStagingContactEnabled,
  isStagingBookingEnabled,
} from "./lib/previewSafety";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const manrope = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://monetcore.dev"),

  title: {
    default:
      "Monetcore System Solutions | AI Automation & Software Development",
    template: "%s | Monetcore System Solutions",
  },

  description:
    "Monetcore System Solutions builds AI automation, custom software, intelligent business systems, and AI-powered sales solutions that help businesses operate smarter and grow.",

  applicationName: "Monetcore System Solutions",

  authors: [
    {
      name: "Monetcore System Solutions",
      url: "https://monetcore.dev",
    },
  ],

  creator: "Monetcore System Solutions",
  publisher: "Monetcore System Solutions",

  keywords: [
    "AI automation",
    "software development",
    "custom software development",
    "AI solutions",
    "business automation",
    "AI sales systems",
    "workflow automation",
    "business software",
    "AI lead automation",
    "software company Nigeria",
    "AI automation Nigeria",
    "Monetcore",
    "Monetcore System Solutions",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://monetcore.dev",
    siteName: "Monetcore System Solutions",
    title: "Monetcore System Solutions | AI Automation & Software Development",
    description:
      "Build smarter. Automate faster. Grow further. Monetcore builds AI automation, custom software, and intelligent systems for modern businesses.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monetcore System Solutions",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Monetcore System Solutions | AI Automation & Software Development",
    description:
      "Build smarter. Automate faster. Grow further. AI automation, custom software, and intelligent business systems from Monetcore.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  robots: {
    index: !isReviewPreview(),
    follow: !isReviewPreview(),

    googleBot: {
      index: !isReviewPreview(),
      follow: !isReviewPreview(),
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col ${isReviewPreview() ? "review-preview" : ""}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Monetcore System Solutions",
              url: "https://monetcore.dev",
              email: "hello@monetcore.dev",
              telephone: "+2347065880558",
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <SiteFooter />
        {isReviewPreview() ? (
          <PreviewNotice
            contactTesting={isStagingContactEnabled()}
            bookingTesting={isStagingBookingEnabled()}
          />
        ) : (
          <Analytics />
        )}
      </body>
    </html>
  );
}
