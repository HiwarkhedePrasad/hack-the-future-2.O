// demo-reminder-system.js - Demo the comprehensive reminder system
import reminderScheduler from "./services/reminderScheduler.js";
import responseTracker from "./services/responseTracker.js";
import { 
  User, 
  Profile, 
  Patient, 
  Doctor, 
  MedicineReminder, 
  PrescriptionRecord, 
  PrescriptionDrug, 
  Drug, 
  ReminderSchedule,
  Specialization 
} from "./model/index.js";
import supabase from "./config/supabase.js";
import dotenv from "dotenv";

dotenv.config();

async function demoReminderSystem() {
  console.log("🎬 MediPing Reminder System Demo\n");
  console.log("This demo showcases the comprehensive reminder system with:");
  console.log("✅ Automated WhatsApp reminders at scheduled times");
  console.log("✅ Response tracking and monitoring");
  console.log("✅ Emergency contact system (5-10 minute timeout)");
  console.log("✅ Multiple reminder types (daily, weekly, monthly, etc.)\n");

  try {
    // Setup demo data
    console.log("🔧 Setting up demo data...");
    const { user, reminders } = await setupDemoData();
    console.log("✅ Demo data ready\n");

    // Start the reminder scheduler
    console.log("🚀 Starting reminder scheduler...");
    reminderScheduler.start();
    console.log("✅ Scheduler running\n");

    // Demo 1: Show reminder scheduling
    console.log("📋 Demo 1: Reminder Scheduling");
    console.log(
      "   The system automatically checks for reminders every minute"
    );
    console.log("   When it's time, WhatsApp messages are sent to users");
    console.log("   Each reminder is tracked for response monitoring\n");

    // Demo 2: Show response tracking
    console.log("📋 Demo 2: Response Tracking");
    console.log("   Users can respond with:");
    console.log("   • 'Taken' - Confirm medicine taken");
    console.log("   • 'Remind later' - Get reminder in 30 minutes");
    console.log("   • 'Skip today' - Skip this dose\n");

    // Demo 3: Show emergency system
    console.log("📋 Demo 3: Emergency Contact System");
    console.log("   If user doesn't respond within 7 minutes:");
    console.log("   • Emergency contact is automatically notified");
    console.log("   • SMS sent to emergency number");
    console.log("   • Includes medicine details and user info\n");

    // Demo 4: Show reminder types
    console.log("📋 Demo 4: Reminder Types Supported");
    console.log("   • Daily - Every day at same time");
    console.log("   • Weekly - Once a week");
    console.log("   • Monthly - Once a month");
    console.log("   • One-time - Specific date");
    console.log("   • Custom range - Date range\n");

    // Show current status
    console.log("📊 Current System Status:");
    const status = reminderScheduler.getTrackingStatus();
    console.log(`   • Active reminders: ${status.activeReminders}`);
    console.log(`   • Users responded: ${status.responded}`);
    console.log(`   • Pending responses: ${status.pending}`);
    console.log(`   • Emergency contacted: ${status.emergencyContacted}`);
    console.log(`   • Response rate: ${status.responseRate}%\n`);

    // Show demo reminders
    console.log("💊 Demo Reminders Created:");
    reminders.forEach((reminder) => {
      console.log(
        `   • ${reminder.Medicine} at ${reminder.Time} (${reminder.ReminderType})`
      );
      if (reminder.Notes) console.log(`     Notes: ${reminder.Notes}`);
    });

    console.log("\n🎯 How to Test:");
    console.log("1. Wait for the current time to match a reminder time");
    console.log("2. Check console for reminder processing");
    console.log("3. Simulate user responses via WhatsApp");
    console.log("4. Monitor emergency contact system\n");

    console.log("🔍 Monitoring Endpoints:");
    console.log("   • GET /reminder-status - System status");
    console.log("   • GET /active-reminders - All active reminders");
    console.log("   • GET /user-reminders/:phone - User's reminders\n");

    console.log("⏰ Demo will run for 2 minutes...");
    console.log("Press Ctrl+C to stop early\n");

    // Run demo for 2 minutes
    await new Promise((resolve) => setTimeout(resolve, 120000));

    console.log("🎉 Demo completed!");
    console.log(
      "The reminder system is now running and monitoring for scheduled reminders."
    );
  } catch (error) {
    console.error("❌ Demo failed:", error);
  } finally {
    // Stop the scheduler
    reminderScheduler.stop();
    console.log("🛑 Demo cleanup completed");
  }
}

async function setupDemoData() {
  try {
    console.log("   Creating demo user profile...");
    
    // Create demo user using the legacy compatibility layer
    const user = await User.create({
      UserName: "Demo User",
      PhoneNumber: "+1234567890",
      EmergencyNumber: "+1111111111",
      Age: 70,
      Language: "English",
    });

    console.log(`   ✅ Created user: ${user.UserName} (${user.PhoneNumber})`);

    // Create some demo reminders using the legacy compatibility layer
    const reminders = [];
    const currentTime = new Date();
    
    // Create a reminder for 2 minutes from now for testing
    const testTime = new Date(currentTime.getTime() + 2 * 60 * 1000);
    const testTimeString = testTime.toTimeString().slice(0, 5);

    console.log("   Creating demo reminders...");
    
    // Daily reminder 
    const dailyReminder = await MedicineReminder.create({
      UserID: user.UserID,
      Medicine: "Blood Pressure Medicine",
      Time: testTimeString,
      ReminderType: "daily",
      StartDate: currentTime.toISOString().split("T")[0],
      Notes: "Take with breakfast",
    });
    reminders.push(dailyReminder);

    console.log(`   ✅ Created ${reminders.length} demo reminders`);
    console.log(`   📅 Next reminder scheduled for: ${testTimeString}`);

    return { user, reminders };
  } catch (error) {
    console.error("❌ Error setting up demo data:", error);
    throw error;
  }
}

// Run the demo
demoReminderSystem().catch(console.error);
