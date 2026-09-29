import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFile, readFile } from "node:fs/promises";

const ir = createInterface({ input, output });

console.log("******************");
console.log("This is password manager APP");

// Encrypt function
function encrypt(password) {
  return password
    .split("")
    .map((char) => {
      const charx = char.charCodeAt(0) + 7;
      return String.fromCharCode(charx);
    })
    .join("");
}

// Decrypt function
function decrypt(cipher) {
  return cipher
    .split("")
    .map((char) => {
      const charx = char.charCodeAt(0) - 7;
      return String.fromCharCode(charx);
    })
    .join("");
}

// Ask password
const password = await ir.question("What is your password? ");

// Encrypt password
const cipher = encrypt(password);

console.log("Original password -->", password);
console.log("Encrypted password -->", cipher);

// Save encrypted password
await writeFile("password.txt", cipher);

console.log("Password Saved!");

// Read encrypted password
const savedCipher = await readFile("password.txt", "utf-8");

// Decrypt password
const originalPassword = decrypt(savedCipher);

console.log("Decrypted password -->", originalPassword);

ir.close();
