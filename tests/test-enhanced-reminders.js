// test-enhanced-reminders.js - Test the enhanced medicine reminder system
import { processMessage } from "../functionsCalling/gemini.js";

async function testEnhancedReminders() {
  console.log("🧪 Testing Enhanced Medicine Reminder System...\n");

  const testPhone = "+919876543210";

  // Test 1: One-time reminder for today
  console.log("📋 Test 1: One-time reminder for today");
  const oneTimeTodayFlow = [
    { message: "set a reminder", step: "Trigger reminder flow" },
    { message: "Aspirin", step: "Medicine name" },
    { message: "one-time", step: "Reminder type" },
    { message: "today", step: "Date selection" },
    { message: "08:00", step: "Time" },
    { message: "Take with food", step: "Notes" },
  ];

  for (const step of oneTimeTodayFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 2: Daily reminder
  console.log("\n\n📋 Test 2: Daily reminder");
  const dailyFlow = [
    { message: "remind me to take medicine", step: "Trigger reminder flow" },
    { message: "Vitamin D", step: "Medicine name" },
    { message: "daily", step: "Reminder type" },
    { message: "07:30", step: "Time" },
    { message: "no notes", step: "Notes" },
  ];

  for (const step of dailyFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 3: Custom range reminder
  console.log("\n\n📋 Test 3: Custom range reminder");
  const customRangeFlow = [
    { message: "medicine reminder", step: "Trigger reminder flow" },
    { message: "Antibiotics", step: "Medicine name" },
    { message: "custom range", step: "Reminder type" },
    { message: "2024-01-15", step: "Start date" },
    { message: "2024-01-22", step: "End date" },
    { message: "12:00", step: "Time" },
    { message: "Take on empty stomach", step: "Notes" },
  ];

  for (const step of customRangeFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 4: Weekly reminder
  console.log("\n\n📋 Test 4: Weekly reminder");
  const weeklyFlow = [
    { message: "set reminder", step: "Trigger reminder flow" },
    { message: "Blood pressure medicine", step: "Medicine name" },
    { message: "weekly", step: "Reminder type" },
    { message: "09:00", step: "Time" },
    { message: "Before breakfast", step: "Notes" },
  ];

  for (const step of weeklyFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 5: Monthly reminder
  console.log("\n\n📋 Test 5: Monthly reminder");
  const monthlyFlow = [
    { message: "remind me", step: "Trigger reminder flow" },
    { message: "Cholesterol medicine", step: "Medicine name" },
    { message: "monthly", step: "Reminder type" },
    { message: "20:00", step: "Time" },
    { message: "After dinner", step: "Notes" },
  ];

  for (const step of monthlyFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 6: One-time reminder for specific date
  console.log("\n\n📋 Test 6: One-time reminder for specific date");
  const specificDateFlow = [
    { message: "pill reminder", step: "Trigger reminder flow" },
    { message: "Pain medication", step: "Medicine name" },
    { message: "one-time", step: "Reminder type" },
    { message: "2024-01-20", step: "Specific date" },
    { message: "14:30", step: "Time" },
    { message: "Take as needed", step: "Notes" },
  ];

  for (const step of specificDateFlow) {
    console.log(`\n${step.step}: "${step.message}"`);
    try {
      const result = await processMessage(step.message, testPhone, []);
      console.log(`✅ Response: ${result.text}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Enhanced reminder system testing completed!");
}

// Run the test
testEnhancedReminders().catch(console.error);
