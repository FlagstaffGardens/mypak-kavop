export function generatePassword(length: number = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = [
    uppercase[randomInt(uppercase.length)],
    lowercase[randomInt(lowercase.length)],
    numbers[randomInt(numbers.length)],
    special[randomInt(special.length)],
  ];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password.push(allChars[randomInt(allChars.length)]);
  }

  // Shuffle the password
  return password.sort(() => Math.random() - 0.5).join("");
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
