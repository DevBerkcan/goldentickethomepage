// Klaviyo API Configuration
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_LIST_ID = process.env.KLAVIYO_MAIN_LIST_ID;
const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

/**
 * Erstellt oder aktualisiert ein Klaviyo Profile
 */
async function createOrUpdateKlaviyoProfile(data) {
  const { email, firstName, lastName, phone, ticketCode, street, city, postalCode, country, newsletterConsent } = data;

  // Normalize phone number: E.164 Format für Klaviyo
  let phoneNumber = '';
  if (phone && phone.trim()) {
    console.log(`📞 Original Telefonnummer: "${phone}"`);

    // 1. Entferne alle Leerzeichen, Bindestriche, Klammern und Punkte
    let cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    console.log(`📞 Nach Bereinigung: "${cleanedPhone}"`);

    // 2. Stelle sicher, dass die Nummer mit + beginnt
    if (!cleanedPhone.startsWith('+')) {
      // Wenn keine Ländervorwahl, füge +49 für Deutschland hinzu
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '+49' + cleanedPhone.substring(1);
      } else if (cleanedPhone.startsWith('49')) {
        cleanedPhone = '+' + cleanedPhone;
      } else {
        // Falls die Nummer nicht mit 0 oder 49 beginnt, trotzdem +49 hinzufügen
        cleanedPhone = '+49' + cleanedPhone;
      }
    }
    console.log(`📞 Nach Präfix-Normalisierung: "${cleanedPhone}"`);

    // 3. Validierung: Mindestens 10 Ziffern nach +49 (typische deutsche Nummern)
    // Deutsche Nummern: +49 + 10-11 Ziffern = 13-14 Zeichen total
    const isValidFormat = /^\+\d+$/.test(cleanedPhone);
    const isValidLength = cleanedPhone.length >= 12 && cleanedPhone.length <= 17;

    if (isValidFormat && isValidLength) {
      phoneNumber = cleanedPhone;
      console.log(`✅ Telefonnummer wird übertragen: "${phone}" → E.164: "${cleanedPhone}"`);
    } else {
      console.warn(`⚠️ Telefonnummer ungültig und wird übersprungen:`);
      console.warn(`   Original: "${phone}"`);
      console.warn(`   Bereinigt: "${cleanedPhone}"`);
      console.warn(`   Format OK: ${isValidFormat}`);
      console.warn(`   Länge OK (12-17): ${isValidLength} (aktuell: ${cleanedPhone.length})`);
    }
  }

  // Build attributes object
  const attributes = {
    email: email.toLowerCase().trim(),
    first_name: firstName || '',
    last_name: lastName || '',
  };

  // Telefonnummer nur hinzufügen wenn valide
  if (phoneNumber) {
    attributes.phone_number = phoneNumber;
  }

  // Adresse als Klaviyo location object (Best Practice)
  if (street || city || postalCode) {
    attributes.location = {};
    if (street) attributes.location.address1 = street;
    if (city) attributes.location.city = city;
    if (postalCode) attributes.location.zip = postalCode;
    if (country) attributes.location.country = country || 'DE';
  }

  // Custom Properties
  attributes.properties = {
    ticket_code: ticketCode,
    rubbellos_redeemed: true,
    rubbellos_redeemed_at: new Date().toISOString(),
    website: 'rubbellos.sweetsausallerwelt.de',
    newsletter_consent: newsletterConsent || false
  };

  const payload = {
    data: {
      type: 'profile',
      attributes
    }
  };

  console.log('📤 Erstelle Klaviyo Profile:', email);
  console.log('📋 An Klaviyo gesendete Attribute:', JSON.stringify(attributes, null, 2));

  const response = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();

    // 409 Conflict = Profile existiert bereits → Code zum Array hinzufügen
    if (response.status === 409) {
      console.log('ℹ️ Profile existiert bereits (409) - füge Code zum Array hinzu');

      try {
        const errorData = JSON.parse(errorText);
        const existingProfileId = errorData.errors?.[0]?.meta?.duplicate_profile_id;

        if (existingProfileId) {
          console.log('📥 Hole existierendes Profile:', existingProfileId);

          // 1. Hole das existierende Profile
          const getResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/${existingProfileId}/?additional-fields[profile]=properties`, {
            method: 'GET',
            headers: {
              'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
              'revision': KLAVIYO_REVISION
            }
          });

          if (getResponse.ok) {
            const existingProfile = await getResponse.json();
            const existingTicketCode = existingProfile.data?.attributes?.properties?.ticket_code;

            console.log('📋 Existierender ticket_code:', existingTicketCode);

            // 2. Erstelle Array mit alten + neuen Codes
            let ticketCodes = [];
            if (Array.isArray(existingTicketCode)) {
              // Bereits ein Array → neuen Code hinzufügen
              ticketCodes = [...existingTicketCode, ticketCode];
            } else if (existingTicketCode) {
              // Einzelner Wert → in Array konvertieren
              ticketCodes = [existingTicketCode, ticketCode];
            } else {
              // Kein Wert vorhanden → neues Array
              ticketCodes = [ticketCode];
            }

            // Duplikate entfernen
            ticketCodes = [...new Set(ticketCodes)];
            console.log('📝 Neue ticket_codes:', ticketCodes);

            // 3. Update attributes mit Code-Array
            attributes.properties.ticket_code = ticketCodes;

            // 4. UPDATE existierendes Profile
            const updateResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/${existingProfileId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                'revision': KLAVIYO_REVISION,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log('✅ Profile aktualisiert mit Code-Array:', updateResult.data?.id);
              return updateResult.data;
            }
          }
        }
      } catch (parseError) {
        console.error('❌ Fehler beim Profile-Update:', parseError);
      }

      // Fallback: Gib existierendes Profile zurück
      return { id: 'existing-profile', email: email.toLowerCase().trim() };
    }

    // Alle anderen Fehler werfen
    console.error('❌ Klaviyo Profile Error:', errorText);
    throw new Error(`Klaviyo Profile konnte nicht erstellt werden: ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ Klaviyo Profile erstellt:', result.data?.id);
  console.log('📥 Klaviyo Response:', JSON.stringify(result.data, null, 2));

  return result.data;
}

/**
 * Trackt ein Event in Klaviyo
 */
async function trackKlaviyoEvent(profileId, eventName, properties) {
  const payload = {
    data: {
      type: 'event',
      attributes: {
        profile: {
          data: {
            type: 'profile',
            id: profileId
          }
        },
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: eventName
            }
          }
        },
        properties: properties,
        time: new Date().toISOString()
      }
    }
  };

  console.log(`📊 Tracke Event "${eventName}" für Profile ${profileId}`);

  const response = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Klaviyo Event Error:', response.status, errorText);
    return null;
  }

  // Event API gibt 202 Accepted zurück ohne Body
  if (response.status === 202) {
    console.log('✅ Event getrackt:', eventName, '(202 Accepted)');
    return { accepted: true };
  }

  try {
    const result = await response.json();
    console.log('✅ Event getrackt:', eventName);
    return result;
  } catch (e) {
    // Manche Responses haben keinen Body - das ist OK
    console.log('✅ Event getrackt:', eventName, '(no response body)');
    return { success: true };
  }
}

