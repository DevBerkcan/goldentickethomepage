import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📥 Received request for ticket:", body.ticketCode);

    const required = ["ticketCode", "email", "firstName", "lastName"];
    const missing = required.filter((k) => !body?.[k]);
    if (missing.length) {
      console.error("❌ Missing fields:", missing);
      return NextResponse.json(
        { ok: false, error: `Fehlende Felder: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Speichere in Google Sheets
    const result = await saveToSheets(body);
    
    // ✅ WICHTIG: Prüfe ob es funktioniert hat!
    if (!result.ok) {
      console.error("❌ Sheets error:", result.error);
      return NextResponse.json(
        { ok: false, error: "Speichern fehlgeschlagen: " + result.error },
        { status: 500 }
      );
    }

    console.log("✅ Success! Ticket saved:", body.ticketCode);
    return NextResponse.json({
      ok: true,
      message: "Registrierung erfolgreich!",
      ticketCode: body.ticketCode,
    });

  } catch (err) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { ok: false, error: "Unerwarteter Fehler: " + err.message },
      { status: 500 }
    );
  }
}

async function saveToSheets(payload) {
  const url = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  
  console.log("🔍 Checking environment variable...");
  console.log("📍 URL exists:", !!url);
  
  if (!url) {
    console.error("❌ GOOGLE_SHEETS_WEB_APP_URL not set!");
    return { ok: false, error: "GOOGLE_SHEETS_WEB_APP_URL not set" };
  }

  // ✅ Deutsche Zeitzone verwenden
  const now = new Date();
  const datum = now.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
  const uhrzeit = now.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin" });

  const submission = {
    datum: datum,
    uhrzeit: uhrzeit,
    ticket_code: payload.ticketCode,
    vorname: payload.firstName,
    nachname: payload.lastName,
    email: payload.email,
    handynummer: payload.phone || "",
    strasse: payload.street || "",
    plz: payload.postalCode || "",
    stadt: payload.city || "",
    land: payload.country || "DE",
    quelle: payload.source || "golden_ticket",
    utm_source: payload.utm_source || "",
    utm_medium: payload.utm_medium || "",
    utm_campaign: payload.utm_campaign || "",
    einwilligung: "Ja",
    einwilligung_zeit: payload.consentTs || new Date().toISOString(),
  };

  console.log("📤 Sending to Google Sheets...");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 Sekunden

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(submission),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    console.log("📥 Response status:", res.status);
    
    const text = await res.text();
    console.log("📥 Response body:", text.substring(0, 300));

    if (!res.ok) {
      const error = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      console.error("❌ Google Sheets returned error:", error);
      return { ok: false, error };
    }

    console.log("✅ Successfully saved to Google Sheets");
    return { ok: true };

  } catch (e) {
    clearTimeout(timeout);
    const errorMsg = e?.name === "AbortError" ? "Timeout after 8s" : e?.message || "Unknown error";
    console.error("❌ Fetch error:", errorMsg, e);
    return { ok: false, error: errorMsg };
  }
}