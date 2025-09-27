// verify-enhanced-reminders.js - Verify enhanced medicine reminders
import sequelize from "../config/db.js";
import { User, Doctor } from "../model/index.js";
import MedicineReminder from "../model/remainder.js";
import dotenv from "dotenv";

dotenv.config();

async function verifyEnhancedReminders() {
  try {
    console.log("🔍 Verifying Enhanced Medicine Reminders...\n");

    // Get all users with their enhanced reminders
    const users = await User.findAll({
      include: [
        {
          model: Doctor,
          attributes: ["Name", "Specialization"],
        },
        {
          model: MedicineReminder,
          attributes: [
            "ReminderID",
            "Medicine",
            "Time",
            "ReminderType",
            "Duration",
            "StartDate",
            "EndDate",
            "Notes",
            "Frequency",
          ],
        },
      ],
    });

    console.log(`📊 Found ${users.length} users in database:`);

    users.forEach((user) => {
      console.log(`\n👤 User: ${user.UserName}`);
      console.log(`   📱 Phone: ${user.PhoneNumber}`);
      console.log(
        `   🏥 Doctor: ${user.Doctor?.Name || "None"} (${
          user.Doctor?.Specialization || "N/A"
        })`
      );

      if (user.MedicineReminders && user.MedicineReminders.length > 0) {
        console.log(
          `   💊 Enhanced Medicine Reminders (${user.MedicineReminders.length}):`
        );
        user.MedicineReminders.forEach((reminder) => {
          console.log(
            `      • ${reminder.Medicine} at ${reminder.Time} (${reminder.ReminderType})`
          );
          if (reminder.StartDate)
            console.log(`        📅 Start: ${reminder.StartDate}`);
          if (reminder.EndDate)
            console.log(`        📅 End: ${reminder.EndDate}`);
          if (reminder.Notes)
            console.log(`        📝 Notes: ${reminder.Notes}`);
          if (reminder.Frequency)
            console.log(`        🔄 Frequency: ${reminder.Frequency}`);
        });
      } else {
        console.log(`   💊 No medicine reminders set`);
      }
    });

    // Get all enhanced reminders with details
    const allReminders = await MedicineReminder.findAll({
      include: [
        {
          model: User,
          attributes: ["UserName", "PhoneNumber"],
        },
      ],
      order: [["ReminderID", "ASC"]],
    });

    console.log(
      `\n📋 Total enhanced reminders in database: ${allReminders.length}`
    );

    if (allReminders.length > 0) {
      console.log("\n📝 All Enhanced Reminders:");
      allReminders.forEach((reminder) => {
        console.log(
          `   • ${reminder.Medicine} at ${reminder.Time} (${reminder.ReminderType})`
        );
        console.log(
          `     👤 User: ${reminder.User.UserName} (${reminder.User.PhoneNumber})`
        );
        if (reminder.StartDate)
          console.log(`     📅 Start: ${reminder.StartDate}`);
        if (reminder.EndDate) console.log(`     📅 End: ${reminder.EndDate}`);
        if (reminder.Notes) console.log(`     📝 Notes: ${reminder.Notes}`);
        if (reminder.Frequency)
          console.log(`     🔄 Frequency: ${reminder.Frequency}`);
        console.log("");
      });
    }

    console.log("\n✅ Enhanced reminder verification completed successfully!");
  } catch (error) {
    console.error("❌ Error verifying enhanced reminders:", error);
  } finally {
    await sequelize.close();
  }
}

// Run verification
verifyEnhancedReminders();
