import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateInvitePassword(length = 14) {
  const bytes = randomBytes(length);
  let value = "";
  for (const byte of bytes) {
    value += alphabet[byte % alphabet.length];
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return `${value.slice(0, -2)}K4`;
  }
  return value;
}
