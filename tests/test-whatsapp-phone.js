// test-whatsapp-phone.js - Test WhatsApp phone number handling
import { processMessage } from "../functionsCalling/gemini.js";

async function testWhatsAppPhoneHandling() {
  console.log("🧪 Testing WhatsApp Phone Number Handling...\n");

  // Test with WhatsApp phone number format
  const whatsappPhone = "whatsapp:+919284905505";
  const expectedCleanPhone = "+919284905505";

  console.log(`📱 Testing with WhatsApp phone: ${whatsappPhone}`);
  console.log(`🎯 Expected clean phone: ${expectedCleanPhone}\n`);

  // Test registration flow with WhatsApp phone
  const registrationSteps = [
    { message: "Hello", step: "Welcome message" },
    { message: "Prasad Hiwarkhede", step: "Name" },
    { message: "20", step: "Age" },
    { message: "9850912941", step: "Emergency number" },
    { message: "phiwarkhede05@gmail.com", step: "Email" },
    { message: "English", step: "Language" },
    { message: "no doctor", step: "No doctor" },
  ];

  console.log("📝 Registration Process with WhatsApp Phone:");
  for (const step of registrationSteps) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, whatsappPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test medicine reminder after registration
  console.log("\n💊 Testing Medicine Reminder with WhatsApp Phone:");
  const reminderMessage = "Remind me to take vitamin C at 9:00 AM";

  console.log(`\nMessage: "${reminderMessage}"`);
  try {
    const result = await processMessage(reminderMessage, whatsappPhone, []);
    console.log(`✅ Response: ${result.text}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log("\n🎉 WhatsApp phone number handling test finished!");
}

// Run the test
testWhatsAppPhoneHandling().catch(console.error);
