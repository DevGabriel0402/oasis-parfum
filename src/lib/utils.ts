import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte links de compartilhamento do Google Drive, Dropbox, etc. em URLs diretas de imagem.
 */
export function normalizeImageUrl(url: unknown): string {
  if (!url) return "";
  let clean = String(url).trim().replace(/^["']|["']$/g, "").trim();
  if (
    !clean ||
    clean.toLowerCase() === "null" ||
    clean.toLowerCase() === "undefined" ||
    clean === "-" ||
    clean === "—"
  ) {
    return "";
  }

  // Google Drive: converte para CDN direto do Google
  const driveMatch = clean.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i,
  );
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Dropbox: converte para link direto com raw=1
  if (clean.includes("dropbox.com")) {
    clean = clean.replace(/[?&]dl=[01]/g, "");
    return clean.includes("?") ? `${clean}&raw=1` : `${clean}?raw=1`;
  }

  // OneDrive: converte links compartilhados
  if (clean.includes("1drv.ms") || clean.includes("onedrive.live.com")) {
    clean = clean.replace("redir?", "download?");
  }

  // Corrige links sem protocolo (//example.com)
  if (clean.startsWith("//")) {
    clean = "https:" + clean;
  }

  return clean;
}
