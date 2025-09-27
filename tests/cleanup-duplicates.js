// cleanup-duplicates.js - Clean up duplicate phone number entries
import sequelize from "../config/db.js";
import { User } from "../model/index.js";
import dotenv from "dotenv";

dotenv.config();

async function cleanupDuplicates() {
  try {
    console.log("🧹 Cleaning up duplicate phone number entries...\n");

    // Find all users
    const allUsers = await User.findAll({
      order: [['UserID', 'ASC']]
    });

    console.log(`📊 Found ${allUsers.length} total users`);

    // Group users by cleaned phone number
    const phoneGroups = {};
    
    allUsers.forEach(user => {
      const cleanPhone = user.PhoneNumber.replace(/^whatsapp:/, '');
      if (!phoneGroups[cleanPhone]) {
        phoneGroups[cleanPhone] = [];
      }
      phoneGroups[cleanPhone].push(user);
    });

    // Find duplicates
    const duplicates = Object.entries(phoneGroups).filter(([phone, users]) => users.length > 1);
    
    if (duplicates.length === 0) {
      console.log("✅ No duplicate phone numbers found!");
      return;
    }

    console.log(`🔍 Found ${duplicates.length} phone numbers with duplicates:`);
    
    for (const [phone, users] of duplicates) {
      console.log(`\n📱 Phone: ${phone}`);
      users.forEach(user => {
        console.log(`   • User ID: ${user.UserID}, Name: ${user.UserName}, Phone: ${user.PhoneNumber}`);
      });
      
      // Keep the user with the cleaned phone number (without whatsapp: prefix)
      const keepUser = users.find(user => !user.PhoneNumber.startsWith('whatsapp:'));
      const deleteUsers = users.filter(user => user.PhoneNumber.startsWith('whatsapp:'));
      
      if (keepUser && deleteUsers.length > 0) {
        console.log(`   ✅ Keeping: User ID ${keepUser.UserID} (${keepUser.PhoneNumber})`);
        
        for (const deleteUser of deleteUsers) {
          console.log(`   🗑️  Deleting: User ID ${deleteUser.UserID} (${deleteUser.PhoneNumber})`);
          await deleteUser.destroy();
        }
      }
    }

    console.log("\n✅ Cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await sequelize.close();
  }
}

// Run cleanup
cleanupDuplicates();
