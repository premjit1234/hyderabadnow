import type { AmenityIconKey } from "@/lib/amenities";

export default function AmenityIcon({ icon, className }: { icon: AmenityIconKey; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (icon) {
    case "pool":
      return (
        <svg {...common}>
          <path d="M3 9c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
          <path d="M3 15c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
        </svg>
      );
    case "gym":
      return (
        <svg {...common}>
          <path d="M4 9v6M20 9v6" />
          <path d="M2 12h2M20 12h2" />
          <path d="M7 7v10M17 7v10" />
          <path d="M7 12h10" />
        </svg>
      );
    case "hall":
      return (
        <svg {...common}>
          <path d="M4 21V10l8-6 8 6v11" />
          <path d="M4 21h16M9 21v-6h6v6" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 6v3M12 15v3M6 12h3M15 12h3" />
        </svg>
      );
    case "garden":
      return (
        <svg {...common}>
          <path d="M12 21V11" />
          <path d="M12 12c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z" />
          <path d="M12 9c0-3 2-5.5 5-6 0 3-2 5.5-5 6Z" />
        </svg>
      );
    case "track":
      return (
        <svg {...common}>
          <rect x="3.5" y="7" width="17" height="10" rx="5" />
          <rect x="7.5" y="9.5" width="9" height="5" rx="2.5" />
        </svg>
      );
    case "games":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="9" rx="3" />
          <path d="M8 10.5v4M6 12.5h4" />
          <circle cx="16" cy="11" r="0.8" fill="currentColor" />
          <circle cx="18" cy="13" r="0.8" fill="currentColor" />
        </svg>
      );
    case "sports":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M10.5 6v9M6 10.5h9" />
          <path d="M14.8 14.8 20 20" />
        </svg>
      );
    case "yoga":
      return (
        <svg {...common}>
          <circle cx="12" cy="6" r="2" />
          <path d="M4 18c2-3 5-4 8-4s6 1 8 4" />
          <path d="M12 14V9" />
        </svg>
      );
    case "spa":
      return (
        <svg {...common}>
          <path d="M12 21c4-2 6-5 6-9a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 4 2 7 6 9Z" />
          <path d="M12 12v-3" />
        </svg>
      );
    case "cafe":
      return (
        <svg {...common}>
          <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
          <path d="M16 10.5h1.5a2 2 0 0 1 0 4H16" />
          <path d="M8 4c-.5 1 .5 1.3 0 2.3M12 4c-.5 1 .5 1.3 0 2.3" />
        </svg>
      );
    case "grocery":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "pharmacy":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" />
        </svg>
      );
    case "power":
      return (
        <svg {...common}>
          <path d="M13 3 5 14h5l-1 7 8-11h-5l1-7Z" strokeLinejoin="round" />
        </svg>
      );
    case "lift":
      return (
        <svg {...common}>
          <rect x="6" y="3.5" width="12" height="17" rx="2" />
          <path d="M10 9.5 12 7l2 2.5M10 14.5 12 17l2-2.5" />
        </svg>
      );
    case "parking":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M9.5 16V8h3a2.7 2.7 0 0 1 0 5.4h-3" />
        </svg>
      );
    case "pet":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <ellipse cx="12" cy="16" rx="4.2" ry="3.4" />
          <circle cx="6.5" cy="10" r="1.6" />
          <circle cx="10.2" cy="7.2" r="1.6" />
          <circle cx="13.8" cy="7.2" r="1.6" />
          <circle cx="17.5" cy="10" r="1.6" />
        </svg>
      );
    case "wifi":
      return (
        <svg {...common}>
          <path d="M4 9.5c4.5-4 11.5-4 16 0" />
          <path d="M7 13c2.8-2.3 7.2-2.3 10 0" />
          <path d="M10 16.5c1.2-1 2.8-1 4 0" />
          <circle cx="12" cy="19" r="0.9" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      );
  }
}
