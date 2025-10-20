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

/** Snowflake – nutzt window erst nach Mount (kein SSR-Fehler) */
const Snowflake = ({ delay, index }: { delay: number; index: number }) => {
  const [vh, setVh] = useState<number | null>(null);

  useEffect(() => {
    setVh(window.innerHeight);
  }, []);

  if (vh === null) return null;

  // leichte Zufallsverteilung in X-Richtung über left%
  const leftPercent = ((index * 5) + Math.random() * 5) % 100;

  return (
    <motion.div
      className="absolute top-0 text-white/70"
      initial={{ y: -20 }}
      animate={{ y: vh + 20 }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
      style={{ left: `${leftPercent}%` }}
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
    country: "DE",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const submittedRef = useRef(false);

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
        consentTs: new Date().toISOString(),
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
    if (!consent) newErrors.consent = "Bitte stimme zu";
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

  /** CONFIRMATION SCREEN */
  if (step === "confirmation") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center w-full max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
            <span className="text-4xl sm:text-5xl md:text-6xl">✓</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 px-2">
            GLÜCKWUNSCH!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 px-2">
            Du bist jetzt offiziell dabei! 🎫
          </p>
          <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 text-white text-base sm:text-lg space-y-2 sm:space-y-3 mx-2">
            <p>✅ Dein Code wurde registriert</p>
            <p>📧 Bestätigung an {formData.email}</p>
            <p>🏆 350+ Gewinnchancen aktiviert</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /** CONTACT FORM */
  if (step === "contact") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-3 sm:px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-2xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/20">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center">
              Deine Kontaktdaten
            </h2>
            <p className="text-blue-200 text-center mb-4 sm:mb-6 text-sm sm:text-base">
              Wir senden dir eine Benachrichtigung, sobald du gewonnen hast. Trage jetzt deine Kontaktdaten ein und erhalte deinen Gewinn direkt zu dir nach Hause.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Vorname *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.firstName && <p className="text-red-300 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nachname *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.lastName && <p className="text-red-300 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="E-Mail *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.email && <p className="text-red-300 text-sm">{errors.email}</p>}

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Handynummer *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.phone && <p className="text-red-300 text-sm">{errors.phone}</p>}

              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Straße und Hausnummer *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.street && <p className="text-red-300 text-sm">{errors.street}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="PLZ *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Stadt *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              {errors.postalCode && <p className="text-red-300 text-sm">{errors.postalCode}</p>}
              {errors.city && <p className="text-red-300 text-sm">{errors.city}</p>}

              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              >
                <option value="DE" className="bg-gray-900">🇩🇪 Deutschland</option>
                <option value="AT" className="bg-gray-900">🇦🇹 Österreich</option>
                <option value="CH" className="bg-gray-900">🇨🇭 Schweiz</option>
              </select>

              <label className="flex items-start gap-2 sm:gap-3 text-white text-xs sm:text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0"
                />
                <span>Ich willige ein, am Gewinnspiel teilzunehmen und akzeptiere die Datenschutzerklärung. *</span>
              </label>
              {errors.consent && <p className="text-red-300 text-sm">{errors.consent}</p>}

              <motion.button
                onClick={handleContactSubmit}
                disabled={isLoading || !consent}
                whileHover={{ scale: isLoading || !consent ? 1 : 1.02 }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl disabled:opacity-50 shadow-2xl text-base sm:text-lg"
              >
                {isLoading ? "Wird registriert..." : "JETZT TEILNEHMEN →"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /** CODE EINGABE – HAUPTSEITE */
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-800 via-indigo-900 to-purple-900 overflow-visible">
      {/* Snowfall */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Snowflake key={i} delay={i * 1.2} index={i} />
        ))}
      </div>

      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Haupttitel mit Golden Ticket – RESPONSIVE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 md:mb-12"
          >
            {/* Golden Ticket: oben auf Mobile, links auf Desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="
                block mx-auto mb-6 w-32
                sm:w-40 sm:mb-8
                lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:w-60 lg:mb-0
                lg:-left-16 xl:-left-20 xl:w-72 2xl:-left-28 2xl:w-80
                lg:-rotate-12
              "
            >
              <img
                src="/goldenes ticket.png"
                alt="Golden Ticket"
                className="w-full h-auto rounded-xl lg:rounded-2xl"
              />
            </motion.div>

            {/* Textblock */}
            <div className="text-center mx-auto px-4 max-w-4xl">
              <h1
                className="font-black leading-none mb-1 sm:mb-2
                           text-[42px] sm:text-[64px] md:text-[96px] lg:text-[128px]"
                style={{
                  background:
                    "linear-gradient(to bottom, #ffd700 0%, #ffed4e 40%, #ff6b35 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow:
                    "0 5px 10px rgba(0,0,0,0.3), 0 10px 20px rgba(255,215,0,0.4)",
                  filter: "drop-shadow(0 8px 12px rgba(255,107,53,0.5))",
                }}
              >
                350
              </h1>

              <h2
                className="font-black leading-tight
                           text-[32px] sm:text-[52px] md:text-[72px] lg:text-[96px]"
                style={{
                  background:
                    "linear-gradient(to bottom, #ff6b35 0%, #ff8c42 50%, #ffd700 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                  filter: "drop-shadow(0 6px 10px rgba(255,107,53,0.4))",
                }}
              >
                GEWINNE!
              </h2>

              <p className="text-blue-100 mt-2 sm:mt-3 md:mt-4 text-base sm:text-lg md:text-2xl lg:text-3xl">
                Im Wert von über <span className="text-yellow-300 font-bold">€15.000</span>
              </p>
            </div>
          </motion.div>

          {/* CODE EINGABE ZENTRAL MIT KREISFÖRMIGEN BILDERN */}
          <div className="relative max-w-4xl mx-auto min-h-[600px] flex items-center justify-center z-10">
            {/* 6 Gewinnbilder im Kreis angeordnet – ALLE VERGRÖSSERT */}
            {[
              {
                img: "/box.png",
                rotation: -15,
                pos: "top-[-30px] left-[4%]",
                size: "w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80",
              },
              {
                img: "/ps5.png",
                rotation: 8,
                pos: "top-[-46px] right-[8%]",
                size: "w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80",
              },
              {
                img: "/HandySweets.png",
                rotation: -10,
                pos: "top-1/3 right-[-9%]",
                size: "w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80",
              },
              {
                img: "/social.png",
                rotation: 12,
                pos: "bottom-[-140px] right-[10%]",
                size: "w-80 h-80 lg:w-96 lg:h-96 xl:w-[30rem] xl:h-[30rem]",
              },
              {
                img: "/airpods.png",
                rotation: -8,
                pos: "bottom-[-140px] left-[16%]",
                size: "w-80 h-80 lg:w-96 lg:h-96 xl:w-[30rem] xl:h-[30rem]",
              },
              {
                img: "/switch.png",
                rotation: 15,
                pos: "top-1/3 left-[-6%]",
                size: "w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80",
              },
            ].map((prize, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                className={`absolute ${prize.pos} hidden md:block z-30 pointer-events-none`}
                style={{ transform: `rotate(${prize.rotation}deg)` }}
              >
                <motion.img
                  src={prize.img}
                  alt={`Gewinn ${idx + 1}`}
                  className={`${prize.size} object-contain rounded-xl`}
                  whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
            ))}

            {/* CODE EINGABE - ZENTRAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-20 w-full max-w-xl"
            >
              <div className="bg-gradient-to-br p-1 rounded-3xl shadow-2xl">
                <div className="p-8 md:p-10 rounded-3xl">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-black text-white mb-2">Gib deinen Code ein</h2>
                    <p className="text-blue-100 text-lg">8-stelliger Code</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.ticketCode}
                        onChange={(e) => {
                          setFormData({ ...formData, ticketCode: e.target.value.toUpperCase() });
                          setErrors({});
                        }}
                        placeholder="ABC12345"
                        maxLength={8}
                        className="w-full px-6 py-5 text-3xl font-mono tracking-[0.4em] text-center border-4 border-yellow-400 bg-white rounded-2xl focus:border-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 transition-all text-gray-800 uppercase placeholder:text-gray-400"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 text-lg font-bold">
                        {formData.ticketCode.length}/8
                      </div>
                    </div>

                    <AnimatePresence>
                      {errors.ticketCode && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-red-200 bg-red-500/30 p-4 rounded-xl border-2 border-red-400"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-bold">{errors.ticketCode}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      onClick={handleCodeSubmit}
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.03 }}
                      whileTap={{ scale: isLoading ? 1 : 0.97 }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-5 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 text-xl"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                          Prüfe Code...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          CODE EINLÖSEN
                          <ChevronRight className="w-6 h-6" />
                        </span>
                      )}
                    </motion.button>

                    <p className="text-blue-100 text-center text-sm mt-4">
                      ✓ Kostenlos  ✓ Sicher  ✓ Garantiert
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12 text-blue-200 text-sm"
          >
            <p className="mb-2">
              Mit der Teilnahme stimmst du der Speicherung deiner Daten zur Gewinnabwicklung zu.
            </p>
            <a href="/datenschutz" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
              Datenschutzerklärung
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
