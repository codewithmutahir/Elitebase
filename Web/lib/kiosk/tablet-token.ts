import { randomBytes } from "crypto";

export function generateTabletToken() {
  return randomBytes(32).toString("hex");
}
