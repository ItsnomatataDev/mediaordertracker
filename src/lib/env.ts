function isBuildTime() {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-production-compile"
  );
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function trimSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function getAppUrl() {
  const fromEnv = process.env.APP_URL || process.env.BETTER_AUTH_URL;
  if (fromEnv) return trimSlash(fromEnv);
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://media.itsnomatata.com";
}

export function getPublicAppUrl(_headerList?: Headers | null) {
  return getAppUrl();
}

export function getTrustedOrigins() {
  const origins = new Set<string>([getAppUrl()]);
  for (const extra of (process.env.AUTH_TRUSTED_ORIGINS || "").split(",")) {
    const value = trimSlash(extra.trim());
    if (value) origins.add(value);
  }
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  origins.add("http://localhost:3001");
  origins.add("http://127.0.0.1:3001");
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return [...origins];
}

export function getLocationPrefix() {
  return process.env.LOCATION_PREFIX || "ZHC";
}

export function getSupportWhatsApp() {
  return process.env.SUPPORT_WHATSAPP || "";
}

export function getSupportEmail() {
  return (process.env.SUPPORT_EMAIL || "media@itsnomatata.com").trim();
}

export function useSecureAuthCookies() {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production" && getAppUrl().startsWith("https://");
}

export function getAuthSecret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (value) return value;
  // Next collects page data at build time and imports auth. A dummy is enough
  // there; runtime still requires the real secret.
  if (isBuildTime()) {
    return "build-placeholder-not-used-at-runtime";
  }
  return required("BETTER_AUTH_SECRET");
}

export function mailConfig() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;
  return {
    apiKey,
    from: (process.env.EMAIL_FROM || "IT's No Matata <media@itsnomatata.com>").trim(),
  };
}

export function getMailStatus() {
  const mail = mailConfig();
  if (!mail) {
    return {
      configured: false as const,
      message:
        "Mail is not configured yet (RESEND_API_KEY is empty). Invites still create accounts; share the temporary PIN until Resend is set.",
    };
  }
  return {
    configured: true as const,
    message: `Invites send from ${mail.from} via Resend.`,
  };
}

export function mailErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid api key|unauthorized|401|403/i.test(message)) {
    return "Resend rejected the API key. Check RESEND_API_KEY.";
  }
  if (/domain is not verified|not verified/i.test(message)) {
    return "Resend has not verified itsnomatata.com yet. Verify the domain, then send from media@itsnomatata.com.";
  }
  return message || "Could not send the email.";
}
