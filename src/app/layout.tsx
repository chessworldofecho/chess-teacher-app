import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Teacher App",
  description: "Learn chess with an AI teacher – lessons, daily tasks & interactive board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
