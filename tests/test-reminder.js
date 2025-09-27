// test-reminder.js - Test script for medicine reminder functionality
import { processMessage } from "../functionsCalling/gemini.js";

async function testMedicineReminder() {
  console.log("🧪 Testing Medicine Reminder Functionality...\n");

  // Test cases
  const testCases = [
    {
      message: "Remind me to take aspirin at 8:00 AM",
      userId: "+1234567890",
      description: "Basic medicine reminder",
    },
    {
      message: "Set a reminder for my blood pressure medicine at 9:30 PM",
      userId: "+1234567890",
      description: "Medicine with time",
    },
    {
      message: "I need to take vitamin D at 7:00 AM daily",
      userId: "+1234567890",
      description: "Daily medicine reminder",
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.description}`);
    console.log(`Message: "${testCase.message}"`);
    console.log(`User ID: ${testCase.userId}`);

    try {
      const result = await processMessage(
        testCase.message,
        testCase.userId,
        []
      );
      console.log(`✅ Response: ${result.text}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

// Run the test
testMedicineReminder().catch(console.error);
