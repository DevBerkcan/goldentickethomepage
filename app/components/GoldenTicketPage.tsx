"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

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

  // CONFIRMATION SCREEN - RESPONSIVE
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

  // CONTACT FORM - RESPONSIVE
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
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Vorname *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.firstName && <p className="text-red-300 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Nachname *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.lastName && <p className="text-red-300 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="E-Mail *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.email && <p className="text-red-300 text-sm">{errors.email}</p>}

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Handynummer *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.phone && <p className="text-red-300 text-sm">{errors.phone}</p>}

              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                placeholder="Straße und Hausnummer *"
                className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
              />
              {errors.street && <p className="text-red-300 text-sm">{errors.street}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    placeholder="PLZ *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Stadt *"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 focus:outline-none transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              {errors.postalCode && <p className="text-red-300 text-sm">{errors.postalCode}</p>}
              {errors.city && <p className="text-red-300 text-sm">{errors.city}</p>}

              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
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

  // HAUPTSEITE - CODE EINGABE - RESPONSIVE
  return (
    <div 
      className="min-h-screen relative flex items-center justify-center px-3 sm:px-4 py-8"
      style={{
        backgroundImage: "url('/calender-background.jpg')", 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dunkler Overlay für bessere Lesbarkeit */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* CODE EINGABE - Responsive Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto"
      >
        
        <div className="relative">
          <div className="space-y-3 sm:space-y-4">
            {/* TITLE SECTION */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-4 sm:mb-6"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-2xl">
                TIC
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 drop-shadow-2xl">
                CODE EINLÖSEN
              </h2>
            </motion.div>

            {/* CODE INPUT */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <input
                type="text"
                value={formData.ticketCode}
                onChange={(e) => {
                  setFormData({...formData, ticketCode: e.target.value.toUpperCase()});
                  setErrors({});
                }}
                placeholder="GEWINN-CODE"
                maxLength={8}
                className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] text-center bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl focus:outline-none focus:ring-3 sm:focus:ring-4 focus:ring-yellow-400/50 transition-all text-gray-900 uppercase placeholder:text-gray-400 shadow-2xl border-2 sm:border-3 md:border-4 border-yellow-400/50"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              />
              <div className="text-center mt-2 text-white text-xs sm:text-sm font-bold drop-shadow-lg">
                {formData.ticketCode.length}/8 Zeichen
              </div>
            </motion.div>

            {/* ERROR MESSAGE */}
            <AnimatePresence>
              {errors.ticketCode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/90 backdrop-blur-md text-white p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2 shadow-xl text-sm sm:text-base"
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-bold">{errors.ticketCode}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <motion.button
              onClick={handleCodeSubmit}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-black font-black py-3 sm:py-4 md:py-5 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 text-lg sm:text-xl md:text-2xl border-2 sm:border-3 md:border-4 border-yellow-300"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-2 sm:border-3 border-black border-t-transparent" />
                  Prüfe...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  CODE EINLÖSEN
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </span>
              )}
            </motion.button>

            {/* CODE HINT */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-white text-xs sm:text-sm font-bold drop-shadow-lg bg-black/40 backdrop-blur-sm py-2 px-3 sm:px-4 rounded-full inline-block mx-auto"
            >
              8-stelliger Code mit Buchstaben & Zahlen
            </motion.p>

            {/* INFO TEXT */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-white text-sm sm:text-base drop-shadow-lg bg-black/40 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl"
            >
              <p className="font-bold mb-1">IN JEDEM KALENDER STECKT DEIN GOLDENES TICKET!</p>
              <p className="text-xs sm:text-sm">
                <strong>HINTER JEDEM TÜRCHEN STECKT NICHT NUR EINE SÜßIGKEIT, SONDERN AUCH DEIN GOLDENES TICKET!</strong> KUHREL DEINE HUMMER FREI UND SEI TÄGLICH UM 20 UHR LIVE AUF TAKTOK DABEI – MIT EIN BISSCHEN GLÜCK GEHÖRT BALD EINER DER 350 GEWINNE DIR.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center z-10 px-3"
      >
        <p className="text-white text-xs sm:text-sm drop-shadow-lg bg-black/40 backdrop-blur-sm py-2 px-3 sm:px-4 rounded-full inline-block max-w-sm sm:max-w-md">
          Mit der Teilnahme stimmst du der Speicherung deiner Daten zu · 
          <a href="/datenschutz" className="underline ml-1 font-bold hover:text-yellow-300 transition-colors">
            Datenschutz
          </a>
        </p>
      </motion.div>
    </div>
  );
}