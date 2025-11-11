export function generateNameFromEmail(email: string): string {
  const prefix = email.split("@")[0];
  // Remove special characters, keep only alphanumeric
  return prefix.replace(/[^a-zA-Z0-9]/g, "");
}
