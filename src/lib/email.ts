import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getAppUrl, getSupportEmail, smtpConfig } from "@/lib/env";
import { jobPublicPath } from "@/lib/format";

export function canSendEmail() {
  return smtpConfig() !== null;
}

function transporter() {
  const smtp = smtpConfig();
  if (!smtp) {
    throw new Error("Email is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const options: SMTPTransport.Options = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  };

  if (smtp.port === 587) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
}

function logoUrl() {
  return `${getAppUrl()}/logo.png`;
}

function brandedHtml(input: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  reference: string;
}) {
  const support = getSupportEmail();
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#ffffff;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;border:1px solid #e5e5e5;">
          <tr>
            <td style="background:#0a0a0a;padding:20px 24px;text-align:center;">
              <img src="${logoUrl()}" alt="IT's No Matata" width="96" height="96" style="display:block;margin:0 auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a0a0a;">${escapeHtml(input.heading)}</h1>
              ${input.body}
              <p style="margin:28px 0 0;">
                <a href="${input.ctaUrl}" style="display:inline-block;background:#e95a24;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:700;font-size:14px;border-radius:4px;">
                  ${escapeHtml(input.ctaLabel)}
                </a>
              </p>
              <p style="margin:20px 0 0;font-size:13px;color:#5c5c5c;">
                Order: <strong style="color:#0a0a0a;">${escapeHtml(input.reference)}</strong><br />
                Keep this link. It does not change.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#5c5c5c;word-break:break-all;">
                ${escapeHtml(input.ctaUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e5e5;font-size:12px;color:#5c5c5c;">
              IT's No Matata — making IT problem free
              ${support ? `<br />Support: ${escapeHtml(support)}` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function send(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const smtp = smtpConfig();
  if (!smtp) {
    throw new Error("Email is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const mailer = transporter();
  await mailer.sendMail({
    from: smtp.from,
    replyTo: getSupportEmail() || smtp.user,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendJobCreatedEmail(input: {
  to: string;
  guestName: string;
  reference: string;
  publicToken: string;
}) {
  const pageUrl = `${getAppUrl()}${jobPublicPath(input.publicToken)}`;
  await send({
    to: input.to,
    subject: `Keep this link for your Victoria Falls flight media (${input.reference})`,
    text: [
      `Hi ${input.guestName},`,
      "",
      "This is your personal media page. Bookmark it — your photos and video will appear here when they are ready.",
      pageUrl,
      "",
      `Order: ${input.reference}`,
      "",
      "Do not use the QR on your tax receipt. This is the collection page.",
      "",
      "IT's No Matata",
    ].join("\n"),
    html: brandedHtml({
      preheader: "Your personal media page is ready. Keep this link.",
      heading: `Hi ${input.guestName}`,
      body: `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#0a0a0a;">This is your personal media page. Bookmark it. Your photos and video will appear here when they are ready — usually within 24 hours.</p>
             <p style="margin:0;font-size:15px;line-height:1.55;color:#0a0a0a;">Do not scan the QR on your tax receipt. Use this page only.</p>`,
      ctaLabel: "Open my media page",
      ctaUrl: pageUrl,
      reference: input.reference,
    }),
  });
}

export async function sendReadyEmail(input: {
  to: string;
  guestName: string;
  reference: string;
  publicToken: string;
}) {
  const pageUrl = `${getAppUrl()}${jobPublicPath(input.publicToken)}`;
  await send({
    to: input.to,
    subject: `Your Victoria Falls flight media is ready (${input.reference})`,
    text: [
      `Hi ${input.guestName},`,
      "",
      "Your photos and video are ready.",
      "Open your personal media page — this link does not change:",
      pageUrl,
      "",
      `Order: ${input.reference}`,
      "",
      "IT's No Matata",
    ].join("\n"),
    html: brandedHtml({
      preheader: "Your flight media is ready to download.",
      heading: `Hi ${input.guestName}`,
      body: `<p style="margin:0;font-size:15px;line-height:1.55;color:#0a0a0a;">Your photos and video are ready. Download them from your personal media page. This link does not change.</p>`,
      ctaLabel: "Download my media",
      ctaUrl: pageUrl,
      reference: input.reference,
    }),
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
