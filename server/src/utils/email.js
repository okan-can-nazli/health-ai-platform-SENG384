export function sendVerificationEmail({ email, fullName, token }) {
  console.log("===== DEMO EMAIL VERIFICATION =====");
  console.log(`To: ${email}`);
  console.log(`Hello ${fullName},`);
  console.log("Please verify your email using the following token:");
  console.log(token);
  console.log("===================================");
}
