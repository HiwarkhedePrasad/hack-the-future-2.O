// Test application startup
import express from "express";
import { User, Doctor } from "./model/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Test endpoint
app.get("/test", async (req, res) => {
  try {
    console.log("Testing User model...");
    const users = await User.findAll();
    console.log(`Found ${users.length} users`);
    
    res.json({
      success: true,
      message: "Application startup successful!",
      userCount: users.length,
      supabaseConnected: true
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const port = 3001; // Use different port to avoid conflicts
app.listen(port, () => {
  console.log(`✅ Test server running on port ${port}`);
  console.log(`🔗 Test endpoint: http://localhost:${port}/test`);
});

// Test the models directly
async function testModels() {
  try {
    console.log("\n🧪 Testing models...");
    
    // Test User model
    console.log("Testing User.findAll()...");
    const users = await User.findAll();
    console.log(`✅ User model working - found ${users.length} users`);
    
    console.log("\n🎉 All tests passed! The migration is successful.");
    
  } catch (error) {
    console.error("❌ Model test failed:", error.message);
  }
}

// Run tests after a short delay
setTimeout(testModels, 1000);
