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
  return process.env.SUPPORT_EMAIL || "";
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

export function smtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim().replaceAll(" ", "");
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user,
    pass,
    from: (process.env.SMTP_FROM || user).trim(),
  };
}

export function getSmtpStatus() {
  const smtp = smtpConfig();
  if (!smtp) {
    return {
      configured: false as const,
      message:
        "Mail is not configured yet (SMTP_PASS is empty). Invites still create accounts; share the temporary password until Google Workspace mail is set.",
    };
  }
  return {
    configured: true as const,
    message: `Invites send from ${smtp.from} via ${smtp.host}.`,
  };
}

export function smtpErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/EAUTH|invalid login|username and password not accepted/i.test(message)) {
    return "SMTP login failed. Use a Google Workspace app password in SMTP_PASS.";
  }
  if (/ECONNECTION|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return "Could not reach the mail server. Check SMTP_HOST and that outbound 465/587 is open.";
  }
  return message || "Could not send the invite email.";
}
