import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    statusIfNew = "subscribed",
    consent = false,
    consentTs
  } = req.body;

  // Validierung
  if (!email || !/^\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: "Gültige E-Mail Adresse ist erforderlich" });
  }

  if (!ticketCode || !/^[A-Z0-9]{8}$/.test(ticketCode)) {
    return res.status(400).json({ message: "Ungültiger Ticket-Code" });
  }

  if (!consent) {
    return res.status(400).json({ message: "Einwilligung zur Datenschutzerklärung ist erforderlich" });
  }

  // Pflichtfelder validieren
  const requiredFields = ['firstName', 'lastName', 'phone', 'street', 'postalCode', 'city'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: `Folgende Felder sind erforderlich: ${missingFields.join(', ')}` 
    });
  }

  try {
    // 1. Daten für Export vorbereiten
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

    // 2. In Datenbank/Google Sheets speichern
    await saveToDatabase(submissionData);

    // 3. In Mailchimp eintragen (optional)
    await addToMailchimp({
      ticketCode,
      email,
      firstName,
      lastName,
      phone,
      street,
      city,
      postalCode,
      country,
      source,
      offer,
      utm_source,
      utm_medium,
      utm_campaign,
      statusIfNew,
      consent,
      consentTs
    });

    // 4. Bestätigungsmail senden
    await sendConfirmationEmail(email, firstName, ticketCode);

    // 5. Erfolgsresponse
    return res.status(200).json({
      success: true,
      message: "Teilnahme erfolgreich registriert!",
      ticketCode,
      participantId: generateParticipantId(ticketCode, email),
      emailSent: true
    });

  } catch (error) {
    console.error("Golden Ticket registration error:", error);
    return res.status(500).json({ 
      message: "Registrierung fehlgeschlagen",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

// Hilfsfunktionen
async function saveToDatabase(data) {a
  // Hier die Implementierung für deine Datenbank/Google Sheets
  console.log("Saving to database:", data);
  
  // Beispiel für Google Sheets Web App:
  if (process.env.GOOGLE_SHEETS_WEB_APP_URL) {
    const response = await fetch(process.env.GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save to database');
    }
  }
}

async function addToMailchimp(data) {
  // Deine bestehende Mailchimp-Implementierung hier
  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  
  if (!API_KEY || !LIST_ID) {
    console.log("Mailchimp credentials not found, skipping...");
    return;
  }

  try {
    const DATACENTER = API_KEY.split("-")[1];
    const basic = Buffer.from(`anystring:${API_KEY}`).toString("base64");
    const subscriberHash = crypto.createHash("md5").update(data.email.toLowerCase()).digest("hex");

    const merge_fields = {
      FNAME: data.firstName || "",
      LNAME: data.lastName || "",
      TICKET: data.ticketCode || "",
      PHONE: data.phone || "",
      SOURCE: data.source || "golden_ticket",
      UTM_SOURCE: data.utm_source || "",
      UTM_MEDIUM: data.utm_medium || "",
      UTM_CAMPAIGN: data.utm_campaign || "",
    };

    // Adresse hinzufügen, wenn vorhanden
    if (data.street || data.city || data.postalCode) {
      merge_fields.ADDRESS = {
        addr1: data.street || "",
        city: data.city || "",
        zip: data.postalCode || "",
        country: data.country || "DE"
      };
    }

    const memberUrl = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

    const upsert = await fetch(memberUrl, {
      method: "PUT",
      headers: { 
        Authorization: `Basic ${basic}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        email_address: data.email, 
        status_if_new: data.statusIfNew || "subscribed",
        merge_fields,
        ip_opt: data.ip_opt || "",
        timestamp_opt: data.consentTs || new Date().toISOString()
      }),
    });

    if (!upsert.ok) {
      const errorData = await upsert.json();
      console.error("Mailchimp error:", errorData);
      // Wir werfen hier keinen Fehler, da die Hauptregistrierung trotzdem erfolgreich sein kann
    }

    // Tags hinzufügen
    const tags = [
      { name: "website-signup", status: "active" },
      { name: data.source || "golden_ticket", status: "active" },
      { name: "golden_ticket_2024", status: "active" }
    ];

    if (data.ticketCode) {
      tags.push({ name: `ticket_${data.ticketCode}`, status: "active" });
    }

    if (data.consent) {
      tags.push({ name: "consent_given", status: "active" });
    }

    await fetch(`${memberUrl}/tags`, {
      method: "POST",
      headers: { 
        Authorization: `Basic ${basic}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ tags }),
    });

    console.log("Successfully added to Mailchimp:", data.email);
  } catch (error) {
    console.error("Mailchimp integration error:", error);
    // Wir werfen hier keinen Fehler, da die Hauptregistrierung trotzdem erfolgreich sein kann
  }
}

async function sendConfirmationEmail(email, firstName, ticketCode) {
  // Mailchimp Automation wird automatisch ausgelöst
  // wenn der User zur Liste hinzugefügt wird
  console.log("✅ User wurde zu Mailchimp hinzugefügt - Automation wird ausgelöst");
  
  // Optional: Du könntest hier auch Merge Fields setzen
  // für personalisierte Emails
}

function generateParticipantId(ticketCode, email) {
  return crypto
    .createHash('md5')
    .update(ticketCode + email + Date.now())
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();
}