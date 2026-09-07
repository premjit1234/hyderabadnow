// The fixed set of platforms the admin can pick from when adding a social
// link (src/app/admin/social-links) — each maps to an icon in
// components/SocialIcon.tsx. "other" covers anything not in this list (a
// generic link/globe icon renders for it).
export const SOCIAL_PLATFORM_KEYS = [
  "x",
  "linkedin",
  "instagram",
  "facebook",
  "youtube",
  "whatsapp",
  "other",
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORM_KEYS)[number];

export const SOCIAL_PLATFORMS: { key: SocialPlatformKey; label: string }[] = [
  { key: "x", label: "X (Twitter)" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "other", label: "Other" },
];
