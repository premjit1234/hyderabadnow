// Deliberately generic, simplified pictograms for each platform rather than
// reproductions of their specific trademarked logomarks — enough to be
// recognizable as "this links to our X / LinkedIn / Instagram page" without
// copying any company's registered brand assets. Same reasoning as the
// WhatsApp contact icon on the listing detail page (whose path this reuses
// for the "whatsapp" case).
export default function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path d="M5 5l14 14M19 5 5 19" strokeLinecap="round" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
          <circle cx="8.2" cy="9" r="1" fill="currentColor" stroke="none" />
          <path d="M8.2 11.4v6M12.2 17.4v-4.1c0-1.4 1-2.3 2.15-2.3s2.05.9 2.05 2.3v4.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
          <path d="M4 8.3 8 6h8l4 2.3V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.3Z" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.1" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
          <path d="M4 12a8 8 0 1 1 4.2 7.05L4 20l1.1-3.6A7.96 7.96 0 0 1 4 12Z" strokeLinejoin="round" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
          <rect x="3.5" y="6" width="17" height="12" rx="3" />
          <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.1-1.34A10 10 0 1 0 12 2Zm0 18.2a8.16 8.16 0 0 1-4.17-1.14l-.3-.18-3.03.8.81-2.95-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.24-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.24-.65.81-.8.98-.15.17-.29.19-.54.06-.24-.12-1.03-.38-1.97-1.22-.73-.65-1.22-1.45-1.36-1.7-.15-.24-.02-.37.11-.5.11-.11.24-.29.36-.44.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.24-.87.85-.87 2.08s.9 2.41 1.02 2.58c.12.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      );
    default:
      // "other" and any unrecognized value — generic globe/link icon.
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5s1.3-6.1 3.8-8.5Z" />
        </svg>
      );
  }
}
