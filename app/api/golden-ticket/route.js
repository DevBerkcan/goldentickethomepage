import { NextResponse } from 'next/server';
import crypto from "crypto";

// POST Handler für App Router
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      ticketCode,
      email,
      firstName,
      lastName,
      phone,
      street,
      city,
      postalCode,
      country,
      source = "golden_ticket",
      offer = "Adventskalender 2025",
      utm_source,
      utm_medium,
      utm_campaign,
      consent = false,
      consentTs
    } = body;

    // Validierung
    if (!email || !/^\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: "Gültige E-Mail Adresse ist erforderlich" },
        { status: 400 }
      );
    }

    if (!ticketCode || !/^[A-Z0-9]{8}$/.test(ticketCode)) {
      return NextResponse.json(
        { message: "Ungültiger Ticket-Code" },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { message: "Einwilligung zur Datenschutzerklärung ist erforderlich" },
        { status: 400 }
      );
    }

    // Pflichtfelder validieren
    const requiredFields = ['firstName', 'lastName', 'phone', 'street', 'postalCode', 'city'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Folgende Felder sind erforderlich: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Daten für Export vorbereiten
    const submissionData = {
      datum: new Date().toLocaleDateString('de-DE'),
      uhrzeit: new Date().toLocaleTimeString('de-DE'),
      ticket_code: ticketCode,
      vorname: firstName,
      nachname: lastName,
      email: email,
      handynummer: phone,
      strasse: street,
      plz: postalCode,
      stadt: city,
      land: country,
      quelle: source,
      utm_source: utm_source || '',
      utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '',
      einwilligung: consent ? 'Ja' : 'Nein',
      einwilligung_zeit: consentTs || new Date().toISOString()
    };

    // Daten in Google Sheets speichern
    await saveToDatabase(submissionData);

    // Erfolgsresponse
    return NextResponse.json({
      success: true,
      message: "Teilnahme erfolgreich registriert!",
      ticketCode,
      participantId: generateParticipantId(ticketCode, email)
    });

  } catch (error) {
    console.error("Golden Ticket registration error:", error);
    return NextResponse.json(
      { 
        message: "Registrierung fehlgeschlagen",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================
// HILFSFUNKTIONEN
// ============================================

async function saveToDatabase(data) {
  console.log("📝 Saving to Google Sheets...");
  console.log("Data:", JSON.stringify(data, null, 2));
  
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  
  if (!sheetsUrl) {
    console.error("❌ GOOGLE_SHEETS_WEB_APP_URL not set!");
    throw new Error('Google Sheets URL nicht konfiguriert');
  }
  
  try {
    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("❌ Google Sheets API error:", responseText);
      throw new Error(`Failed to save to Google Sheets: ${response.status}`);
    }
    
    console.log("✅ Successfully saved to Google Sheets!");
    console.log("Response:", responseText);
    
  } catch (error) {
    console.error("❌ Error saving to Google Sheets:", error);
    throw error; // Fehler werfen, damit User Feedback bekommt
  }
}

function generateParticipantId(ticketCode, email) {
  return crypto
    .createHash('md5')
    .update(ticketCode + email + Date.now())
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();
}