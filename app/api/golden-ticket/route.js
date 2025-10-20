import { NextResponse } from "next/server";

export const runtime = "nodejs";       // wichtig: kein Edge
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request) {
  try {
    const body = await request.json();

    const required = ["ticketCode", "email", "firstName", "lastName"];
    const missing = required.filter((k) => !body?.[k]);
    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Fehlende Felder: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await saveToSheets(body); // <-- abwarten!
    if (!result.ok) console.error("Sheets error:", result.error);

    return NextResponse.json({
      ok: true,
      message: "Registrierung erfolgreich!",
      ticketCode: body.ticketCode,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}

async function saveToSheets(payload) {
  const url = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  if (!url) return { ok: false, error: "GOOGLE_SHEETS_WEB_APP_URL not set" };

  const submission = {
    datum: new Date().toLocaleDateString("de-DE"),
    uhrzeit: new Date().toLocaleTimeString("de-DE"),
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "GoldenTicket/1.0" },
      body: JSON.stringify(submission),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };

    console.log("✅ Saved to Google Sheets");
    return { ok: true };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e?.name === "AbortError" ? "Timeout after 5s" : e?.message || "Unknown" };
  }
}
