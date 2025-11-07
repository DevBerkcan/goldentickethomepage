import crypto from "crypto";
import mailchimp from "@mailchimp/mailchimp_transactional";

const mandrillClient = mailchimp(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      ticketCode,
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      postalCode,
      country = "DE",
      source = "golden_ticket",
      offer,
      utm_source,
      utm_medium,
      utm_campaign,
      consent,
      consentTs,
      newsletterConsent = false // Newsletter-Checkbox Status
    } = data;

    // Validierung
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json(
        { message: "Gültige E-Mail erforderlich" },
        { status: 400 }
      );
    }

    if (!ticketCode || !/^[A-Z0-9]{8}$/.test(ticketCode)) {
      return Response.json(
        { message: "Gültiger 8-stelliger Code erforderlich" },
        { status: 400 }
      );
    }

    // Mailchimp Konfiguration
    const API_KEY = process.env.MAILCHIMP_API_KEY;
    const LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!API_KEY || !LIST_ID) {
      console.error("Mailchimp Konfiguration fehlt!");
      return Response.json(
        { message: "Server-Konfiguration fehlt" },
        { status: 500 }
      );
    }

    const DATACENTER = API_KEY.split("-")[1];
    const basic = Buffer.from(`anystring:${API_KEY}`).toString("base64");
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

    console.log("🔧 Debug Info:");
    console.log("- API Key Datacenter:", DATACENTER);
    console.log("- List ID:", LIST_ID);
    console.log("- Email:", email);
    console.log("- Subscriber Hash:", subscriberHash);

    // Merge Fields für Mailchimp
    // Verwende die richtigen Merge Tags basierend auf Ihrer Mailchimp-Konfiguration
    const merge_fields = {
      FNAME: firstName || "",
      LNAME: lastName || "",
      PHONE: phone || "", // Standard PHONE Feld
      MMERGE7: phone || "", // PHONE als Text (Merge Tag 7) - Backup
      MMERGE8: ticketCode || "", // TICKET (Merge Tag 8)
      MMERGE9: offer || "Adventskalender 2025", // OFFER (Merge Tag 9)
      MMERGE10: source, // SOURCE (Merge Tag 10)
    };

    // UTM-Parameter hinzufügen
    if (utm_source) merge_fields.MMERGE11 = utm_source; // UTM_SOURCE (Merge Tag 11)
    if (utm_medium) merge_fields.MMERGE12 = utm_medium; // UTM_MEDIUM (Merge Tag 12)
    if (utm_campaign) merge_fields.MMERGE13 = utm_campaign; // UTM_CAMPAIGN (Merge Tag 13)

    // Adresse MUSS strukturiert sein! (siehe Mailchimp Felder-Konfiguration)
    if (street || city || postalCode) {
      // Haupt-ADDRESS Feld (MERGE3) als strukturiertes Objekt
      merge_fields.ADDRESS = {
        addr1: street || "",
        addr2: "",
        city: city || "",
        state: "", // Bundesland - für Deutschland meist leer
        zip: postalCode || "",
        country: country || "DE"
      };

      // MMERGE14 (zweites ADDRESS-Feld) auch strukturiert
      merge_fields.MMERGE14 = {
        addr1: street || "",
        addr2: "",
        city: city || "",
        state: "",
        zip: postalCode || "",
        country: country || "DE"
      };
    }

    const memberUrl = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

    console.log("🌐 Mailchimp URL:", memberUrl);
    console.log("📦 Merge Fields:", JSON.stringify(merge_fields, null, 2));

    // Teilnehmer in Mailchimp speichern
    // Status: "subscribed" damit sie in der Zielgruppe sichtbar sind
    // Tags unterscheiden zwischen Gewinnspiel-Teilnehmern und Newsletter-Abonnenten
    const requestBody = {
      email_address: email,
      status_if_new: "subscribed",
      status: "subscribed", // WICHTIG: Reaktiviert auch archivierte Kontakte!
      merge_fields
    };

    console.log("📤 Request Body:", JSON.stringify(requestBody, null, 2));

    const upsertResponse = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const upsertText = await upsertResponse.text();
    let mcData = null;
    try {
      mcData = upsertText ? JSON.parse(upsertText) : {};
    } catch (e) {
      console.error("Mailchimp Response Parse Error:", e);
    }

    console.log("📧 Mailchimp Response Status:", upsertResponse.status);
    console.log("📧 Mailchimp Response Data:", mcData);

    if (!upsertResponse.ok) {
      console.error("❌ Mailchimp Error:", mcData || upsertText);
      return Response.json(
        { message: "Fehler bei der Speicherung in Mailchimp", details: mcData },
        { status: 400 }
      );
    }

    // NUR die wichtigsten Tags - aufgeräumt!
    const tags = [
      { name: "goldenticket", status: "active" } // HAUPTTAG für diese Seite
    ];

    // Newsletter-Opt-In Status als Tag speichern
    if (newsletterConsent) {
      tags.push({ name: "newsletter-opt-in-pending", status: "active" });
    }

    // Tags zu Mailchimp hinzufügen
    const tagsResponse = await fetch(`${memberUrl}/tags`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tags })
    });

    if (!tagsResponse.ok) {
      console.error("Tags konnten nicht hinzugefügt werden:", await tagsResponse.text());
    }

    // Adresse als NOTE speichern (da Merge Fields nicht funktionieren)
    if (street || city || postalCode || phone) {
      const noteText = `
📍 Adresse: ${street || '-'}, ${postalCode || '-'} ${city || '-'}${country && country !== 'DE' ? ', ' + country : ''}
📞 Telefon: ${phone || '-'}
🎫 Ticket-Code: ${ticketCode}
📅 Teilnahme: ${new Date().toLocaleString('de-DE')}
      `.trim();

      try {
        await fetch(`${memberUrl}/notes`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            note: noteText
          })
        });
        console.log("✅ Adresse als Note gespeichert");
      } catch (noteError) {
        console.error("⚠️ Note konnte nicht gespeichert werden:", noteError);
      }
    }

    console.log("✅ Golden Ticket Teilnahme in Mailchimp gespeichert:", {
      email,
      ticketCode,
      tags: tags.map(t => t.name)
    });

    // EMAILS VERSENDEN via Mailchimp Transactional (Mandrill)
    // ZWEI separate Emails!
    try {
      console.log("📧 Starte Email-Versand...");
      console.log("📧 Mailchimp Transactional API Key vorhanden?", !!process.env.MAILCHIMP_TRANSACTIONAL_API_KEY);
      console.log("📧 Newsletter Consent:", newsletterConsent);

      // EMAIL 1: Gewinnspiel-Bestätigung (IMMER senden)
      console.log("📧 Sende Email 1: Gewinnspiel-Bestätigung an", email);

      const result1 = await mandrillClient.messages.send({
        message: {
          from_email: "noreply@sweetsausallerwelt.de",
          from_name: "Sweets aus aller Welt",
          to: [{ email, name: `${firstName} ${lastName}`.trim() || email }],
          subject: "🎫 Du bist jetzt im Lostopf!",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: system-ui, -apple-system, sans-serif;
                    line-height: 1.6;
                    color: #723a2b;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  .container {
                    background: linear-gradient(135deg, #f8ab14 0%, #16b9da 100%);
                    padding: 40px;
                    border-radius: 20px;
                  }
                  .content {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                  }
                  h1 {
                    color: #f8ab14;
                    margin-top: 0;
                  }
                  .ticket-code {
                    background: #fff8e1;
                    border-left: 4px solid #f8ab14;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                    letter-spacing: 3px;
                  }
                  .highlight {
                    background: #e8f5e9;
                    border-left: 4px solid #16b9da;
                    padding: 15px;
                    margin: 20px 0;
                  }
                  .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dddddd;
                    font-size: 12px;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="content">
                    <h1>🎫 Glückwunsch ${firstName || ''}!</h1>

                    <p>Deine Teilnahme am <strong>Golden Ticket Gewinnspiel</strong> wurde erfolgreich registriert!</p>

                    <div class="ticket-code">
                      ${ticketCode}
                    </div>

                    <div class="highlight">
                      <strong>🎉 Du bist jetzt im Lostopf!</strong><br>
                      Wir benachrichtigen dich per Email, wenn du gewonnen hast.
                    </div>

                    <p><strong>Was passiert jetzt?</strong></p>
                    <ul>
                      <li>✅ Deine Teilnahme ist gespeichert</li>
                      <li>🎁 Wir ziehen die Gewinner und informieren dich per Email</li>
                      <li>🍬 Viel Glück!</li>
                    </ul>

                    <p>Vielen Dank für deine Teilnahme und viel Erfolg! 🎉</p>

                    <div class="footer">
                      <p>© ${new Date().getFullYear()} Sweets aus aller Welt<br>
                      <a href="https://sweetsausallerwelt.de">sweetsausallerwelt.de</a></p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `
        }
      });

      console.log("✅ Email 1 Result:", JSON.stringify(result1, null, 2));
      console.log("✅ Gewinnspiel-Bestätigungsmail versendet an:", email);

      // EMAIL 2: Newsletter Double-Opt-In (NUR wenn Checkbox aktiviert)
      if (newsletterConsent) {
        console.log("📧 Sende Email 2: Newsletter-DOI an", email);
        const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/newsletter/confirm?email=${encodeURIComponent(email)}&token=${Buffer.from(email).toString('base64')}`;

        const result2 = await mandrillClient.messages.send({
          message: {
            from_email: "noreply@sweetsausallerwelt.de",
            from_name: "Sweets aus aller Welt",
            to: [{ email, name: `${firstName} ${lastName}`.trim() || email }],
            subject: "📬 Bestätige deine Newsletter-Anmeldung",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body {
                      font-family: system-ui, -apple-system, sans-serif;
                      line-height: 1.6;
                      color: #723a2b;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                    }
                    .container {
                      background: linear-gradient(135deg, #f8ab14 0%, #16b9da 100%);
                      padding: 40px;
                      border-radius: 20px;
                    }
                    .content {
                      background: white;
                      padding: 30px;
                      border-radius: 15px;
                    }
                    h1 {
                      color: #f8ab14;
                      margin-top: 0;
                    }
                    .button {
                      display: inline-block;
                      padding: 15px 30px;
                      background: #f8ab14;
                      color: white !important;
                      text-decoration: none;
                      border-radius: 10px;
                      font-weight: bold;
                      margin: 20px 0;
                    }
                    .button:hover {
                      background: #16b9da;
                    }
                    .warning {
                      background: #fff8e1;
                      border-left: 4px solid #dc2626;
                      padding: 15px;
                      margin: 20px 0;
                    }
                    .footer {
                      margin-top: 30px;
                      padding-top: 20px;
                      border-top: 1px solid #dddddd;
                      font-size: 12px;
                      color: #666;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="content">
                      <h1>📬 Bestätige deine Newsletter-Anmeldung</h1>

                      <p>Hallo ${firstName || 'lieber Kunde'},</p>

                      <p>vielen Dank für deine Anmeldung zu unserem Newsletter! Um deine Anmeldung abzuschließen, bestätige bitte deine Email-Adresse:</p>

                      <center>
                        <a href="${confirmationUrl}" class="button">
                          ✓ Jetzt Newsletter aktivieren
                        </a>
                      </center>

                      <div class="warning">
                        <strong>⚠️ Wichtig:</strong> Falls diese Email in deinem <strong>SPAM-Ordner</strong> gelandet ist, markiere sie bitte als "Kein Spam" und füge unsere Adresse zu deinen Kontakten hinzu.
                      </div>

                      <p>Nach der Bestätigung erhältst du regelmäßig:</p>
                      <ul>
                        <li>🍬 Leckere Neuigkeiten aus aller Welt</li>
                        <li>🎁 Exklusive Angebote</li>
                        <li>✨ Besondere Aktionen</li>
                      </ul>

                      <div class="footer">
                        <p>Falls du dich nicht angemeldet hast, kannst du diese Email ignorieren.</p>
                        <p>© ${new Date().getFullYear()} Sweets aus aller Welt<br>
                        <a href="https://sweetsausallerwelt.de">sweetsausallerwelt.de</a></p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `
          }
        });

        console.log("✅ Email 2 Result:", JSON.stringify(result2, null, 2));
        console.log("✅ Newsletter-DOI-Email versendet an:", email);
      }

    } catch (emailError) {
      console.error("❌ EMAIL-VERSAND FEHLGESCHLAGEN:", emailError);
      console.error("❌ Error Message:", emailError.message);
      console.error("❌ Error Stack:", emailError.stack);
      if (emailError.response) {
        console.error("❌ Mailchimp Response:", emailError.response.body);
      }
      // Fehler nicht durchreichen - Teilnahme ist erfolgreich gespeichert
    }

    return Response.json({
      success: true,
      message: "Teilnahme erfolgreich registriert",
      ticketCode,
      email,
      mailchimp_status: "saved"
    });

  } catch (error) {
    console.error("Golden Ticket API Error:", error);
    return Response.json(
      { message: "Interner Server-Fehler", error: error.message },
      { status: 500 }
    );
  }
}
