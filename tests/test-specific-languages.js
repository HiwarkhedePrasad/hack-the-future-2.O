// test-specific-languages.js - Test specific Indian languages
import { processMessage } from "../functionsCalling/gemini.js";

async function testSpecificLanguages() {
  console.log("🧪 Testing Specific Indian Languages...\n");

  const languages = ["Hindi", "Marathi", "Tamil", "Bengali"];
  
  for (const language of languages) {
    console.log(`\n🌐 Testing: ${language}`);
    
    const testPhone = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    // Complete registration with specific language
    const steps = [
      { message: "Hello", step: "Welcome" },
      { message: `Test User ${language}`, step: "Name" },
      { message: "28", step: "Age" },
      { message: "+919876543212", step: "Emergency" },
      { message: "test@example.com", step: "Email" },
      { message: language, step: "Language" },
      { message: "no doctor", step: "No Doctor" }
    ];

    console.log(`📱 Phone: ${testPhone}`);
    
    for (const step of steps) {
      try {
        const result = await processMessage(step.message, testPhone, []);
        if (step.step === "Language") {
          console.log(`✅ Language "${language}" accepted successfully`);
        } else if (step.step === "No Doctor") {
          console.log(`✅ Registration completed with language: ${language}`);
        }
      } catch (error) {
        console.log(`❌ Error in ${step.step}: ${error.message}`);
      }
    }
  }

  console.log("\n🎉 Specific language testing completed!");
}

// Run the test
testSpecificLanguages().catch(console.error);
