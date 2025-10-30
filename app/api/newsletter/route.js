import crypto from "crypto";

function buildMergeFields({ firstName, lastName, offer, source, utm_source, utm_medium, utm_campaign, street, city, postalCode, country, ticketCode, phone }) {
  // Merge Fields gemäß Ihrer Mailchimp-Konfiguration
  const merge_fields = {
    FNAME: firstName || "",
    LNAME: lastName || "",
    MMERGE7: phone || "", // PHONE als Text (Merge Tag 7)
    MMERGE8: ticketCode || "", // TICKET (Merge Tag 8)
    MMERGE9: offer || "Standard", // OFFER (Merge Tag 9)
    MMERGE10: source || "standard", // SOURCE (Merge Tag 10)
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

  return merge_fields;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      email,
      firstName = "",
      lastName = "",
      phone = "",
      ticketCode = "",
      street = "",
      city = "",
      postalCode = "",
      country = "DE",
      source = "standard",
      offer,
      utm_source,
      utm_medium,
      utm_campaign,
      statusIfNew = "pending", // "pending" für DOI (Double-Opt-In)
    } = body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ message: "Valid email is required" }, { status: 400 });
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY;
    const LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    if (!API_KEY || !LIST_ID) {
      return Response.json({ message: "Server config missing (MAILCHIMP_* envs)" }, { status: 500 });
    }

    const DATACENTER = API_KEY.split("-")[1];
    const basic = Buffer.from(`anystring:${API_KEY}`).toString("base64");
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

    console.log("📧 Newsletter API - Debug Info:");
    console.log("- Datacenter:", DATACENTER);
    console.log("- List ID:", LIST_ID);
    console.log("- Email:", email);
    console.log("- Status:", statusIfNew);

    const merge_fields = buildMergeFields({
      firstName,
      lastName,
      phone,
      ticketCode,
      offer: offer || (source === "hero_dubai_offer" ? "Dubai Schokolade" : "Standard"),
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      street,
      city,
      postalCode,
      country
    });

    console.log("📦 Newsletter Merge Fields:", JSON.stringify(merge_fields, null, 2));

    const memberUrl = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

    // Erstelle den Member mit allen verfügbaren Daten
    // Wichtig: Bei archivierten Kontakten muss "status" gesetzt werden
    let upsert = await fetch(memberUrl, {
      method: "PUT",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status_if_new: statusIfNew,
        status: statusIfNew, // Reaktiviert archivierte Kontakte
        merge_fields
      }),
    });

    const upText = await upsert.text();
    let mcData = null;
    try {
      mcData = upText ? JSON.parse(upText) : {};
    } catch {}

    console.log("📧 Newsletter Mailchimp Response Status:", upsert.status);
    console.log("📧 Newsletter Mailchimp Response:", mcData);

    if (!upsert.ok) {
      console.error("❌ Newsletter Mailchimp Error:", mcData || upText);
      const detail = String(mcData?.detail || upText || "").toLowerCase();

      if (upsert.status === 401 || detail.includes("api key")) {
        return Response.json({ message: "Mailchimp auth failed (API key/datacenter)", mc: mcData || upText }, { status: 400 });
      }

      if (detail.includes("compliance") || detail.includes("resubscribe") || detail.includes("pending")) {
        const retry = await fetch(memberUrl, {
          method: "PUT",
          headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            email_address: email,
            status_if_new: "pending",
            status: "pending",
            merge_fields
          }),
        });
        const retryText = await retry.text();
        let retryData = null;
        try {
          retryData = retryText ? JSON.parse(retryText) : {};
        } catch {}
        if (!retry.ok) return Response.json({ message: retryData?.title || "Subscription failed", mc: retryData || retryText }, { status: 400 });
        mcData = retryData;
      } else {
        return Response.json({ message: mcData?.title || "Subscription failed", mc: mcData || upText }, { status: 400 });
      }
    }

    // Tags basierend auf bereitgestellten Daten erstellen
    const tags = [
      { name: "website-signup", status: "active" },
      { name: source, status: "active" }
    ];

    // Spezielle Tags für Golden Ticket Gewinnspiel
    if (source === "golden_ticket") {
      tags.push({ name: "golden-ticket-gewinnspiel", status: "active" });
      tags.push({ name: "newsletter-opt-in", status: "active" });
      if (ticketCode) {
        tags.push({ name: "ticket-code-provided", status: "active" });
      }
    }

    if (source === "hero_dubai_offer" || source === "hero_offer") {
      tags.push({ name: "dubai_chocolate", status: "active" });
    }

    if (offer) {
      tags.push({ name: String(offer).toLowerCase().replace(/\s+/g, "_"), status: "active" });
    }

    // Adress-Tag hinzufügen, wenn Adresse bereitgestellt wurde
    if (street || city || postalCode) {
      tags.push({ name: "address_provided", status: "active" });
    }

    // UTM-basierte Tags
    if (utm_source) {
      tags.push({ name: `utm_source_${utm_source}`, status: "active" });
    }
    if (utm_campaign) {
      tags.push({ name: `utm_campaign_${utm_campaign}`, status: "active" });
    }

    const tagsRes = await fetch(`${memberUrl}/tags`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });

    let tagsWarning;
    if (!tagsRes.ok) {
      try {
        tagsWarning = await tagsRes.json();
      } catch {
        tagsWarning = { error: "Failed to parse tags response" };
      }
    }

    console.log("✅ Newsletter Anmeldung in Mailchimp gespeichert:", {
      email,
      source,
      tags: tags.map(t => t.name)
    });

    // Response erstellen
    const responseData = {
      message: "Successfully subscribed!",
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      offer: source === "hero_dubai_offer" || source === "hero_offer" ? "dubai_chocolate" : "standard",
      status: statusIfNew,
      address_provided: !!(street || city || postalCode),
      ...(tagsWarning ? { tagsWarning } : {}),
    };

    // Debug-Info für Entwicklung
    if (process.env.NODE_ENV === "development") {
      responseData.debug = {
        merge_fields,
        tags: tags.map(t => t.name),
        subscriber_hash: subscriberHash
      };
    }

    return Response.json(responseData);

  } catch (err) {
    console.error("Newsletter signup error:", err);
    return Response.json({
      message: "Subscription failed",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    }, { status: 500 });
  }
}
