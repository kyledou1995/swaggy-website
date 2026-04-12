import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swaggy — Sourcing Made Simple for Ecommerce Brands",
  description:
    "We handle your product sourcing, design, quality control, and shipping so you can focus on growing your brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
