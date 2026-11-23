/**
 * Robust WhatsApp URL formatter and validator.
 * Accepts domestic Israeli formats (050-XXXXXXX), international formats (+972...),
 * raw digits, or pre-existing https://wa.me links, and normalizes them into
 * a direct, reliable WhatsApp navigation URL.
 */
export function formatWhatsAppUrl(
  input?: string,
  prefilledText?: string
): string {
  const fallbackNumber = '972506821213';

  if (!input || !input.trim()) {
    const textQuery = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : '';
    return `https://wa.me/${fallbackNumber}${textQuery}`;
  }

  const raw = input.trim();

  // If already a full URL (wa.me, api.whatsapp.com, etc.)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (prefilledText && !raw.includes('text=')) {
      const sep = raw.includes('?') ? '&' : '?';
      return `${raw}${sep}text=${encodeURIComponent(prefilledText)}`;
    }
    return raw;
  }

  // Strip all non-digit characters
  let cleanDigits = raw.replace(/\D/g, '');

  // Handle Israeli local mobile format: 05X-XXXXXXX (10 digits starting with 0) -> 9725X...
  if (cleanDigits.startsWith('0') && cleanDigits.length === 10) {
    cleanDigits = '972' + cleanDigits.slice(1);
  }

  if (!cleanDigits) {
    cleanDigits = fallbackNumber;
  }

  const textQuery = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : '';
  return `https://wa.me/${cleanDigits}${textQuery}`;
}
