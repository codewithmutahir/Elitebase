import bcrypt from "bcryptjs";

export function generateEmployeePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function hashEmployeePin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function verifyEmployeePin(pin: string, stored: string) {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(pin, stored);
  }
  // Legacy rows: plain PIN stored in `pin` column before hashing was enforced.
  return stored === pin;
}
