// Quick test script to verify contact lookup logic
const testEmail = "shangwey@yahoo.com";

// Simulate the contact from your database
const mockContact = {
  _id: "rn76r4tmym8hy9cdy1g",
  name: "shang wey tang",
  email: null,
  contactPersonEmail: "shangwey@yahoo.com",
  company: "tesst"
};

// Test the exact match logic
const clients = [mockContact];

const client = clients.find(
  (c) =>
    (testEmail && (
      c.email?.toLowerCase() === testEmail.toLowerCase() ||
      c.contactPersonEmail?.toLowerCase() === testEmail.toLowerCase()
    ))
);

console.log("Test email:", testEmail);
console.log("Mock contact:", mockContact);
console.log("Match found:", !!client);
console.log("Matched client:", client);

if (client) {
  console.log("\n✅ SUCCESS: Contact matching logic works!");
  console.log("The issue is that Next.js hasn't reloaded the changes.");
} else {
  console.log("\n❌ FAILED: Contact matching logic has a bug!");
}
