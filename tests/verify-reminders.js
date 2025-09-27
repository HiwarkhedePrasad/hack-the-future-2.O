// verify-reminders.js - Verify that reminders are saved in the database
import sequelize from "../config/db.js";
import { User, Doctor } from "../model/index.js";
import MedicineReminder from "../model/remainder.js";
import dotenv from "dotenv";

dotenv.config();

async function verifyReminders() {
  try {
    console.log("🔍 Verifying saved reminders in database...\n");

    // Get all users with their reminders
    const users = await User.findAll({
      include: [
        {
          model: Doctor,
          attributes: ['Name', 'Specialization']
        },
        {
          model: MedicineReminder,
          attributes: ['ReminderID', 'Medicine', 'Time', 'ReminderType', 'Duration']
        }
      ]
    });

    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`\n👤 User: ${user.UserName}`);
      console.log(`   📱 Phone: ${user.PhoneNumber}`);
      console.log(`   🏥 Doctor: ${user.Doctor?.Name || 'None'} (${user.Doctor?.Specialization || 'N/A'})`);
      
      if (user.MedicineReminders && user.MedicineReminders.length > 0) {
        console.log(`   💊 Medicine Reminders (${user.MedicineReminders.length}):`);
        user.MedicineReminders.forEach(reminder => {
          console.log(`      • ${reminder.Medicine} at ${reminder.Time} (${reminder.ReminderType})`);
        });
      } else {
        console.log(`   💊 No medicine reminders set`);
      }
    });

    // Get all reminders
    const allReminders = await MedicineReminder.findAll({
      include: [{
        model: User,
        attributes: ['UserName', 'PhoneNumber']
      }]
    });

    console.log(`\n📋 Total reminders in database: ${allReminders.length}`);
    
    if (allReminders.length > 0) {
      console.log("\n📝 All reminders:");
      allReminders.forEach(reminder => {
        console.log(`   • ${reminder.Medicine} at ${reminder.Time} for ${reminder.User.UserName} (${reminder.User.PhoneNumber})`);
      });
    }

    console.log("\n✅ Database verification completed successfully!");
    
  } catch (error) {
    console.error("❌ Error verifying reminders:", error);
  } finally {
    await sequelize.close();
  }
}

// Run verification
verifyReminders();
