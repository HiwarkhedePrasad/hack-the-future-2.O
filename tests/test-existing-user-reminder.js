// test-existing-user-reminder.js - Test enhanced reminder system with existing user
import { processMessage } from "../functionsCalling/gemini.js";

async function testExistingUserReminder() {
  console.log("🧪 Testing Enhanced Medicine Reminder with Existing User...\n");

  // Use an existing user phone number
  const existingUserPhone = "+919876543210"; // User "Aspirin"
  
  // Test a simple one-time reminder flow
  const steps = [
    { message: "set a reminder", step: "Trigger reminder" },
    { message: "Paracetamol", step: "Medicine name" },
    { message: "one-time", step: "Reminder type" },
    { message: "tomorrow", step: "Date selection" },
    { message: "10:00", step: "Time" },
    { message: "Take when fever is high", step: "Notes" }
  ];

  console.log("📝 Testing one-time reminder flow with existing user:");
  
  for (const step of steps) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, existingUserPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Existing user reminder test completed!");
}

// Run the test
testExistingUserReminder().catch(console.error);
