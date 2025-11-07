"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertCircle } from "lucide-react";
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
      className="absolute top-0 text-white/70 pointer-events-none text-xs"
      initial={{ y: -20 }}
      animate={{ y: "100vh" }}
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
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const newsletterConsentRef = useRef(false); // Speichert Newsletter-Status für Success Screen

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
        offer: "Adventskalender 2025",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "golden_ticket",
        consent: true,
        consentTs: new Date().toISOString(),
        newsletterConsent: newsletterConsent // Newsletter-Checkbox Status mitschicken
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
      newsletterConsentRef.current = newsletterConsent; // Status für Success Screen speichern

      const res = await callGoldenTicketAPI(formData);
      if (!res.ok) throw new Error("Registrierung fehlgeschlagen");

      // Golden Ticket API versendet automatisch:
      // 1. Gewinnspiel-Bestätigungsmail (IMMER)
      // 2. Newsletter-DOI-Email (wenn Checkbox aktiviert)

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
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 sm:px-4 md:px-6 py-6 sm:py-8 lg:py-12">
        {/* Vollbild-Hintergrund - Responsive: Mobile (Goldenticket_referenz.png) / Desktop (desktop_view.png) */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat">
          {/* Mobile Background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
            style={{ backgroundImage: 'url(/Goldenticket_referenz.png)' }}
          />
          {/* Desktop Background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
            style={{ backgroundImage: 'url(/desktop_view.png)' }}
          />
        </div>

        {/* Helles Overlay für bessere Lesbarkeit */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" style={{ zIndex: 5 }} />

        {/* Schneeflocken Animation */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {mounted && Array.from({length: 20}).map((_, i) => (
            <SimpleSnowflake key={i} delay={i * 0.5} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-20 text-center w-full max-w-[320px] sm:max-w-md md:max-w-lg mx-auto"
        >
          {/* Icon - #16b9da (türkis/cyan) */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl" style={{ backgroundColor: '#16b9da' }}>
            <span className="text-3xl sm:text-4xl md:text-5xl" style={{ color: '#ffffff' }}>✓</span>
          </div>

          {/* Title - #f8ab14 (orange/gold) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 px-2 drop-shadow-lg" style={{ color: '#f8ab14' }}>
            GLÜCKWUNSCH!
          </h1>

          {/* Content - #723a2b (braun) */}
          <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 px-2 drop-shadow" style={{ color: '#723a2b' }}>
            Du bist jetzt offiziell dabei! 🎫
          </p>

          {/* Info Box - #ffffff Background, #723a2b Text, #dddddd Border */}
          <div className="backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-2xl mb-4 sm:mb-6 text-sm sm:text-base space-y-2 sm:space-y-3 mx-2 shadow-xl border-2" style={{ backgroundColor: '#ffffff', color: '#723a2b', borderColor: '#dddddd' }}>
            <p className="font-bold">
              ✅ Deine Teilnahme wurde registriert
            </p>
            <p>
              📧 Du erhältst in Kürze eine Bestätigungsmail
            </p>
            <p>
              🎁 Wir benachrichtigen dich, wenn du gewonnen hast!
            </p>
            {newsletterConsentRef.current && (
              <>
                <p className="font-bold" style={{ color: '#dc2626' }}>
                  ⚠️ Wichtig: Prüfe auch deinen SPAM-Ordner und klicke auf den Bestätigungslink!
                </p>
              </>
            )}
          </div>

          {/* Button - #f8ab14 Background, #ffffff Text, Hover: #16b9da */}
          <motion.a
            href="https://sweetsausallerwelt.de"
            whileHover={{ scale: 1.05, backgroundColor: '#16b9da' }}
            whileTap={{ scale: 0.95 }}
            className="inline-block font-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all text-base sm:text-lg mx-2 shadow-xl border-2"
            style={{
              backgroundColor: '#f8ab14',
              color: '#ffffff',
              borderColor: '#f8ab14'
            }}
          >
            Zurück zum Shop
          </motion.a>
        </motion.div>
      </div>
    );
  }

  // CONTACT FORM
  if (step === "contact") {
    return (
      <div className="relative min-h-screen overflow-hidden px-3 sm:px-4 md:px-6 py-6 sm:py-8 lg:py-12">
        {/* Vollbild-Hintergrund - Responsive: Mobile (Goldenticket_referenz.png) / Desktop (desktop_view.png) */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat">
          {/* Mobile Background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
            style={{ backgroundImage: 'url(/Goldenticket_referenz.png)' }}
          />
          {/* Desktop Background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
            style={{ backgroundImage: 'url(/desktop_view.png)' }}
          />
        </div>

        {/* Schneeflocken Animation */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {mounted && Array.from({length: 20}).map((_, i) => (
            <SimpleSnowflake key={i} delay={i * 0.5} index={i} />
          ))}
        </div>

        <div className="relative z-20 max-w-[340px] sm:max-w-sm md:max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl shadow-2xl border-2"
            style={{ backgroundColor: '#ffffff', borderColor: '#dddddd' }}
          >
            <div className="p-5 sm:p-6 md:p-8 rounded-2xl">
              {/* Logo zentral */}
              <div className="flex justify-center mb-4 sm:mb-5">
                <img src="/sweets_transparency.svg" alt="Sweets Logo" className="h-12 sm:h-14 md:h-16 w-auto" />
              </div>

              <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-1" style={{ color: '#f8ab14' }}>Kontaktdaten</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#723a2b' }}>Für die Gewinnbenachrichtigung</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Vorname *"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({...formData, firstName: e.target.value});
                        setErrors({...errors, firstName: undefined});
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.firstName ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                      style={!errors.firstName ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                    />
                    {errors.firstName && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Nachname *"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({...formData, lastName: e.target.value});
                        setErrors({...errors, lastName: undefined});
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.lastName ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                      style={!errors.lastName ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                    />
                    {errors.lastName && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="E-Mail *"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      setErrors({...errors, email: undefined});
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                    style={!errors.email ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                  />
                  {errors.email && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Handynummer *"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      setErrors({...errors, phone: undefined});
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                    style={!errors.phone ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                  />
                  {errors.phone && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.phone}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Straße + Hausnummer *"
                    value={formData.street}
                    onChange={(e) => {
                      setFormData({...formData, street: e.target.value});
                      setErrors({...errors, street: undefined});
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.street ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                    style={!errors.street ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                  />
                  {errors.street && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="PLZ *"
                      value={formData.postalCode}
                      onChange={(e) => {
                        setFormData({...formData, postalCode: e.target.value});
                        setErrors({...errors, postalCode: undefined});
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.postalCode ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                      style={!errors.postalCode ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                    />
                    {errors.postalCode && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.postalCode}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Stadt *"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({...formData, city: e.target.value});
                        setErrors({...errors, city: undefined});
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.city ? 'border-red-400 bg-red-50' : 'bg-white'}`}
                      style={!errors.city ? { borderColor: '#dddddd', color: '#723a2b' } : {}}
                    />
                    {errors.city && <p className="text-red-200 text-xs sm:text-sm mt-1 ml-1">{errors.city}</p>}
                  </div>
                </div>

                {/* GEWINNSPIEL-CHECKBOX (Pflicht) */}
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2" style={{ backgroundColor: '#ffffff', borderColor: '#dddddd' }}>
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors({...errors, consent: undefined});
                    }}
                    className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5"
                    style={{ accentColor: '#16b9da' }}
                  />
                  <label htmlFor="consent" className="text-[10px] sm:text-xs leading-tight cursor-pointer" style={{ color: '#723a2b' }}>
                    Ich stimme der Verarbeitung meiner Daten zur Gewinnabwicklung zu. Hinweise in der{" "}
                    <a href="https://sweetsausallerwelt.de/datenschutz" target="_blank" className="underline hover:opacity-80 font-bold" style={{ color: '#f8ab14' }}>
                      Datenschutzerklärung
                    </a>{" "}
                    und den{" "}
                    <a href="/teilnahmebedingungen" target="_blank" className="underline hover:opacity-80 font-bold" style={{ color: '#f8ab14' }}>
                      Teilnahmebedingungen
                    </a>
                    . *
                  </label>
                </div>
                {errors.consent && <p className="text-red-600 text-xs sm:text-sm ml-1">{errors.consent}</p>}

                {/* NEWSLETTER-CHECKBOX (Optional - Rechtlich getrennt!) */}
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2" style={{ backgroundColor: '#ffffff', borderColor: '#dddddd' }}>
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5"
                    style={{ accentColor: '#16b9da' }}
                  />
                  <label htmlFor="newsletter" className="text-[10px] sm:text-xs leading-tight cursor-pointer" style={{ color: '#723a2b' }}>
                    Ja, ich möchte zusätzlich den kostenlosen Newsletter mit exklusiven Angeboten und Neuigkeiten erhalten.
                    Die Einwilligung kann jederzeit widerrufen werden. Weitere Informationen in der{" "}
                    <a href="https://sweetsausallerwelt.de/datenschutz" target="_blank" className="underline hover:opacity-80 font-bold" style={{ color: '#f8ab14' }}>
                      Datenschutzerklärung
                    </a>.
                  </label>
                </div>

                <motion.button
                  onClick={handleContactSubmit}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, backgroundColor: isLoading ? '#f8ab14' : '#16b9da' }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full font-black py-3 sm:py-4 px-4 sm:px-5 rounded-xl hover:shadow-3xl transition-all disabled:opacity-50 text-sm sm:text-base border-2"
                  style={{
                    backgroundColor: '#f8ab14',
                    color: '#ffffff',
                    borderColor: '#f8ab14'
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent" />
                      Wird gesendet...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      JETZT TEILNEHMEN
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // CODE ENTRY SCREEN (Default)
  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Vollbild-Hintergrund - Responsive: Mobile (Goldenticket_referenz.png) / Desktop (desktop_view.png) */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat">
        {/* Mobile Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: 'url(/Goldenticket_referenz.png)' }}
        />
        {/* Desktop Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
          style={{ backgroundImage: 'url(/desktop_view.png)' }}
        />
      </div>

      {/* Schneeflocken Animation */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {mounted && Array.from({length: 20}).map((_, i) => (
          <SimpleSnowflake key={i} delay={i * 0.5} index={i} />
        ))}
      </div>

      <div className="min-h-screen bg-transparent relative overflow-hidden px-3 sm:px-4 md:px-6 py-6 sm:py-8 lg:py-12">
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-6rem)]">
          {/* Überschrift */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 relative z-20 px-2"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-3 sm:mb-4"
            >
            </motion.div>
           
          </motion.div>

          {/* Container für Code-Eingabe */}
          <div className="relative w-full max-w-[380px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-end justify-center pb-4 sm:pb-6 md:pb-8 lg:pb-3" style={{ minHeight: '70vh' }}>
            {/* CODE EINGABE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-20 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[480px]"
            >
              <div className="bg-white/10 backdrop-blur-sm p-1 rounded-2xl sm:rounded-3xl shadow-2xl">
                <div className="bg-white/95 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl">
                  <div className="text-center mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-800 mb-1">Gib deinen Code ein</h2>
                    <p className="text-gray-600 text-xs sm:text-sm">8-stelliger Code</p>
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
                        className="w-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-lg sm:text-xl md:text-2xl font-mono tracking-[0.3em] sm:tracking-[0.35em] text-center border-2 border-yellow-400 bg-white rounded-xl focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all text-gray-800 uppercase placeholder:text-gray-400"
                      />
                      <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] sm:text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">
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


                    <motion.button
                      onClick={handleCodeSubmit}
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="w-full text-white font-black py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-5 md:px-6 rounded-xl hover:shadow-3xl transition-all disabled:opacity-50 text-base sm:text-lg md:text-xl"
                      style={{
                        background: 'linear-gradient(135deg, #c8941e 0%, #e6b043 50%, #c8941e 100%)'
                      }}
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

                    {/* Rechtliche Hinweise - sehr klein */}
                    <div className="text-center mt-3">
                      <p className="text-gray-500 text-[9px] sm:text-[10px] leading-tight">
                        Mit Klick auf "Code einlösen" willige ich in die Verarbeitung meiner Daten zur Gewinnabwicklung ein.<br className="hidden sm:block" />
                        <a href="https://sweetsausallerwelt.de/datenschutz" target="_blank" className="text-yellow-700 underline hover:text-yellow-800">
                          Datenschutzerklärung
                        </a>
                        {" · "}
                        <a href="/teilnahmebedingungen" target="_blank" className="text-yellow-700 underline hover:text-yellow-800">
                          Teilnahmebedingungen
                        </a>
                      </p>
                    </div>
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