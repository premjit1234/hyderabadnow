// Turns a user-entered phone number into the digits-only, country-code-prefixed
// format wa.me links require (no "+", no spaces/dashes). Listings on this site
// are Hyderabad-only, so we assume India (+91) for anything that looks like a
// bare local number; a number that already includes a country code is left as-is.
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`; // plain 10-digit mobile number
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`; // leading trunk 0
  return digits; // already has a country code (e.g. 91XXXXXXXXXX), or unusual — pass through
}

/** Builds a wa.me link that opens a chat with the given phone number and a pre-filled message. */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
}
