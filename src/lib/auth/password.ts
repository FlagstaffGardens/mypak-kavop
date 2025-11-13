/**
 * Verify plain-text password
 * @param password Password entered by user
 * @param storedPassword Password from database (plain-text)
 * @returns true if passwords match
 */
export function verifyPassword(
  password: string,
  storedPassword: string
): boolean {
  return password === storedPassword;
}
