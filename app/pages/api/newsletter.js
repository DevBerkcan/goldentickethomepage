import crypto from "crypto";

function buildMergeFields({ firstName, lastName, offer, source, utm_source, utm_medium, utm_campaign, street, city, postalCode, country }) {
  const enabled = (process.env.MAILCHIMP_MERGE_TAGS || "FNAME,LNAME,ADDRESS")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

  const candidate = {
    FNAME: firstName || "",
    LNAME: lastName || "",
    OFFER: offer,
    SOURCE: source,
    UTM_SOURCE: utm_source,
    UTM_MEDIUM: utm_medium,
    UTM_CAMPAIGN: utm_campaign,
  };

  // Adresse zu Merge Fields hinzufügen, wenn vorhanden
  if (street || city || postalCode || country) {
    candidate.ADDRESS = {
      addr1: street || "",
      city: city || "",
      zip: postalCode || "",
      country: country || "DE"
    };
  }

  const out = {};
  for (const [k, v] of Object.entries(candidate)) {
    if (enabled.includes(k) && v !== undefined && v !== null) {
      // Spezielle Behandlung für ADDRESS-Objekt
      if (k === "ADDRESS" && typeof v === "object") {
        // Nur hinzufügen, wenn mindestens ein Adressfeld ausgefüllt ist
        if (v.addr1 || v.city || v.zip) {
          out[k] = v;
        }
      } else if (typeof v === "string" && v.trim() !== "") {
        out[k] = v;
      } else if (typeof v !== "string") {
        out[k] = v;
      }
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const {
    email,
    firstName = "",
    lastName = "",
    street = "",
    city = "",
    postalCode = "",
    country = "DE",
    source = "standard",
    offer,
    utm_source,
    utm_medium,
    utm_campaign,
    statusIfNew = "subscribed", // "pending" für DOI
  } = req.body || {};

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!API_KEY || !LIST_ID) {
    return res.status(500).json({ message: "Server config missing (MAILCHIMP_* envs)" });
  }

  try {
    const DATACENTER = API_KEY.split("-")[1];
    const basic = Buffer.from(`anystring:${API_KEY}`).toString("base64");
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

    const merge_fields = buildMergeFields({
      firstName,
      lastName,
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

    const memberUrl = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

    // Erstelle den Member mit allen verfügbaren Daten
    let upsert = await fetch(memberUrl, {
      method: "PUT",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email_address: email, 
        status_if_new: statusIfNew, 
        merge_fields 
      }),
    });
    
    const upText = await upsert.text();
    let mcData = null; 
    try { 
      mcData = upText ? JSON.parse(upText) : {}; 
    } catch {}

    if (!upsert.ok) {
      const detail = String(mcData?.detail || upText || "").toLowerCase();

      if (upsert.status === 401 || detail.includes("api key")) {
        return res.status(400).json({ message: "Mailchimp auth failed (API key/datacenter)", mc: mcData || upText });
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
        if (!retry.ok) return res.status(400).json({ message: retryData?.title || "Subscription failed", mc: retryData || retryText });
        mcData = retryData;
      } else {
        return res.status(400).json({ message: mcData?.title || "Subscription failed", mc: mcData || upText });
      }
    }

    // Tags basierend auf bereitgestellten Daten erstellen
    const tags = [
      { name: "website-signup", status: "active" }, 
      { name: source, status: "active" }
    ];
    
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

    return res.status(200).json(responseData);
    
  } catch (err) {
    console.error("Newsletter signup error:", err);
    return res.status(500).json({ 
      message: "Subscription failed", 
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
  }
}