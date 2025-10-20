"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Phone, Ticket, ChevronRight, Check, AlertCircle, Trophy, Sparkles } from "lucide-react";
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
  const prefersReducedMotion = useReducedMotion();
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

  const Snowflake = ({ delay, index }: { delay: number; index: number }) => (
    <motion.div
      className="absolute text-2xl pointer-events-none opacity-60"
      style={{ left: `${(index * 7) % 100}%` }}
      initial={{ y: -50 }}
      animate={{ y: 1000, rotate: 360 }}
      transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, delay, ease: "linear" }}
    >
      ❄️
    </motion.div>
  );

  // CONFIRMATION SCREEN
  if (step === "confirmation") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl mx-auto">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-green-400 mx-auto mb-6">
            <Check className="w-16 h-16 text-green-600" strokeWidth={3} />
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-4">GLÜCKWUNSCH!</h1>
          <p className="text-2xl text-white mb-8">Du bist jetzt offiziell dabei! 🎫</p>
          <div className="bg-white/20 backdrop-blur-xl p-8 rounded-3xl mb-8">
            <div className="space-y-4 text-white text-lg">
              <p>✅ Dein Code wurde registriert</p>
              <p>📧 Bestätigung an {formData.email}</p>
              <p>🏆 350+ Gewinnchancen aktiviert</p>
            </div>
          </div>
          <a href="https://tiktok.com/@sweetsausallerwelt" target="_blank" className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-2xl hover:scale-105 transition-transform">
            Jetzt auf TikTok folgen →
          </a>
        </motion.div>
      </div>
    );
  }

  // CONTACT FORM
  if (step === "contact") {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-600 px-4 py-12">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white/15 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/30">
            <h2 className="text-3xl font-black text-white mb-2 text-center">Deine Kontaktdaten</h2>
            <p className="text-blue-200 text-center mb-6">Wir senden dir eine Benachrichtigung, sobald du gewonnen hast. Trage jetzt deine Kontaktdaten ein und erhalte deinen Gewinn direkt zu dir nach Hause.</p>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Vorname *"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
                  />
                  {errors.firstName && <p className="text-red-300 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Nachname *"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
                  />
                  {errors.lastName && <p className="text-red-300 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="E-Mail *"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
              />
              {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email}</p>}

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Handynummer *"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
              />
              {errors.phone && <p className="text-red-300 text-sm mt-1">{errors.phone}</p>}

              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                placeholder="Straße und Hausnummer *"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
              />
              {errors.street && <p className="text-red-300 text-sm mt-1">{errors.street}</p>}

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  placeholder="PLZ *"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
                />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Stadt *"
                  className="col-span-2 w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white placeholder:text-white/60"
                />
              </div>

              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-blue-300 text-white"
              >
                <option value="DE">🇩🇪 Deutschland</option>
                <option value="AT">🇦🇹 Österreich</option>
                <option value="CH">🇨🇭 Schweiz</option>
              </select>

              <label className="flex items-start gap-3 text-white text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <span>Ich willige ein, am Gewinnspiel teilzunehmen und akzeptiere die Datenschutzerklärung. *</span>
              </label>
              {errors.consent && <p className="text-red-300 text-sm">{errors.consent}</p>}

              <motion.button
                onClick={handleContactSubmit}
                disabled={isLoading || !consent}
                whileHover={{ scale: isLoading || !consent ? 1 : 1.02 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-4 rounded-2xl disabled:opacity-50"
              >
                {isLoading ? "Wird registriert..." : "JETZT TEILNEHMEN →"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CODE EINGABE - HAUPTSEITE
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-600 overflow-hidden">
      {/* Snowfall */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <Snowflake key={i} delay={i * 1.2} index={i} />
          ))}
        </div>
      )}

      {/* Header mit Logo */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 py-6"
      >
        <div className="container mx-auto px-4 flex justify-center">
          <div className="bg-white rounded-3xl p-4 shadow-2xl border-4 border-blue-300">
            <img 
              src="/sweets_transparency.svg" 
              alt="Sweets aus aller Welt" 
              className="h-16 w-auto"
            />
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Golden Ticket Bild - Schräg positioniert */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotate: -15 }}
            animate={{ opacity: 1, x: 0, rotate: -12 }}
            transition={{ delay: 0.3 }}
            className="absolute left-4 md:left-12 top-32 w-48 md:w-64 hidden lg:block"
          >
            <img 
              src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400" 
              alt="Golden Ticket" 
              className="w-full rounded-2xl shadow-2xl border-4 border-yellow-400 transform rotate-[-12deg]"
            />
          </motion.div>

          {/* Haupttitel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-2 rounded-full font-bold text-lg mb-4 shadow-lg">
              <Sparkles className="w-5 h-5" />
              GOLDEN TICKET
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-2">
              350+ GEWINNE
            </h1>
            <p className="text-2xl text-blue-100">
              Im Wert von über <span className="text-yellow-300 font-bold">€15.000</span>
            </p>
          </motion.div>

          {/* CODE EINGABE - ZENTRAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white/20 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-white/40">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Ticket className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Gib deinen Code ein</h2>
                <p className="text-blue-100 text-lg">8-stelliger Code (Buchstaben & Zahlen)</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={formData.ticketCode}
                    onChange={(e) => {
                      setFormData({...formData, ticketCode: e.target.value.toUpperCase()});
                      setErrors({});
                    }}
                    placeholder="ABC12345"
                    maxLength={8}
                    className="w-full px-6 py-5 text-3xl font-mono tracking-[0.4em] text-center border-4 border-blue-300 bg-white/90 rounded-2xl focus:border-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/30 transition-all text-gray-800 uppercase placeholder:text-gray-400"
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
                  className="w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white font-black py-5 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 text-xl"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
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
          </motion.div>

          {/* GEWINNE - 4 Bilder nebeneinander */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-5xl mx-auto"
          >
            <h3 className="text-2xl font-black text-white text-center mb-6">
              Das kannst du gewinnen:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { img: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=300", name: "Nintendo Switch 2", value: "€399" },
                { img: "https://images.unsplash.com/photo-1606400082777-ef05f3c5cde2?w=300", name: "AirPods Pro", value: "3x" },
                { img: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300", name: "PlayStation 5", value: "€549" },
                { img: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300", name: "Asia Sweets Box", value: "350x" }
              ].map((prize, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border-2 border-white/30 hover:border-yellow-400 transition-all"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3">
                    <img src={prize.img} alt={prize.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white font-bold text-center text-sm mb-1">{prize.name}</h4>
                  <p className="text-yellow-300 text-center text-xs font-bold">{prize.value}</p>
                  <Trophy className="w-5 h-5 text-yellow-400 mx-auto mt-2" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12 text-blue-200 text-sm"
          >
            <p className="mb-2">Mit der Teilnahme stimmst du der Speicherung deiner Daten zur Gewinnabwicklung zu.</p>
            <a href="/datenschutz" className="text-yellow-300 underline hover:text-yellow-200 font-bold">
              Datenschutzerklärung
            </a>
          </motion.div>

        </div>
      </div>
    </div>
  );
}