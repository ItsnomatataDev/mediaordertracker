import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { getAppUrl, getAuthSecret } from "@/lib/env";

export const auth = betterAuth({
  appName: "IT's No Matata Media Portal",
  secret: getAuthSecret(),
  baseURL: getAppUrl(),
  trustedOrigins: [getAppUrl()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 30,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
    },
  },
  advanced: {
    cookiePrefix: "matata",
    useSecureCookies: (process.env.APP_URL || "").startsWith("https://"),
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
