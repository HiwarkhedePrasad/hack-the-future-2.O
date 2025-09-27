// test-local-reminders.js - Local testing without Twilio
import { processMessage } from "../functionsCalling/gemini.js";

async function testLocalReminders() {
  console.log("🧪 Local Testing - Enhanced Medicine Reminder System\n");
  console.log("(Bypassing Twilio to avoid daily message limits)\n");

  const testPhone = "+919876543210"; // Existing user
  
  // Test different reminder scenarios
  const testScenarios = [
    {
      name: "Daily Medicine Reminder",
      steps: [
        { message: "set a reminder", step: "Trigger" },
        { message: "Diabetes Medicine", step: "Medicine" },
        { message: "daily", step: "Type" },
        { message: "08:00", step: "Time" },
        { message: "Take before breakfast", step: "Notes" }
      ]
    },
    {
      name: "One-time Reminder for Tomorrow",
      steps: [
        { message: "remind me to take medicine", step: "Trigger" },
        { message: "Antibiotics", step: "Medicine" },
        { message: "one-time", step: "Type" },
        { message: "tomorrow", step: "Date" },
        { message: "14:00", step: "Time" },
        { message: "Take with food", step: "Notes" }
      ]
    },
    {
      name: "Custom Range Reminder",
      steps: [
        { message: "medicine reminder", step: "Trigger" },
        { message: "Pain Medication", step: "Medicine" },
        { message: "custom range", step: "Type" },
        { message: "2024-01-20", step: "Start Date" },
        { message: "2024-01-27", step: "End Date" },
        { message: "20:00", step: "Time" },
        { message: "Take as needed for pain", step: "Notes" }
      ]
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log("=" .repeat(50));
    
    for (const step of scenario.steps) {
      console.log(`\n${step.step}: "${step.message}"`);
      try {
        const result = await processMessage(step.message, testPhone, []);
        console.log(`✅ Response: ${result.text}`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log("\n" + "=" .repeat(50));
  }

  console.log("\n🎉 Local testing completed!");
  console.log("\n💡 To avoid Twilio limits:");
  console.log("   • Upgrade to paid Twilio account");
  console.log("   • Use multiple Twilio accounts");
  console.log("   • Test locally (as shown above)");
  console.log("   • Contact Twilio for limit increase");
}

// Run local test
testLocalReminders().catch(console.error);
