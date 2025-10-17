"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import GoldenTicketPage from "./components/GoldenTicketPage";
import Footer from "./components/Footer";

function trackEvent(eventName: any) {
  // Placeholder for analytics event tracking
  console.log(`Event tracked: ${eventName}`);
}

export default function Home() {
  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    // Newsletter Popup nach 30 Sekunden oder bei Mausverlassen anzeigen
    const timer = setTimeout(() => {
      setShowNewsletter(true);
    }, 30000);

    const handleMouseLeave = (e: { clientY: number; }) => {
      if (e.clientY <= 0) {
        setShowNewsletter(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const scrollToHero = () => {
    document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Sweets aus aller Welt - Süßigkeiten & Snacks Online kaufen</title>
        <meta
          name="description"
          content="Entdecke einzigartige Süßigkeiten aus über 30 Ländern. Von japanischen Kit-Kats bis amerikanischen Sour Patch Kids. 50.000+ zufriedene Kunden!"
        />
        <meta
          name="keywords"
          content="süßigkeiten, snacks, international, japan, usa, korea, süßes, online shop"
        />
        <meta
          property="og:title"
          content="Sweets aus aller Welt - Deine süße Reise beginnt hier"
        />
        <meta
          property="og:description"
          content="Über 50.000 zufriedene Kunden! Entdecke einzigartige Süßigkeiten aus aller Welt."
        />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <div id="hero-section">
        <GoldenTicketPage />
      </div>
      {/* Footer Komponente */}
      <Footer />
    </>
  );
}