// test-simple-reminder.js - Simple test for enhanced medicine reminder system
import { processMessage } from "../functionsCalling/gemini.js";

async function testSimpleReminder() {
  console.log("🧪 Testing Simple Enhanced Medicine Reminder...\n");

  const testPhone = "+919876543211";

  // Test a simple daily reminder flow
  const steps = [
    { message: "set a reminder", step: "Trigger reminder" },
    { message: "Aspirin", step: "Medicine name" },
    { message: "daily", step: "Reminder type" },
    { message: "08:00", step: "Time" },
    { message: "Take with food", step: "Notes" },
  ];

  console.log("📝 Testing daily reminder flow:");

  for (const step of steps) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Simple reminder test completed!");
}

// Run the test
testSimpleReminder().catch(console.error);
