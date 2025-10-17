"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0B1220] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top: content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 md:items-center">
          {/* Left: Logo + claim + socials */}
          <div className="text-center md:text-left">
            {/* White logo badge for contrast */}
            <div className="flex items-center justify-center md:justify-start">
              <div className="relative w-28 h-16 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/10 mb-4">
                <Image
                  src="/sweets_transparency.svg"
                  alt="Sweets aus aller Welt – Logo"
                  fill
                  priority
                  className="object-contain"
                  sizes="112px"
                />
              </div>
            </div>

            <p className="text-gray-300/90 leading-relaxed mb-4">
              Egal, was du liebst – wir haben es hier. Süßes und Snacks direkt zu dir.
            </p>

            <nav aria-label="Social" className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://www.instagram.com/sweetsausallerwelt/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5 text-white/90 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.2c3.2 0 3.6.01 4.9.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.89s-.01 3.62-.07 4.89c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.9.07s-3.63-.01-4.9-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.01 15.62 2 15.24 2 12s.01-3.62.07-4.89C2.22 3.88 3.74 2.35 7 2.2 8.27 2.14 8.65 2.13 11.9 2.13h.1zM12 6.84A5.16 5.16 0 1 0 17.16 12 5.17 5.17 0 0 0 12 6.84Zm6.41-2.52a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44Z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@sweetsausallerwelt"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5 text-white/90 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.53.01h3.91c.08 1.53.63 3.1 1.75 4.18a7.7 7.7 0 0 0 4.24 1.8v4.03c-1.44-.06-2.89-.36-4.2-.98-.57-.26-1.1-.59-1.62-.93l-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94A7.88 7.88 0 0 1 6.62 23a6.98 6.98 0 0 1-4.08-1.03A7.52 7.52 0 0 1 1.5 16.2c.18-1.9 1.12-3.71 2.58-4.95 1.66-1.45 3.98-2.14 6.15-1.73 0 1.49-.04 2.97-.04 4.45a3.63 3.63 0 0 0-3.16.24 3.28 3.28 0 0 0-1.5 3.35 3.27 3.27 0 0 0 3.64 2.62c1.12 0 2.19-.66 2.77-1.61.2-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.02-4.03 0-8.05.03-12.07Z" />
                </svg>
              </a>
            </nav>
          </div>

          {/* Middle: Tagline */}
          <div className="text-center md:px-6">
            <p className="text-gray-300/90 leading-relaxed md:max-w-md mx-auto text-lg tracking-wide">
              Nasch dich um die Welt – jeder Biss ein Genuss.
            </p>
          </div>

          {/* Right: Quick links */}
          <nav className="hidden md:flex md:justify-end" aria-label="Footer links">
            <ul className="space-y-2 text-right">
              <li><a href="https://sweetsausallerwelt.de/pages/contact" className="text-gray-300/90 hover:text-white underline decoration-transparent hover:decoration-white/30 underline-offset-4 transition">Kontakt</a></li>
              <li><a href="https://sweetsausallerwelt.de/apps/track123" className="text-gray-300/90 hover:text-white underline decoration-transparent hover:decoration-white/30 underline-offset-4 transition">Sendungsverfolgung</a></li>
              <li><a href="https://sweetsausallerwelt.de/" className="text-gray-300/90 hover:text-white underline decoration-transparent hover:decoration-white/30 underline-offset-4 transition">Zum Shop</a></li>
              <li><a href="https://sweetsausallerwelt.de/pages/faq" className="text-gray-300/90 hover:text-white underline decoration-transparent hover:decoration-white/30 underline-offset-4 transition">FAQ</a></li>
            </ul>
          </nav>
        </div>

        {/* Divider + legal row */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-400">
              <a href="https://sweetsausallerwelt.de/pages/impressum" className="hover:text-white transition">Impressum</a>
              <a href="https://sweetsausallerwelt.de/pages/datenschutzerklarung" className="hover:text-white transition">Datenschutz</a>
              <a href="https://sweetsausallerwelt.de/pages/agb" className="hover:text-white transition">AGB</a>
            </div>
            <p className="text-center md:text-right text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Sweets aus aller Welt
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
