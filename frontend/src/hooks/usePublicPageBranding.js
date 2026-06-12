import { useEffect } from "react";
import { resolveMediaUrl } from "../lib/api";

const DEFAULT_TITLE = "RP Signage | Digital Signage Software, Token System, LED Video Wall & TV Solutions";
const DEFAULT_FAVICON = "/logo.png";

export function usePublicPageBranding(pageTitle, logoUrl) {
  useEffect(() => {
    const prevTitle = document.title;
    const iconLink = document.querySelector("link[rel='icon']");
    const prevIcon = iconLink?.getAttribute("href") || DEFAULT_FAVICON;

    if (pageTitle) {
      document.title = pageTitle;
    }

    if (iconLink && logoUrl) {
      iconLink.href = resolveMediaUrl(logoUrl);
    }

    return () => {
      document.title = prevTitle || DEFAULT_TITLE;
      if (iconLink) iconLink.href = prevIcon;
    };
  }, [pageTitle, logoUrl]);
}