/**
 * Abonniert Profile für Newsletter mit Double-Opt-In
 * Klaviyo sendet automatisch Double-Opt-In Email wenn in Liste aktiviert
 */
async function subscribeToKlaviyoList(profileId, email) {
  console.log(`📬 Starte Newsletter-Anmeldung für ${email} (Double-Opt-In)`);

  const payload = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: 'Rubbellos Website',
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email: email.toLowerCase().trim(),
                subscriptions: {
                  email: {
                    marketing: {
                      consent: 'SUBSCRIBED'  // Klaviyo handhabt Double-Opt-In automatisch
                    }
                  }
                }
              }
            }
          ]
        }
      },
      relationships: {
        list: {
          data: {
            type: 'list',
            id: KLAVIYO_LIST_ID
          }
        }
      }
    }
  };

  const response = await fetch(`${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Klaviyo Double-Opt-In Error:', response.status, errorText);
    return null;
  }

  // 202 Accepted = Job created successfully
  if (response.status === 202) {
    console.log('✅ Double-Opt-In Email wird versendet (202 Accepted)');
    return true;
  }

  try {
    const result = await response.json();
    console.log('✅ Newsletter-Anmeldung gestartet:', result);
    return true;
  } catch (e) {
    console.log('✅ Newsletter-Anmeldung gestartet (no response body)');
    return true;
  }
}

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
      newsletterConsent = false
    } = data;

    console.log('\n🎫 === GOLDEN TICKET API START ===');
    console.log('📧 Email:', email);
    console.log('🎟️ Code:', ticketCode);
    console.log('📬 Newsletter Consent:', newsletterConsent);

    // ===== VALIDIERUNG =====
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

    // ===== KLAVIYO INTEGRATION =====

    // 1. Klaviyo Profile erstellen/updaten
    let profile;
    try {
      profile = await createOrUpdateKlaviyoProfile({
        email,
        firstName,
        lastName,
        phone,
        ticketCode,
        street,
        city,
        postalCode,
        country,
        newsletterConsent
      });
    } catch (error) {
      console.error('❌ Klaviyo Profile Fehler:', error);
      return Response.json(
        { message: 'Fehler beim Speichern der Daten' },
        { status: 500 }
      );
    }

    // 2. Event tracken: "Rubbellos Redeemed"
    try {
      await trackKlaviyoEvent(profile.id, 'Rubbellos Redeemed', {
        ticket_code: ticketCode,
        website: 'rubbellos.sweetsausallerwelt.de',
        has_address: !!(street && city && postalCode),
        newsletter_consent: newsletterConsent
      });
    } catch (error) {
      console.warn('⚠️ Event konnte nicht getrackt werden:', error.message);
    }

    // 3. IMMER zur Liste hinzufügen (egal ob Newsletter-Consent oder nur Teilnahmebedingungen)
    try {
      const subscribed = await subscribeToKlaviyoList(profile.id, email);
      if (!subscribed) {
        console.warn('⚠️ Newsletter-Subscription fehlgeschlagen - siehe Fehler oben');
      }
    } catch (error) {
      console.warn('⚠️ Newsletter-Subscription Exception:', error.message);
    }

    console.log('🎫 === GOLDEN TICKET API ENDE ===\n');

    // ===== SUCCESS RESPONSE =====
    // Emails werden über Klaviyo Flows gesendet (siehe unten für Setup)
    return Response.json({
      success: true,
      message: "Teilnahme erfolgreich registriert",
      ticketCode,
      email,
      klaviyo_profile_id: profile.id,
      newsletter_subscribed: newsletterConsent
    });

  } catch (error) {
    console.error('❌ Golden Ticket API Error:', error);
    return Response.json(
      {
        message: "Interner Server-Fehler",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
