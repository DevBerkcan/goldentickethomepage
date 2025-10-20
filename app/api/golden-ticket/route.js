import { NextResponse } from 'next/server';
import crypto from "crypto";

export const maxDuration = 30; // 30 seconds max for Vercel Hobby

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Schnellere Validierung
    const requiredFields = ['ticketCode', 'email', 'firstName', 'lastName', 'phone', 'street', 'city', 'postalCode'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Fehlende Felder: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Email Validierung
    if (!/^\S+@\S+\.\S+/.test(body.email)) {
      return NextResponse.json(
        { message: "Ungültige E-Mail Adresse" },
        { status: 400 }
      );
    }

    // Ticket Code Validierung
    if (!/^[A-Z0-9]{8}$/.test(body.ticketCode)) {
      return NextResponse.json(
        { message: "Ungültiger Ticket-Code" },
        { status: 400 }
      );
    }

    if (!body.consent) {
      return NextResponse.json(
        { message: "Einwilligung erforderlich" },
        { status: 400 }
      );
    }

    // Daten vorbereiten
    const submissionData = {
      datum: new Date().toLocaleDateString('de-DE'),
      uhrzeit: new Date().toLocaleTimeString('de-DE'),
      ticket_code: body.ticketCode,
      vorname: body.firstName,
      nachname: body.lastName,
      email: body.email,
      handynummer: body.phone,
      strasse: body.street,
      plz: body.postalCode,
      stadt: body.city,
      land: body.country || 'DE',
      quelle: body.source || "golden_ticket",
      utm_source: body.utm_source || '',
      utm_medium: body.utm_medium || '',
      utm_campaign: body.utm_campaign || '',
      einwilligung: 'Ja',
      einwilligung_zeit: body.consentTs || new Date().toISOString()
    };

    // Google Sheets mit Timeout
    await saveToGoogleSheets(submissionData);

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich!",
      ticketCode: body.ticketCode
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Server Fehler" },
      { status: 500 }
    );
  }
}

async function saveToGoogleSheets(data) {
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  
  if (!sheetsUrl) {
    console.log("Mock: Daten würden gespeichert werden:", data);
    return; // Mock für Build
  }
  
  // Timeout für Google Sheets Request
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`Sheets API: ${response.status}`);
    }
    
  } finally {
    clearTimeout(timeout);
  }
}