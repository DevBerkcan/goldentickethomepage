export default async function handler(req, res) {
  const { code } = req.body;
  
  // Prüfe ob Code in Datenbank existiert
  // Prüfe ob Code bereits eingelöst wurde
  // Markiere Code als verwendet
  
  if (codeValid && !codeUsed) {
    return res.status(200).json({ valid: true });
  }
  return res.status(400).json({ valid: false, message: "Code ungültig oder bereits verwendet" });
}