import { randomBytes } from "node:crypto";

export function generateInvitePassword() {
  const value = randomBytes(2).readUInt16BE(0) % 10000;
  return String(value).padStart(4, "0");
}
