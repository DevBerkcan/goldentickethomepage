"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail, User, MapPin, Phone, Ticket, ChevronRight, ChevronLeft, Gift, Trophy, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";

// TypeScript Interfaces
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

interface WindowSize {
  width: number;
  height: number;
}

interface CodeFormData {
  ticketCode: string;
}

// Kombiniertes Interface für Kontakt UND Adressdaten
interface ContactAndAddressFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Platzhalter-Funktionen für Tracking
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  console.log(`Event tracked: ${eventName}`, params);
};

class FunnelTracker {
  trackEmailCapture(email: string) {
    console.log(`Email captured: ${email}`);
  }
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
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const submittedRef = useRef(false);
  const [windowSize, setWindowSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Forms für jeden Schritt
  const codeForm = useForm<CodeFormData>({ mode: "onSubmit", reValidateMode: "onBlur" });
  const contactForm = useForm<ContactAndAddressFormData>({ mode: "onSubmit", reValidateMode: "onBlur" });

  const funnel = useMemo(() => new FunnelTracker(), []);

  const getUTMParameter = (param: string): string | null => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

  // API Call für Golden Ticket
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
        statusIfNew: "subscribed",
        consent: true,
        consentTs: new Date().toISOString()
      }),
    });
  };

  // STEP 1: Code-Eingabe
  const onSubmitCode: SubmitHandler<CodeFormData> = async (data) => {
    if (isLoading || submittedRef.current) return;
    setIsLoading(true);

    try {
      submittedRef.current = true;
      trackEvent("golden_ticket_code_submitted", { 
        source: "golden_ticket_landing",
        code: data.ticketCode 
      });

      // Code-Validierung (8-stellig alphanumerisch)
      if (!/^[A-Z0-9]{8}$/.test(data.ticketCode)) {
        throw new Error("Ungültiger Code. Bitte überprüfe deinen 8-stelligen Code.");
      }

      setFormData(prev => ({ ...prev, ticketCode: data.ticketCode }));
      setStep("contact");
      submittedRef.current = false;

      trackEvent("golden_ticket_code_valid", { code: data.ticketCode });
    } catch (error) {
      console.error("Code validation error:", error);
      trackEvent("form_error", { 
        type: "golden_ticket_code", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
      submittedRef.current = false;
      codeForm.setError("ticketCode", { 
        message: error instanceof Error ? error.message : "Unbekannter Fehler" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Kontaktdaten & Adresse in EINEM Schritt
  const onSubmitContact: SubmitHandler<ContactAndAddressFormData> = async (contactData) => {
    if (isLoading || submittedRef.current) return;
    
    // Consent Validierung
    setConsentError("");
    if (!consent) {
      setConsentError("Bitte stimme der Datenschutzerklärung zu.");
      return;
    }

    setIsLoading(true);

    try {
      submittedRef.current = true;
      trackEvent("golden_ticket_contact_submitted", { 
        source: "golden_ticket_landing" 
      });

      // Alle Daten sammeln
      const allData = {
        ...contactData,
        ticketCode: formData.ticketCode
      };

      setFormData(prev => ({
        ...prev,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        street: contactData.street,
        city: contactData.city,
        postalCode: contactData.postalCode,
        country: contactData.country
      }));

      const res = await callGoldenTicketAPI(allData);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      setStep("confirmation");
      submittedRef.current = false;
      trackEvent("golden_ticket_complete", { 
        method: "golden_ticket",
        address_provided: !!(contactData.street && contactData.city && contactData.postalCode)
      });

    } catch (error) {
      console.error("Contact submission error:", error);
      trackEvent("form_error", { 
        type: "golden_ticket_contact",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      submittedRef.current = false;
      
      // Fehler anzeigen
      if (error instanceof Error) {
        console.error("Submission error:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCode = () => {
    setStep("code");
  };

  // STEP 3: Bestätigungsseite
  if (step === "confirmation") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 px-4 py-8">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Goldene Konfetti-Animation */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ 
                  x: Math.random() * windowSize.width, 
                  y: -50,
                  rotate: 0
                }}
                animate={{ 
                  y: windowSize.height + 50,
                  rotate: 360,
                  x: `+=${Math.sin(i) * 200}`
                }}
                transition={{ 
                  duration: 8 + Math.random() * 5, 
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear"
                }}
              >
                {i % 3 === 0 ? "🎉" : i % 3 === 1 ? "🎊" : "✨"}
              </motion.div>
            ))}
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center max-w-2xl mx-auto relative z-10"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className="text-8xl mb-8"
          >
            🎫
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent drop-shadow-lg">
              GLÜCKWUNSCH!
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-white mb-8 font-bold">
            Dein <span className="text-yellow-300">GOLDENES TICKET</span> ist aktiviert!
          </p>

          <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-2 border-yellow-400 mb-8">
            <p className="text-xl text-white mb-4">
              🥳 <strong>Du bist beim großen Gewinnspiel dabei!</strong>
            </p>
            <p className="text-lg text-yellow-200 mb-2">
              Ab 1. Dezember: Täglich Live-Verlosungen auf TikTok um 20 Uhr
            </p>
            <p className="text-white/90 mb-4">
              Wir informieren dich automatisch per WhatsApp oder E-Mail, falls du gewinnst!
            </p>
            <p className="text-sm text-yellow-300">
              Deine Teilnahmebestätigung wurde an {formData.email} gesendet
            </p>
          </div>

          <motion.a
            href="https://tiktok.com/@sweetsausallerwelt"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 bg-black text-white font-bold py-4 px-8 rounded-xl hover:bg-gray-900 transition-all text-lg mb-6"
          >
            <span className="text-xl">🎥</span>
            Folge uns auf TikTok
            <ChevronRight className="w-5 h-5" />
          </motion.a>

          {/* Gewinne Galerie */}
          <div className="mt-8">
            <h3 className="text-white text-lg font-bold mb-4">Tägliche Gewinne im Advent:</h3>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {["Asia-Box 🍣", "USA-Box 🇺🇸", "Bestseller-Box ⭐", "Exklusive Snacks 🎁", "Gutscheine 💰", "Special Editions 🔥"].map((prize, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
                >
                  {prize}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      {/* Goldener Weihnachts-Hintergrund */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 via-orange-500 to-red-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Cpath d=\'M50 20L60 40L80 45L65 60L70 80L50 70L30 80L35 60L20 45L40 40Z\' fill=\'white\' opacity=\'0.1\'/%3E%3C/svg%3E')] opacity-30"></div>
      </div>

      {/* Schnee-Animation */}
      {!prefersReducedMotion && windowSize.width > 0 && windowSize.height > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ 
                x: Math.random() * windowSize.width, 
                y: -50 
              }}
              animate={{ 
                y: windowSize.height + 50,
                x: `+=${Math.sin(i) * 100}`
              }}
              transition={{ 
                duration: 10 + Math.random() * 10, 
                repeat: Infinity,
                delay: i * 1,
                ease: "linear"
              }}
            >
              ❄️
            </motion.div>
          ))}
        </div>
      )}

      <div className="container mx-auto text-center relative z-10 max-w-6xl">
        
        {/* SEITE 1: Code-Eingabe */}
        {step === "code" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-2 gap-8 items-center"
          >
            {/* Linke Seite - Ticket Visual */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              {/* Logo und Header */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <Image
                    src="/sweeetts.svg"
                    alt="Sweets aus aller Welt"
                    fill
                    priority
                    className="object-contain drop-shadow-lg"
                    sizes="(max-width: 768px) 96px, 96px"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                  <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                    GOLDENES TICKET
                  </span>
                </h1>
                <p className="text-yellow-200 text-lg">Adventskalender Gewinnspiel 2024</p>
              </div>

              {/* Golden Ticket Visual */}
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 p-8 rounded-3xl shadow-2xl border-4 border-yellow-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'2\' fill=\'white\' opacity=\'0.3\'/%3E%3C/svg%3E')] opacity-20"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-yellow-700" />
                    <h2 className="text-3xl font-black text-yellow-900 mb-2">GOLDEN TICKET</h2>
                    <p className="text-yellow-800 font-semibold">Adventskalender 2024</p>
                  </div>
                  
                  <div className="bg-white/90 rounded-xl p-4 mb-4">
                    <p className="text-gray-800 text-sm font-medium text-center">
                      🎫 Willkommen zu deinem GOLDENEN TICKET!<br/>
                      Gib hier deinen 8-stelligen Code ein, um am großen Gewinnspiel teilzunehmen und einer von über 350 Gewinnern zu werden.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-yellow-800 text-yellow-100 font-mono text-lg tracking-widest py-3 rounded-lg mb-4">
                      ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Jeden Tag werden mehr als 10 Gewinne live auf TikTok verlost – sei dabei!
                    </p>
                  </div>
                </div>
              </div>

              {/* Gewinn-Übersicht */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold text-xl mb-4 flex items-center justify-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  ÜBER 350 GEWINNE
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span><strong>Nintendo Switch 2</strong> - Hauptgewinn</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span><strong>PlayStation 5</strong> - 2. Preis</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span><strong>AirPods Pro</strong> - 3x zu gewinnen</span>
                  </div>
                  <div className="flex items-center gap-3 text-yellow-300">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span><strong>350x Asia Sweets Boxen</strong> - Tägliche Gewinne</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rechte Seite - Code Formular */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.3, duration: 0.7 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30">
                <div className="text-center mb-6">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 p-3 rounded-full mb-4">
                    <Ticket className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Code eingeben & gewinnen!
                  </h3>
                  <p className="text-yellow-300">
                    Gib deinen 8-stelligen Code vom Goldenen Ticket ein
                  </p>
                </div>
                
                <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Dein 8-stelliger Code (z.B. A1B2C3D4)"
                        {...codeForm.register("ticketCode", {
                          required: "Code ist erforderlich",
                          pattern: {
                            value: /^[A-Z0-9]{8}$/,
                            message: "Bitte gib einen gültigen 8-stelligen Code ein"
                          }
                        })}
                        className="w-full pl-12 pr-6 py-4 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white font-mono text-center tracking-widest uppercase"
                        maxLength={8}
                        style={{ letterSpacing: '0.2em' }}
                      />
                    </div>
                    {codeForm.formState.errors.ticketCode && (
                      <p className="text-red-400 text-sm mt-2 text-center">
                        {codeForm.formState.errors.ticketCode.message}
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 px-6 rounded-xl shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-base"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                        Prüfe Code...
                      </>
                    ) : (
                      <>
                        CODE EINLÖSEN
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
                
                <p className="text-xs text-white/60 mt-4 text-center">
                  🎄 Kostenlose Teilnahme • Jeden Tag neue Gewinne • Live auf TikTok
                </p>
              </div>

              {/* DSGVO Hinweis */}
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/70 text-xs text-center">
                  Mit der Teilnahme stimmst du der Speicherung deiner Daten zur Gewinnabwicklung zu. 
                  Weitere Infos findest du in unserer{" "}
                  <a href="/datenschutz" className="text-yellow-400 hover:text-yellow-300 underline">
                    Datenschutzerklärung
                  </a>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SEITE 2: Kontaktdaten & Adresse */}
        {step === "contact" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto"
          >
            {/* Linke Seite - Info */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-6"
            >
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <Image
                    src="/sweeetts.svg"
                    alt="Sweets aus aller Welt"
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                  <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                    Fast geschafft!
                  </span>
                </h1>
                <p className="text-yellow-200 text-lg">
                  Code: <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded">{formData.ticketCode}</span>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold text-xl mb-4 text-center">
                  🎉 Trage jetzt deine Kontaktdaten ein
                </h3>
                <p className="text-white/90 text-center mb-4">
                  Damit wir dich bei einem Gewinn sofort informieren können – per WhatsApp oder E-Mail.
                </p>
                <p className="text-yellow-300 text-sm text-center">
                  Wenn du gezogen wirst, bekommst du eine Nachricht und wir schicken deinen Gewinn direkt zu dir nach Hause.
                </p>
              </div>

              {/* Gewinne Galerie */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h4 className="text-white font-bold text-lg mb-4 text-center">Tägliche Gewinne:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Asia-Box", emoji: "🍣" },
                    { name: "USA-Box", emoji: "🇺🇸" },
                    { name: "Bestseller-Box", emoji: "⭐" },
                    { name: "Exklusive Snacks", emoji: "🎁" }
                  ].map((prize, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{prize.emoji}</div>
                      <p className="text-white text-xs font-medium">{prize.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Rechte Seite - Formular */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="max-w-md mx-auto w-full"
            >
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/30">
                <div className="flex items-center justify-between mb-6">
                  <motion.button
                    type="button"
                    onClick={handleBackToCode}
                    className="text-white/80 hover:text-white transition-all flex items-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Zurück
                  </motion.button>
                  <div className="text-white/60 text-sm">
                    Schritt 2 von 2
                  </div>
                </div>
                
                <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                  {/* Persönliche Daten */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Vorname *"
                        {...contactForm.register("firstName", {
                          required: "Vorname ist erforderlich"
                        })}
                        className="w-full px-4 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                      />
                      {contactForm.formState.errors.firstName && (
                        <p className="text-red-400 text-sm mt-1">
                          {contactForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nachname *"
                        {...contactForm.register("lastName", {
                          required: "Nachname ist erforderlich"
                        })}
                        className="w-full px-4 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                      />
                      {contactForm.formState.errors.lastName && (
                        <p className="text-red-400 text-sm mt-1">
                          {contactForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="email"
                        placeholder="E-Mail Adresse *"
                        {...contactForm.register("email", {
                          required: "E-Mail ist erforderlich",
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Bitte gib eine gültige E-Mail Adresse ein"
                          }
                        })}
                        className="w-full pl-12 pr-6 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                      />
                    </div>
                    {contactForm.formState.errors.email && (
                      <p className="text-red-400 text-sm mt-1">
                        {contactForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="tel"
                        placeholder="Handynummer *"
                        {...contactForm.register("phone", {
                          required: "Handynummer ist erforderlich"
                        })}
                        className="w-full pl-12 pr-6 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                      />
                    </div>
                    {contactForm.formState.errors.phone && (
                      <p className="text-red-400 text-sm mt-1">
                        {contactForm.formState.errors.phone.message}
                      </p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      Für WhatsApp-Benachrichtigung bei Gewinn
                    </p>
                  </div>

                  {/* Adressdaten */}
                  <div className="pt-4 border-t border-white/20">
                    <h4 className="text-white font-semibold mb-3 text-center">Versandadresse (für Gewinne)</h4>
                    
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Straße und Hausnummer *"
                        {...contactForm.register("street", {
                          required: "Straße und Hausnummer sind erforderlich"
                        })}
                        className="w-full pl-12 pr-6 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                      />
                    </div>
                    {contactForm.formState.errors.street && (
                      <p className="text-red-400 text-sm mt-1">
                        {contactForm.formState.errors.street.message}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="PLZ *"
                          {...contactForm.register("postalCode", {
                            required: "PLZ ist erforderlich"
                          })}
                          className="w-full px-4 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                        />
                        {contactForm.formState.errors.postalCode && (
                          <p className="text-red-400 text-sm mt-1">
                            {contactForm.formState.errors.postalCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Stadt *"
                          {...contactForm.register("city", {
                            required: "Stadt ist erforderlich"
                          })}
                          className="w-full px-4 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all placeholder:text-white/60 text-white"
                        />
                        {contactForm.formState.errors.city && (
                          <p className="text-red-400 text-sm mt-1">
                            {contactForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <select
                      {...contactForm.register("country", {
                        required: "Land ist erforderlich"
                      })}
                      className="w-full px-4 py-3 text-base border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all text-white"
                    >
                      <option value="DE" className="bg-gray-800">Deutschland</option>
                      <option value="AT" className="bg-gray-800">Österreich</option>
                      <option value="CH" className="bg-gray-800">Schweiz</option>
                    </select>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 text-left bg-white/10 rounded-xl p-3 mt-4">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (e.target.checked) {
                          setConsentError("");
                        }
                      }}
                      className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-white">
                      Ich willige ein, am Gewinnspiel teilzunehmen und akzeptiere die{" "}
                      <a href="/datenschutz" target="_blank" className="text-yellow-400 underline">Datenschutzerklärung</a>.
                      Die Einwilligung kann jederzeit widerrufen werden.
                    </span>
                  </label>
                  {consentError && (
                    <p className="text-red-400 text-sm -mt-2">{consentError}</p>
                  )}

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    type="submit"
                    disabled={isLoading || !consent}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 px-6 rounded-xl shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-base mt-4"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                        Wird registriert...
                      </>
                    ) : (
                      <>
                        JETZT TEILNEHMEN & REGISTRIEREN
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>

              {/* DSGVO Hinweis */}
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/70 text-xs text-center">
                  Mit der Teilnahme stimmst du der Speicherung deiner Daten zur Gewinnabwicklung zu. 
                  Weitere Infos findest du in unserer{" "}
                  <a href="/datenschutz" className="text-yellow-400 hover:text-yellow-300 underline">
                    Datenschutzerklärung
                  </a>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Untere Gewinne-Galerie für beide Seiten */}
        {(step === "code" || step === "contact") && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <h3 className="text-white text-xl font-bold mb-6 text-center">
              TÄGLICHE GEWINNE IM ADVENT
            </h3>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {[
                "Asia-Box 🍣", "USA-Box 🇺🇸", "Bestseller-Box ⭐", "Exklusive Snacks 🎁", 
                "Gutscheine 💰", "Special Editions 🔥", "Limited Drops 🚀", "Mystery Boxes 🎲"
              ].map((prize, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 min-w-[120px]"
                >
                  <p className="text-white font-semibold text-sm">{prize}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}