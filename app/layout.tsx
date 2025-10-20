import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Ticket Gewinnspiel | Sweets aus aller Welt",
  description: "Löse dein Golden Ticket ein und gewinne tolle Preise im Wert von über €15.000! 350+ Gewinne warten auf dich.",
  keywords: "Gewinnspiel, Golden Ticket, Sweets, Süßigkeiten, Adventskalender",
  openGraph: {
    title: "Golden Ticket Gewinnspiel | Sweets aus aller Welt",
    description: "Löse dein Golden Ticket ein und gewinne tolle Preise!",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}