// test-registration.js - Test script for new user registration functionality
import { processMessage } from "../functionsCalling/gemini.js";

async function testUserRegistration() {
  console.log("🧪 Testing New User Registration Functionality...\n");

  // Test registration flow
  const registrationFlow = [
    {
      message: "Hello",
      userId: "+9876543210",
      description: "First message from new user",
    },
    {
      message: "John Smith",
      userId: "+9876543210",
      description: "User provides name",
    },
    {
      message: "65",
      userId: "+9876543210",
      description: "User provides age",
    },
    {
      message: "+1112223333",
      userId: "+9876543210",
      description: "User provides emergency number",
    },
    {
      message: "john.smith@email.com",
      userId: "+9876543210",
      description: "User provides email",
    },
    {
      message: "English",
      userId: "+9876543210",
      description: "User provides language preference",
    },
    {
      message: "Dr. Sarah Johnson",
      userId: "+9876543210",
      description: "User provides doctor name",
    },
    {
      message: "+4445556666",
      userId: "+9876543210",
      description: "User provides doctor phone",
    },
    {
      message: "Cardiology",
      userId: "+9876543210",
      description: "User provides doctor specialization",
    },
  ];

  for (const step of registrationFlow) {
    console.log(`📝 Step: ${step.description}`);
    console.log(`Message: "${step.message}"`);
    console.log(`User ID: ${step.userId}`);

    try {
      const result = await processMessage(step.message, step.userId, []);
      console.log(`✅ Response: ${result.text}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Test medicine reminder after registration
  console.log("💊 Testing medicine reminder after registration...");
  try {
    const result = await processMessage(
      "Remind me to take blood pressure medicine at 8:00 AM",
      "+9876543210",
      []
    );
    console.log(`✅ Medicine reminder response: ${result.text}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
}

// Test registration without doctor
async function testRegistrationWithoutDoctor() {
  console.log("🧪 Testing Registration Without Doctor...\n");

  const registrationFlowNoDoctor = [
    {
      message: "Hi there",
      userId: "+5556667777",
      description: "First message from new user (no doctor)",
    },
    {
      message: "Mary Johnson",
      userId: "+5556667777",
      description: "User provides name",
    },
    {
      message: "72",
      userId: "+5556667777",
      description: "User provides age",
    },
    {
      message: "+9998887777",
      userId: "+5556667777",
      description: "User provides emergency number",
    },
    {
      message: "skip",
      userId: "+5556667777",
      description: "User skips email",
    },
    {
      message: "Spanish",
      userId: "+5556667777",
      description: "User provides language preference",
    },
    {
      message: "no doctor",
      userId: "+5556667777",
      description: "User indicates no doctor",
    },
  ];

  for (const step of registrationFlowNoDoctor) {
    console.log(`📝 Step: ${step.description}`);
    console.log(`Message: "${step.message}"`);
    console.log(`User ID: ${step.userId}`);

    try {
      const result = await processMessage(step.message, step.userId, []);
      console.log(`✅ Response: ${result.text}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testUserRegistration();
  console.log("=".repeat(50));
  await testRegistrationWithoutDoctor();
}

runAllTests().catch(console.error);
