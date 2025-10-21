"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertCircle, Sparkles, Ticket } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FormData {
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface FormErrors {
  ticketCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  consent?: string;
}

const SimpleSnowflake = ({ delay, index }: { delay: number; index: number }) => {
  return (
    <motion.div
      className="absolute top-0 text-white/70 pointer-events-none text-xs sm:text-sm md:text-base"
      initial={{ 
        y: -20, 
        x: `calc(${(index * 5) % 100}vw + ${index * 10}px)` 
      }}
      animate={{ 
        y: "100vh" 
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
      style={{
        left: `${(index * 5) % 100}%`
      }}
    >
      ❄
    </motion.div>
  );
};

export default function GoldenTicketPage() {
  const [step, setStep] = useState<"code" | "contact" | "confirmation">("code");
  const [formData, setFormData] = useState<FormData>({
    ticketCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "DE"
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Auto-Focus auf Code-Eingabefeld
    if (inputRef.current && step === "code") {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [step]);

  const getUTMParameter = (param: string): string | null => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

  const callGoldenTicketAPI = async (data: any) => {
    return fetch("/api/golden-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        source: "golden_ticket",
        offer: "Adventskalender 2024",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "golden_ticket",
        consent: true,
        consentTs: new Date().toISOString()
      }),
    });
  };

  const handleCodeSubmit = async () => {
    if (isLoading || submittedRef.current) return;
    const newErrors: FormErrors = {};
    if (!formData.ticketCode) {
      newErrors.ticketCode = "Code ist erforderlich";
    } else if (!/^[A-Z0-9]{8}$/.test(formData.ticketCode)) {
      newErrors.ticketCode = "Ungültiger 8-stelliger Code";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      submittedRef.current = true;
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep("contact");
    } catch (error) {
      setErrors({ ticketCode: "Code konnte nicht überprüft werden" });
    } finally {
      setIsLoading(false);
      submittedRef.current = false;
    }
  };

  const handleContactSubmit = async () => {
    if (isLoading || submittedRef.current) return;
    const newErrors: FormErrors = {};
    if (!formData.firstName) newErrors.firstName = "Vorname erforderlich";
    if (!formData.lastName) newErrors.lastName = "Nachname erforderlich";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Gültige E-Mail erforderlich";
    }
    if (!formData.phone) newErrors.phone = "Handynummer erforderlich";
    if (!formData.street) newErrors.street = "Straße erforderlich";
    if (!formData.city) newErrors.city = "Stadt erforderlich";
    if (!formData.postalCode) newErrors.postalCode = "PLZ erforderlich";
    if (!consent) newErrors.consent = "Bitte stimme der Datenverarbeitung zu";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      submittedRef.current = true;
      const res = await callGoldenTicketAPI(formData);
      if (!res.ok) throw new Error("Registrierung fehlgeschlagen");
      setStep("confirmation");
    } catch (error) {
      setErrors({ consent: "Ein Fehler ist aufgetreten." });
    } finally {
      setIsLoading(false);
      submittedRef.current = false;
    }
  };

  // CONFIRMATION SCREEN
  if (step === "confirmation") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-3 sm:px-4 md:px-6 py-6 sm:py-8 lg:py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6">
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">✓</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-3 sm:mb-4 px-2">
            GLÜCKWUNSCH!
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-4 sm:mb-5 md:mb-6 lg:mb-8 px-2">
            Du bist jetzt offiziell dabei! 🎫
          </p>
          <div className="bg-white/10 backdrop-blur-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-white text-sm sm:text-base md:text-lg space-y-2 sm:space-y-3 mx-2">
            <p>✅ Dein Code wurde registriert</p>
            <p>📧 Bestätigung an {formData.email}</p>
            <p>🏆 350+ Gewinnchancen aktiviert</p>
            <p>⏰ Tägliche Ziehung um 20:00 Uhr auf TikTok</p>
            <p>📱 Gewinner werden per E-Mail/SMS benachrichtigt</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // CONTACT FORM
  if (step === "contact") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-3 sm:px-4 md:px-6 py-6 sm:py-8 lg:py-12">
        <div className="container mx-auto max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-2xl p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-white/20">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 text-center">
              Deine Kontaktdaten
            </h2>
            <p className="text-blue-200 text-center mb-4 sm:mb-5 md:mb-6 text-xs sm:text-sm md:text-base lg:text-lg">
              Wir senden dir eine Benachrichtigung, sobald du gewonnen hast. Trage jetzt deine Kontaktdaten ein und erhalte deinen Gewinn direkt zu dir nach Hause.
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Vorname *"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.firstName && <p className="text-red-300 text-xs sm:text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Nachname *"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.lastName && <p className="text-red-300 text-xs sm:text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="E-Mail *"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.email && <p className="text-red-300 text-xs sm:text-sm">{errors.email}</p>}

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Handynummer *"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.phone && <p className="text-red-300 text-xs sm:text-sm">{errors.phone}</p>}

              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                placeholder="Straße und Hausnummer *"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.street && <p className="text-red-300 text-xs sm:text-sm">{errors.street}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    placeholder="PLZ *"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Stadt *"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              {errors.postalCode && <p className="text-red-300 text-xs sm:text-sm">{errors.postalCode}</p>}
              {errors.city && <p className="text-red-300 text-xs sm:text-sm">{errors.city}</p>}

              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/30 text-white focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              >
                <option value="DE" className="bg-gray-900">🇩🇪 Deutschland</option>
                <option value="AT" className="bg-gray-900">🇦🇹 Österreich</option>
                <option value="CH" className="bg-gray-900">🇨🇭 Schweiz</option>
              </select>

              {/* Einwilligungs-Checkbox */}
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10">
                <label className="flex items-start gap-2 sm:gap-3 text-white text-xs sm:text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 sm:mt-1 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded flex-shrink-0"
                  />
                  <span>
                    Ich willige ein, am Gewinnspiel teilzunehmen und akzeptiere die{" "}
                    <a href="https://sweetsausallerwelt.de/datenschutz" target="_blank" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
                      Datenschutzerklärung
                    </a>{" "}
                    und{" "}
                    <a href="/teilnahmebedingungen" target="_blank" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
                      Teilnahmebedingungen
                    </a>
                    . *
                  </span>
                </label>
                {errors.consent && <p className="text-red-300 text-xs sm:text-sm mt-2">{errors.consent}</p>}
              </div>

              <motion.button
                onClick={handleContactSubmit}
                disabled={isLoading || !consent}
                whileHover={{ scale: isLoading || !consent ? 1 : 1.02 }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-black py-3 sm:py-4 rounded-lg sm:rounded-xl md:rounded-2xl disabled:opacity-50 text-sm sm:text-base md:text-lg"
              >
                {isLoading ? "Wird registriert..." : "JETZT TEILNEHMEN →"}
              </motion.button>
            </div>
          </div>

          {/* Transparenz-Info */}
          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <p className="text-blue-200 text-xs sm:text-sm">
              <strong>Wichtig:</strong> Teilnahme ab 18 Jahren, Wohnsitz D/A/CH. 
              Aktionszeitraum: 01.11.–24.12.2024. Tägliche Ziehung um 20:00 Uhr auf TikTok. 
              Gewinner werden per E-Mail/SMS benachrichtigt und müssen sich binnen 7 Tagen zurückmelden. 
              Details:{" "}
              <a href="/teilnahmebedingungen" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
                Teilnahmebedingungen
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CODE EINGABE - HAUPTSEITE
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-800 via-indigo-900 to-purple-900 overflow-visible">
      {/* Snowfall */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <SimpleSnowflake key={i} delay={i * 1.2} index={i} />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Haupttitel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6 sm:mb-10 md:mb-12 lg:mb-16"
          >
            {/* Golden Ticket - Sichtbar auf allen Geräten */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -12 }}
              animate={{ opacity: 1, x: 0, rotate: -12 }}
              transition={{ delay: 0.3 }}
              className="absolute top-1/2 -translate-y-1/2 -left-8 sm:-left-12 md:-left-14 lg:-left-20 xl:-left-28 2xl:-left-36"
            >
              <img
                src="/goldenes-ticket.png"
                alt="Golden Ticket"
                className="w-20 h-auto sm:w-28 md:w-36 lg:w-48 xl:w-56 2xl:w-64 rounded-xl sm:rounded-2xl"
              />
            </motion.div>

            {/* Textblock */}
            <div className="text-center mx-auto px-2 sm:px-4 max-w-4xl">
              <h1
                className="font-black leading-none mb-1 sm:mb-2 text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[128px]"
                style={{
                  background: "linear-gradient(to bottom, #ffd700 0%, #ffed4e 40%, #ff6b35 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 5px 10px rgba(0,0,0,0.3), 0 10px 20px rgba(255,215,0,0.4)",
                  filter: "drop-shadow(0 8px 12px rgba(255,107,53,0.5))",
                }}
              >
                350
              </h1>

              <h2
                className="font-black leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[96px]"
                style={{
                  background: "linear-gradient(to bottom, #ff6b35 0%, #ff8c42 50%, #ffd700 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                  filter: "drop-shadow(0 6px 10px rgba(255,107,53,0.4))",
                }}
              >
                GEWINNE!
              </h2>

              <p className="text-blue-100 mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                Im Wert von über <span className="text-yellow-300 font-bold">€15.000</span>
              </p>
            </div>
          </motion.div>

          {/* CODE EINGABE MIT GEWINNBILDERN */}
          <div className="relative max-w-[380px] sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto min-h-[450px] sm:min-h-[550px] md:min-h-[600px] lg:min-h-[650px] flex items-center justify-center z-10 px-4">
            
            {/* Gewinnbilder - MEHR ABSTAND zwischen den Bildern */}
            {mounted && [
              // Oben links - Airpods (WEITER NACH AUSSEN)
              { 
                img: "/airpods.png", 
                rotation: -15, 
                pos: "top-[0%] left-[-20%] sm:top-[5%] sm:left-[-10%] md:top-[8%] md:left-[-15%] lg:top-[10%] lg:left-[-25%] xl:left-[-30%] 2xl:left-[-35%]", 
                size: "w-[80px] h-[80px] sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-52 xl:h-52",
                hideOnMobile: false
              },
              // Oben rechts - Box (WEITER NACH AUSSEN)
              { 
                img: "/box.png", 
                rotation: 10, 
                pos: "top-[0%] right-[-20%] sm:top-[5%] sm:right-[-10%] md:top-[8%] md:right-[-15%] lg:top-[10%] lg:right-[-25%] xl:right-[-30%] 2xl:right-[-35%]", 
                size: "w-[80px] h-[80px] sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-52 xl:h-52",
                hideOnMobile: false
              },
              // Mitte links - HandySweets (WEITER NACH AUSSEN)
              { 
                img: "/HandySweets.png", 
                rotation: -10, 
                pos: "top-[45%] -translate-y-1/2 left-[-30%] sm:left-[-15%] md:left-[-20%] lg:left-[-30%] xl:left-[-35%] 2xl:left-[-40%]", 
                size: "w-[70px] h-[70px] sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48",
                hideOnMobile: false
              },
              // Mitte rechts - PS5 (WEITER NACH AUSSEN)
              { 
                img: "/ps5.png", 
                rotation: 12, 
                pos: "top-[45%] -translate-y-1/2 right-[-30%] sm:right-[-15%] md:right-[-20%] lg:right-[-30%] xl:right-[-35%] 2xl:right-[-40%]", 
                size: "w-[70px] h-[70px] sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48",
                hideOnMobile: false
              },
              // Unten links - Switch (WEITER NACH AUSSEN)
              { 
                img: "/switch.png", 
                rotation: -8, 
                pos: "bottom-[0%] left-[-15%] sm:bottom-[5%] sm:left-[-10%] md:bottom-[8%] md:left-[-15%] lg:bottom-[10%] lg:left-[-25%] xl:left-[-30%] 2xl:left-[-35%]", 
                size: "w-[90px] h-[90px] sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56",
                hideOnMobile: false
              },
              // Unten rechts - Social Media Workshop (WEITER NACH AUSSEN)
              { 
                img: "/social.png", 
                rotation: 10, 
                pos: "bottom-[0%] right-[-15%] sm:bottom-[5%] sm:right-[-10%] md:bottom-[8%] md:right-[-15%] lg:bottom-[10%] lg:right-[-25%] xl:right-[-30%] 2xl:right-[-35%]", 
                size: "w-[90px] h-[90px] sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56",
                hideOnMobile: false
              }
            ].map((prize, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                className={`absolute ${prize.pos} ${prize.hideOnMobile ? 'hidden sm:block' : ''}`}
                style={{ transform: `rotate(${prize.rotation}deg)`, zIndex: 5 }}
              >
                <motion.img
                  src={prize.img}
                  alt={`Gewinn ${idx + 1}`}
                  className={`${prize.size} object-contain rounded-lg sm:rounded-xl pointer-events-none`}
                  whileHover={{ scale: 1.05, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
            ))}

            {/* CODE EINGABE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-20 w-full max-w-[340px] sm:max-w-sm md:max-w-md lg:max-w-xl"
            >
              <div className="bg-gradient-to-br p-1 rounded-2xl sm:rounded-3xl shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl">
                  <div className="text-center mb-4 sm:mb-5 md:mb-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-white mb-1 sm:mb-2">Gib deinen Code ein</h2>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">8-stelliger Code</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={formData.ticketCode}
                        onChange={(e) => {
                          setFormData({...formData, ticketCode: e.target.value.toUpperCase()});
                          setErrors({});
                        }}
                        placeholder="ABC12345"
                        maxLength={8}
                        className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 lg:py-5 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-mono tracking-[0.25em] sm:tracking-[0.3em] md:tracking-[0.4em] text-center border-2 sm:border-3 md:border-4 border-yellow-400 bg-white rounded-xl sm:rounded-2xl focus:border-yellow-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-yellow-400/50 transition-all text-gray-800 uppercase placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base"
                      />
                      <div className="absolute right-2 sm:right-3 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 text-blue-600 text-[10px] sm:text-xs md:text-sm font-bold bg-blue-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                        {formData.ticketCode.length}/8
                      </div>
                    </div>

                    <AnimatePresence>
                      {errors.ticketCode && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-red-200 bg-red-500/30 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-400 text-xs sm:text-sm"
                        >
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                          <span className="font-bold">{errors.ticketCode}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Einwilligungstext unter Code-Eingabe */}
                    <div className="text-center">
                      <p className="text-blue-100 text-xs sm:text-sm">
                        Mit Klick auf Code einlösen willige ich in die Verarbeitung meiner Daten zur Gewinnabwicklung ein. 
                        Hinweise in der{" "}
                        <a href="https://sweetsausallerwelt.de/datenschutz" target="_blank" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
                          Datenschutzerklärung
                        </a>{" "}
                        und den{" "}
                        <a href="/teilnahmebedingungen" target="_blank" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
                          Teilnahmebedingungen
                        </a>
                        .
                      </p>
                    </div>

                    <motion.button
                      onClick={handleCodeSubmit}
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.03 }}
                      whileTap={{ scale: isLoading ? 1 : 0.97 }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-3.5 sm:py-4 md:py-5 px-4 sm:px-5 md:px-6 rounded-xl sm:rounded-2xl hover:shadow-3xl transition-all disabled:opacity-50 text-sm sm:text-base md:text-lg lg:text-xl"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-2 sm:border-3 border-white border-t-transparent" />
                          Prüfe Code...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                          CODE EINLÖSEN
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </span>
                      )}
                    </motion.button>

                    <p className="text-blue-100 text-center text-[11px] sm:text-xs md:text-sm mt-2 sm:mt-3 md:mt-4">
                      ✓ Kostenlos  ✓ Sicher  ✓ Garantiert
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Text mit Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-10 sm:mt-8 md:mt-10 lg:mt-12 text-blue-200 text-xs sm:text-sm"
          >
            <p className="mb-1 sm:mb-2 px-2">
              Mit der Teilnahme stimmst du der Speicherung deiner Daten zur Gewinnabwicklung zu.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}