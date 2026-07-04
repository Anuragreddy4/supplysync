import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Supply Sync — Smarter Sourcing, Simplified",
  description: "B2B marketplace connecting small business buyers with local suppliers. Live stock, fair pricing, direct sourcing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-surface-base min-h-screen text-body`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
