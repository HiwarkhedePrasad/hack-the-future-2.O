// test-language-prompt.js - Test the language prompt
import { processMessage } from "../functionsCalling/gemini.js";

async function testLanguagePrompt() {
  console.log("🧪 Testing Language Prompt with Indian Languages...\n");

  const testPhone = "+919876543210";

  // Go through registration until language step
  const steps = [
    { message: "Hello", description: "Start registration" },
    { message: "Rahul Kumar", description: "Provide name" },
    { message: "30", description: "Provide age" },
    { message: "+919876543211", description: "Provide emergency number" },
    { message: "rahul@example.com", description: "Provide email" },
  ];

  console.log("📝 Going through registration steps...");

  for (const step of steps) {
    console.log(`\n${step.description}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Language prompt test completed!");
}

// Run the test
testLanguagePrompt().catch(console.error);
