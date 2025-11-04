import crypto from "crypto";

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
      MMERGE7: phone || "", // PHONE als Text (Merge Tag 7)
      MMERGE8: ticketCode || "", // TICKET (Merge Tag 8)
      MMERGE9: offer || "Adventskalender 5", // OFFER (Merge Tag 9)
      MMERGE10: source, // SOURCE (Merge Tag 10)
    };

    // UTM-Parameter hinzufügen
    if (utm_source) merge_fields.MMERGE11 = utm_source; // UTM_SOURCE (Merge Tag 11)
    if (utm_medium) merge_fields.MMERGE12 = utm_medium; // UTM_MEDIUM (Merge Tag 12)
    if (utm_campaign) merge_fields.MMERGE13 = utm_campaign; // UTM_CAMPAIGN (Merge Tag 13)

    // Adresse als TEXT speichern in MMERGE14 (das zweite ADDRESS-Feld)
    // Vermeidet Probleme mit dem strukturierten ADDRESS-Feld
    if (street || city || postalCode) {
      const addressParts = [];
      if (street) addressParts.push(street);
      if (postalCode) addressParts.push(postalCode);
      if (city) addressParts.push(city);
      if (country && country !== "DE") addressParts.push(country);
      merge_fields.MMERGE14 = addressParts.join(", ");
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

    // Tags hinzufügen für Filterung
    const tags = [
      { name: "goldenticket", status: "active" }, // HAUPTTAG für diese Seite
      { name: "gewinnspiel-teilnehmer", status: "active" },
      { name: "golden-ticket-2025", status: "active" },
      { name: source, status: "active" },
      { name: `ticket-${ticketCode.substring(0, 3)}`, status: "active" } // Erste 3 Zeichen als Tag
    ];

    if (street || city || postalCode) {
      tags.push({ name: "address-provided", status: "active" });
    }

    if (utm_source) {
      tags.push({ name: `utm_source_${utm_source}`, status: "active" });
    }

    if (utm_campaign) {
      tags.push({ name: `utm_campaign_${utm_campaign}`, status: "active" });
    }

    // Newsletter-Opt-In Status als Tag speichern
    if (newsletterConsent) {
      tags.push({ name: "newsletter-opt-in-pending", status: "active" });
      tags.push({ name: "newsletter-requested", status: "active" });
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

    console.log("✅ Golden Ticket Teilnahme in Mailchimp gespeichert:", {
      email,
      ticketCode,
      tags: tags.map(t => t.name)
    });

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
