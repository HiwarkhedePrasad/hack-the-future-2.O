// setup.js - Database setup and test data initialization
import sequelize from "../config/db.js";
import { User, Doctor } from "../model/index.js";
import dotenv from "dotenv";

dotenv.config();

async function setupDatabase() {
  try {
    console.log("🔧 Setting up database...");

    // Sync all models
    await sequelize.sync({ force: true }); // This will recreate all tables
    console.log("✅ Database synced successfully");

    // Create a test doctor
    const testDoctor = await Doctor.create({
      Name: "Dr. John Smith",
      PhoneNumber: "+1987654321",
      Email: "dr.smith@hospital.com",
      Specialization: "General Medicine",
    });
    console.log("✅ Test doctor created:", testDoctor.Name);

    // Create a test user
    const testUser = await User.create({
      UserName: "John Doe",
      PhoneNumber: "+1234567890",
      Email: "john.doe@email.com",
      EmergencyNumber: "+1111111111",
      Age: 65,
      Language: "English",
      DoctorID: testDoctor.DoctorID,
    });
    console.log("✅ Test user created:", testUser.UserName);

    console.log("\n🎉 Database setup completed successfully!");
    console.log("You can now test the medicine reminder functionality.");
    console.log("Test user phone number: +1234567890");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
  } finally {
    await sequelize.close();
  }
}

// Run setup
setupDatabase();
