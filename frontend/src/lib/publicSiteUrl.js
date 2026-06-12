import { isCustomPublicHost } from "./publicCustomerApi";

export function publicSiteUrl(clientRef, { resolvedHost = null, vertical = "doctor" } = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const custom = resolvedHost || (typeof window !== "undefined" && isCustomPublicHost(window.location.hostname));
  if (custom) return origin || "/";
  const ref = encodeURIComponent(clientRef || "");
  if (vertical === "retailer") return `${origin}/store/${ref}`;
  return `${origin}/book/${ref}`;
}
