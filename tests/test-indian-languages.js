// test-indian-languages.js - Test Indian language options in registration
import { processMessage } from "../functionsCalling/gemini.js";

async function testIndianLanguages() {
  console.log("🧪 Testing Indian Language Options in Registration...\n");

  // Test different Indian languages
  const languages = [
    "Hindi",
    "Marathi",
    "Gujarati",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Bengali",
    "Punjabi",
    "English",
  ];

  for (const language of languages) {
    console.log(`\n🌐 Testing language: ${language}`);

    const testPhone = `+91${
      Math.floor(Math.random() * 9000000000) + 1000000000
    }`;

    // Quick registration flow to test language selection
    const registrationSteps = [
      { message: "Hello", step: "Welcome" },
      { message: `Test User ${language}`, step: "Name" },
      { message: "25", step: "Age" },
      { message: "+919876543210", step: "Emergency" },
      { message: "test@example.com", step: "Email" },
      { message: language, step: "Language" },
      { message: "no doctor", step: "No Doctor" },
    ];

    console.log(`📱 Using phone: ${testPhone}`);

    for (const step of registrationSteps) {
      try {
        const result = await processMessage(step.message, testPhone, []);
        if (step.step === "Language") {
          console.log(`✅ Language "${language}" accepted: ${result.text}`);
        }
      } catch (error) {
        console.log(`❌ Error in ${step.step}: ${error.message}`);
      }
    }
  }

  console.log("\n🎉 Indian language testing completed!");
}

// Run the test
testIndianLanguages().catch(console.error);
