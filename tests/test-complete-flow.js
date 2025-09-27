// test-complete-flow.js - Test complete flow from registration to medicine reminder
import { processMessage } from "../functionsCalling/gemini.js";

async function testCompleteFlow() {
  console.log("🧪 Testing Complete Flow: Registration → Medicine Reminder\n");

  const newUserPhone = "+1112223333";
  
  // Complete registration flow
  const registrationSteps = [
    { message: "Hello", step: "Welcome message" },
    { message: "Alice Brown", step: "Name" },
    { message: "58", step: "Age" },
    { message: "+4445556666", step: "Emergency number" },
    { message: "alice.brown@email.com", step: "Email" },
    { message: "English", step: "Language" },
    { message: "Dr. Michael Wilson", step: "Doctor name" },
    { message: "+7778889999", step: "Doctor phone" },
    { message: "General Medicine", step: "Doctor specialization" }
  ];

  console.log("📝 Registration Process:");
  for (const step of registrationSteps) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, newUserPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test medicine reminder after registration
  console.log("\n💊 Testing Medicine Reminder After Registration:");
  const reminderMessages = [
    "Remind me to take diabetes medication at 7:00 AM",
    "Set a reminder for my cholesterol medicine at 8:00 PM"
  ];

  for (const message of reminderMessages) {
    console.log(`\nMessage: "${message}"`);
    try {
      const result = await processMessage(message, newUserPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Complete flow test finished!");
}

// Run the test
testCompleteFlow().catch(console.error);
