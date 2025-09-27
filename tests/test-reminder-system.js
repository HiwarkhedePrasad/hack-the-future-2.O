// tests/test-reminder-system.js - Test the comprehensive reminder system
import reminderScheduler from "../services/reminderScheduler.js";
import responseTracker from "../services/responseTracker.js";
import { User, Doctor } from "../model/index.js";
import MedicineReminder from "../model/remainder.js";
import sequelize from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function testReminderSystem() {
  console.log("🧪 Testing Comprehensive Reminder System...\n");

  try {
    // Test 1: Setup test data
    console.log("📋 Test 1: Setting up test data");
    await setupTestData();
    console.log("✅ Test data setup completed\n");

    // Test 2: Test reminder scheduling
    console.log("📋 Test 2: Testing reminder scheduling");
    await testReminderScheduling();
    console.log("✅ Reminder scheduling test completed\n");

    // Test 3: Test response tracking
    console.log("📋 Test 3: Testing response tracking");
    await testResponseTracking();
    console.log("✅ Response tracking test completed\n");

    // Test 4: Test emergency contact system
    console.log("📋 Test 4: Testing emergency contact system");
    await testEmergencyContact();
    console.log("✅ Emergency contact test completed\n");

    // Test 5: Test reminder flow simulation
    console.log("📋 Test 5: Testing complete reminder flow");
    await testCompleteReminderFlow();
    console.log("✅ Complete reminder flow test completed\n");

    console.log("🎉 All reminder system tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Stop the scheduler before closing the database
    reminderScheduler.stop();
    await sequelize.close();
  }
}

async function setupTestData() {
  // Create test doctor
  const doctor = await Doctor.create({
    Name: "Dr. Test Reminder",
    PhoneNumber: "+1987654321",
    Email: "test.reminder@hospital.com",
    Specialization: "General Medicine",
  });

  // Create test user
  const user = await User.create({
    UserName: "Test Reminder User",
    PhoneNumber: "+1234567890",
    Email: "test.reminder@email.com",
    EmergencyNumber: "+1111111111",
    Age: 65,
    Language: "English",
    DoctorID: doctor.DoctorID,
  });

  // Create test reminders
  const currentTime = new Date();
  const currentTimeString = currentTime.toTimeString().slice(0, 5);
  const currentDate = currentTime.toISOString().split("T")[0];

  // Daily reminder
  const dailyReminder = await MedicineReminder.create({
    UserID: user.UserID,
    Medicine: "Test Medicine Daily",
    Time: currentTimeString,
    ReminderType: "daily",
    StartDate: currentDate,
    Notes: "Test daily reminder",
  });

  // One-time reminder for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split("T")[0];

  const oneTimeReminder = await MedicineReminder.create({
    UserID: user.UserID,
    Medicine: "Test Medicine One-time",
    Time: "09:00",
    ReminderType: "one_time",
    StartDate: tomorrowString,
    EndDate: tomorrowString,
    Notes: "Test one-time reminder",
  });

  console.log(`   Created user: ${user.UserName}`);
  console.log(`   Created daily reminder: ${dailyReminder.MedinderID}`);
  console.log(`   Created one-time reminder: ${oneTimeReminder.ReminderID}`);
}

async function testReminderScheduling() {
  console.log("   Starting reminder scheduler...");
  reminderScheduler.start();

  console.log("   Waiting 5 seconds for scheduler to process...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const status = reminderScheduler.getTrackingStatus();
  console.log(`   Scheduler status:`, status);
}

async function testResponseTracking() {
  console.log("   Testing response tracking...");

  // Simulate adding a reminder to tracking
  const testUser = await User.findOne({
    where: { PhoneNumber: "+1234567890" },
  });
  const testReminder = await MedicineReminder.findOne({
    where: { Medicine: "Test Medicine Daily" },
  });

  responseTracker.addReminder(testReminder.ReminderID, testUser, testReminder);

  console.log("   Added reminder to tracking");

  // Test getting active reminder
  const activeReminder = responseTracker.getActiveReminder("+1234567890");
  console.log(`   Active reminder found: ${activeReminder ? "Yes" : "No"}`);

  if (activeReminder) {
    console.log(`   Reminder ID: ${activeReminder.reminderId}`);
    console.log(`   Medicine: ${activeReminder.medicine}`);
  }

  // Test response handling
  const responseResult = responseTracker.handleResponse("+1234567890", "taken");
  console.log(`   Response handled: ${responseResult ? "Yes" : "No"}`);

  if (responseResult) {
    console.log(`   Response: ${responseResult.response}`);
    console.log(`   Responded at: ${responseResult.respondedAt}`);
  }
}

async function testEmergencyContact() {
  console.log("   Testing emergency contact system...");

  // Create a new reminder for emergency testing
  const testUser = await User.findOne({
    where: { PhoneNumber: "+1234567890" },
  });
  const emergencyReminder = await MedicineReminder.create({
    UserID: testUser.UserID,
    Medicine: "Emergency Test Medicine",
    Time: "10:00",
    ReminderType: "one_time",
    StartDate: new Date().toISOString().split("T")[0],
    Notes: "Emergency test reminder",
  });

  // Add to tracking
  responseTracker.addReminder(
    emergencyReminder.ReminderID,
    testUser,
    emergencyReminder
  );

  console.log("   Added emergency test reminder to tracking");

  // Simulate timeout (reduce timeout for testing)
  const originalTimeout = reminderScheduler.emergencyTimeout;
  reminderScheduler.emergencyTimeout = 2000; // 2 seconds for testing

  console.log("   Waiting for emergency timeout...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check for timeouts
  const timeouts = responseTracker.checkTimeouts(2000);
  console.log(`   Timeouts found: ${timeouts.length}`);

  if (timeouts.length > 0) {
    console.log("   Processing emergency contact...");
    await reminderScheduler.contactEmergency(
      timeouts[0].reminderId,
      timeouts[0]
    );
  }

  // Restore original timeout
  reminderScheduler.emergencyTimeout = originalTimeout;
}

async function testCompleteReminderFlow() {
  console.log("   Testing complete reminder flow...");

  // Create a new reminder
  const testUser = await User.findOne({
    where: { PhoneNumber: "+1234567890" },
  });
  const flowReminder = await MedicineReminder.create({
    UserID: testUser.UserID,
    Medicine: "Flow Test Medicine",
    Time: "11:00",
    ReminderType: "daily",
    StartDate: new Date().toISOString().split("T")[0],
    Notes: "Flow test reminder",
  });

  console.log("   Created flow test reminder");

  // Simulate sending reminder
  const user = {
    UserName: testUser.UserName,
    PhoneNumber: testUser.PhoneNumber,
  };
  const reminder = {
    Medicine: flowReminder.Medicine,
    Time: flowReminder.Time,
    Notes: flowReminder.Notes,
  };

  const messageSent = await reminderScheduler.sendReminderMessage(
    user,
    reminder
  );
  console.log(`   Reminder message sent: ${messageSent ? "Yes" : "No"}`);

  if (messageSent) {
    // Add to tracking
    responseTracker.addReminder(
      flowReminder.ReminderID,
      testUser,
      flowReminder
    );
    console.log("   Reminder added to tracking");

    // Simulate user response
    const responseResult = responseTracker.handleResponse(
      testUser.PhoneNumber,
      "remind later"
    );
    console.log(`   User response handled: ${responseResult ? "Yes" : "No"}`);

    if (responseResult) {
      console.log(`   User chose: ${responseResult.response}`);
    }
  }

  // Get final status
  const finalStatus = responseTracker.getStats();
  console.log("   Final tracking status:", finalStatus);
}

// Run the test
testReminderSystem().catch(console.error);
