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

export function getAppUrl() {
  const fromEnv = process.env.APP_URL || process.env.BETTER_AUTH_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getTrustedOrigins() {
  const origins = new Set<string>([getAppUrl()]);
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
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user,
    pass,
    from: process.env.SMTP_FROM || user,
  };
}
