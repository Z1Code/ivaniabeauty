export type FooterSocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "youtube"
  | "linkedin"
  | "custom";

export interface FooterSocialLink {
  id: string;
  platform: FooterSocialPlatform;
  label: string;
  href: string;
}

export interface FooterSettings {
  contactEmail: string;
  whatsappNumber: string;
  whatsappMessage: string;
  socialLinks: FooterSocialLink[];
}

export const FOOTER_SETTINGS_STORAGE_KEY = "ivania_settings_footer";
export const FOOTER_SETTINGS_UPDATED_EVENT = "ivania:footer-settings-updated";

export const FOOTER_SOCIAL_PLATFORM_OPTIONS: FooterSocialPlatform[] = [
  "instagram",
  "tiktok",
  "facebook",
  "x",
  "youtube",
  "linkedin",
  "custom",
];

const DEFAULT_SOCIAL_LABELS: Record<FooterSocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  custom: "Enlace personalizado",
};

const MAX_SOCIAL_LINKS = 12;

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  contactEmail: "ivaniabeauty2@gmail.com",
  whatsappNumber: "+1 (234) 567-890",
  whatsappMessage: "Hola! Quiero mas informacion sobre Ivania Beauty.",
  socialLinks: [
    {
      id: "instagram",
      platform: "instagram",
      label: "Instagram",
      href: "https://instagram.com/ivaniabeauty2",
    },
    {
      id: "tiktok",
      platform: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@ivaniabeauty2",
    },
    {
      id: "facebook",
      platform: "facebook",
      label: "Facebook",
      href: "https://facebook.com",
    },
    {
      id: "x",
      platform: "x",
      label: "X",
      href: "https://x.com",
    },
  ],
};

function isFooterSocialPlatform(value: unknown): value is FooterSocialPlatform {
  return (
    typeof value === "string" &&
    FOOTER_SOCIAL_PLATFORM_OPTIONS.includes(value as FooterSocialPlatform)
  );
}

function normalizeExternalUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";

  const tryParse = (candidate: string): string => {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch {
      return "";
    }
    return "";
  };

  const direct = tryParse(raw);
  if (direct) return direct;

  if (!raw.includes("://")) {
    return tryParse(`https://${raw}`);
  }

  return "";
}

function sanitizeWhatsappNumber(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_FOOTER_SETTINGS.whatsappNumber;
  }
  const normalized = value.trim();
  return normalized || DEFAULT_FOOTER_SETTINGS.whatsappNumber;
}

function sanitizeWhatsappMessage(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_FOOTER_SETTINGS.whatsappMessage;
  }
  const normalized = value.trim();
  return normalized || DEFAULT_FOOTER_SETTINGS.whatsappMessage;
}

function getDefaultSocialLabel(platform: FooterSocialPlatform): string {
  return DEFAULT_SOCIAL_LABELS[platform];
}

function sanitizeSocialLink(
  value: unknown,
  index: number
): FooterSocialLink | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<FooterSocialLink>;
  if (!isFooterSocialPlatform(candidate.platform)) return null;

  const href = normalizeExternalUrl(candidate.href);
  if (!href) return null;

  const baseId = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const id = baseId || `${candidate.platform}-${index + 1}`;

  const baseLabel =
    typeof candidate.label === "string" ? candidate.label.trim() : "";

  return {
    id,
    platform: candidate.platform,
    label: baseLabel || getDefaultSocialLabel(candidate.platform),
    href,
  };
}

export function createFooterSocialLink(
  platform: FooterSocialPlatform = "instagram",
  index = 0
): FooterSocialLink {
  return {
    id: `${platform}-${Date.now()}-${Math.max(index, 0)}`,
    platform,
    label: getDefaultSocialLabel(platform),
    href: "",
  };
}

export function sanitizeFooterSettings(input: unknown): FooterSettings {
  if (!input || typeof input !== "object") {
    return DEFAULT_FOOTER_SETTINGS;
  }

  const candidate = input as Partial<FooterSettings>;

  const customSocialLinks = Array.isArray(candidate.socialLinks)
    ? candidate.socialLinks
    : null;
  const sanitizedSocialLinks = customSocialLinks
    ? customSocialLinks
        .map((item, index) => sanitizeSocialLink(item, index))
        .filter((item): item is FooterSocialLink => item !== null)
        .slice(0, MAX_SOCIAL_LINKS)
    : DEFAULT_FOOTER_SETTINGS.socialLinks;

  const rawEmail = typeof candidate.contactEmail === "string" ? candidate.contactEmail.trim() : "";
  const contactEmail = rawEmail || DEFAULT_FOOTER_SETTINGS.contactEmail;

  return {
    contactEmail,
    whatsappNumber: sanitizeWhatsappNumber(candidate.whatsappNumber),
    whatsappMessage: sanitizeWhatsappMessage(candidate.whatsappMessage),
    socialLinks: sanitizedSocialLinks,
  };
}

export function parseFooterSettings(
  raw: string | null | undefined
): FooterSettings {
  if (!raw) {
    return DEFAULT_FOOTER_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeFooterSettings(parsed);
  } catch {
    return DEFAULT_FOOTER_SETTINGS;
  }
}

export function getFooterSocialDefaultLabel(
  platform: FooterSocialPlatform
): string {
  return getDefaultSocialLabel(platform);
}

export function toWhatsappUrl(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, "");
  const text = encodeURIComponent(message.trim());
  if (!digits) {
    return "";
  }
  return text
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/${digits}`;
}
