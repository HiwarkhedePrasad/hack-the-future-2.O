// update-database.js - Update database schema for enhanced medicine reminders
import sequelize from "../config/db.js";
import { User, Doctor } from "../model/index.js";
import MedicineReminder from "../model/remainder.js";
import dotenv from "dotenv";

dotenv.config();

async function updateDatabase() {
  try {
    console.log("🔧 Updating database schema for enhanced medicine reminders...");

    // Sync all models with force: false to preserve existing data
    await sequelize.sync({ alter: true });
    console.log("✅ Database schema updated successfully");

    // Verify the new structure
    console.log("\n📊 Verifying updated database structure...");
    
    const users = await User.findAll({
      include: [
        {
          model: Doctor,
          attributes: ['Name', 'Specialization']
        },
        {
          model: MedicineReminder,
          attributes: ['ReminderID', 'Medicine', 'Time', 'ReminderType', 'Duration', 'StartDate', 'EndDate', 'Notes', 'Frequency']
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
          if (reminder.StartDate) console.log(`        Start: ${reminder.StartDate}`);
          if (reminder.EndDate) console.log(`        End: ${reminder.EndDate}`);
          if (reminder.Notes) console.log(`        Notes: ${reminder.Notes}`);
        });
      } else {
        console.log(`   💊 No medicine reminders set`);
      }
    });

    console.log("\n🎉 Database update completed successfully!");
    console.log("The enhanced medicine reminder system is now ready!");

  } catch (error) {
    console.error("❌ Database update failed:", error);
  } finally {
    await sequelize.close();
  }
}

// Run update
updateDatabase();
