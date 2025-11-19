import fs from 'fs';
import path from 'path';

// Pfad zur Datenbank-Datei
const DB_PATH = path.join(process.cwd(), 'data', 'used-codes.json');

/**
 * Lädt die Code-Datenbank
 * @returns {Object} Datenbank-Objekt mit verwendeten Codes
 */
function loadDatabase() {
  try {
    // Prüfe ob Datei existiert
    if (!fs.existsSync(DB_PATH)) {
      console.log('📁 used-codes.json existiert noch nicht, erstelle leere Datenbank');
      return {};
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');

    // Prüfe ob Datei leer ist
    if (!data || data.trim() === '') {
      console.log('📁 used-codes.json ist leer, verwende leere Datenbank');
      return {};
    }

    const parsed = JSON.parse(data);
    return parsed || {};
  } catch (error) {
    console.error('❌ Fehler beim Laden der Datenbank:', error.message);
    // Bei Fehler: leere Datenbank zurückgeben statt zu crashen
    return {};
  }
}

/**
 * Speichert die Code-Datenbank
 * @param {Object} db - Datenbank-Objekt
 */
function saveDatabase(db) {
  try {
    // Stelle sicher, dass data/ Ordner existiert
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ Datenbank gespeichert:', Object.keys(db).length, 'Einträge');
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Datenbank:', error.message);
    throw new Error('Datenbank konnte nicht gespeichert werden');
  }
}

/**
 * Validiert einen Code
 * @param {string} code - 8-stelliger Ticket-Code
 * @param {string} campaign - Kampagnen-Name (z.B. "goldenticket_2025")
 * @returns {{valid: boolean, error?: string, usedBy?: string, usedAt?: string}}
 */
function validateCode(code, campaign = 'goldenticket_2025') {
  // Input-Validierung
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Ungültiger Code' };
  }

  const normalizedCode = code.toUpperCase().trim();

  // Code-Format prüfen
  if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
    return { valid: false, error: 'Code muss genau 8 Zeichen (A-Z, 0-9) enthalten' };
  }

  // Datenbank laden
  const db = loadDatabase();

  // Prüfe ob Code bereits verwendet wurde
  if (db[normalizedCode]) {
    const entry = db[normalizedCode];
    return {
      valid: false,
      error: 'Dieser Code wurde bereits eingelöst',
      usedBy: entry.email || 'Unbekannt',
      usedAt: entry.timestamp || 'Unbekannt'
    };
  }

  return { valid: true };
}

/**
 * Validiert eine E-Mail-Adresse
 * @param {string} email - E-Mail-Adresse
 * @param {string} campaign - Kampagnen-Name
 * @returns {{valid: boolean, error?: string, existingCodes?: string[]}}
 */
function validateEmail(email, campaign = 'goldenticket_2025') {
  // Input-Validierung
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Ungültige E-Mail-Adresse' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // E-Mail-Format prüfen
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: 'Ungültiges E-Mail-Format' };
  }

  // Datenbank laden
  const db = loadDatabase();

  // Prüfe ob diese E-Mail bereits einen Code für diese Kampagne eingelöst hat
  const existingEntries = Object.values(db).filter(entry => {
    // Defensive Programmierung: Prüfe ob entry.email existiert
    if (!entry || !entry.email) {
      console.warn('⚠️ Eintrag ohne E-Mail gefunden:', entry);
      return false;
    }

    return entry.email.toLowerCase() === normalizedEmail &&
           entry.campaign === campaign;
  });

  if (existingEntries.length > 0) {
    const codes = existingEntries.map(e => e.code || 'Unbekannt');
    return {
      valid: false,
      error: 'Diese E-Mail-Adresse hat bereits an diesem Gewinnspiel teilgenommen',
      existingCodes: codes
    };
  }

  return { valid: true };
}

/**
 * Markiert einen Code als verwendet
 * @param {string} code - 8-stelliger Code
 * @param {string} email - E-Mail-Adresse
 * @param {Object} additionalData - Zusätzliche Daten (firstName, lastName, etc.)
 * @returns {{success: boolean, error?: string}}
 */
function markCodeAsUsed(code, email, additionalData = {}) {
  try {
    const normalizedCode = code.toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Datenbank laden
    const db = loadDatabase();

    // Entry erstellen
    db[normalizedCode] = {
      code: normalizedCode,
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      campaign: additionalData.campaign || 'goldenticket_2025',
      website: additionalData.website || 'goldenticket.sweetsausallerwelt.de',
      firstName: additionalData.firstName || '',
      lastName: additionalData.lastName || '',
      phone: additionalData.phone || '',
      ...additionalData
    };

    // Speichern
    saveDatabase(db);

    console.log('✅ Code markiert als verwendet:', normalizedCode, 'von', normalizedEmail);
    return { success: true };

  } catch (error) {
    console.error('❌ Fehler beim Markieren des Codes:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Hauptvalidierungs-Funktion
 * Kombiniert Code- und E-Mail-Validierung
 * @param {string} code - 8-stelliger Code
 * @param {string} email - E-Mail-Adresse
 * @param {string} campaign - Kampagnen-Name
 * @returns {{valid: boolean, error?: string, details?: Object}}
 */
function validateSubmission(code, email, campaign = 'goldenticket_2025') {
  // Code validieren
  const codeValidation = validateCode(code, campaign);
  if (!codeValidation.valid) {
    return {
      valid: false,
      error: codeValidation.error,
      details: codeValidation
    };
  }

  // E-Mail validieren
  const emailValidation = validateEmail(email, campaign);
  if (!emailValidation.valid) {
    return {
      valid: false,
      error: emailValidation.error,
      details: emailValidation
    };
  }

  return { valid: true };
}

/**
 * Statistik-Funktion
 * @param {string} campaign - Optional: Filter nach Kampagne
 * @returns {Object} Statistik-Objekt
 */
function getStatistics(campaign = null) {
  const db = loadDatabase();
  const entries = Object.values(db);

  // Filter nach Kampagne wenn angegeben
  const filtered = campaign
    ? entries.filter(e => e && e.campaign === campaign)
    : entries;

  return {
    totalCodes: filtered.length,
    uniqueEmails: new Set(filtered.map(e => e.email).filter(Boolean)).size,
    byCampaign: entries.reduce((acc, entry) => {
      if (!entry || !entry.campaign) return acc;
      acc[entry.campaign] = (acc[entry.campaign] || 0) + 1;
      return acc;
    }, {}),
    byWebsite: entries.reduce((acc, entry) => {
      if (!entry || !entry.website) return acc;
      acc[entry.website] = (acc[entry.website] || 0) + 1;
      return acc;
    }, {})
  };
}

export {
  validateCode,
  validateEmail,
  validateSubmission,
  markCodeAsUsed,
  getStatistics,
  loadDatabase,
  saveDatabase
};
