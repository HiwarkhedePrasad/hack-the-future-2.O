import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Profile from "./model/profiles.js"; // CORRECTED: Using your Supabase Profile model
import client from "./twilioClient.js";
import { processMessage } from "./functionsCalling/gemini.js";
import reminderScheduler from "./services/reminderScheduler.js";
import handlePatientCommand from "./functionsCalling/patientCommands.js";
import responseTracker from "./services/responseTracker.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory store for conversation histories (replace with a DB for production)
const userHistories = {};

/**
 * Handle reminder responses like "Taken", "✅", "Later", etc.
 */
async function handleReminderResponse(from, body) {
    const response = body.trim().toLowerCase();
    const userPhone = from.replace(/^whatsapp:/, "");
    
    // Check if this looks like a reminder response
    if (['taken', '✅', 'remind later', 'later', 'skip today', 'skip', '❌'].includes(response)) {
        console.log(`💊 Processing reminder response: ${response}`);
        
        // Find the active reminder for this user
        const activeReminder = responseTracker.getActiveReminder(userPhone);
        
        if (activeReminder) {
            console.log(`📊 Found active reminder ${activeReminder.reminderId} for user ${userPhone}`);
            
            // Handle the response using the reminder scheduler
            const success = reminderScheduler.handleUserResponse(
                activeReminder.reminderId,
                response,
                from
            );
            
            if (success) {
                console.log(`✅ Reminder response handled successfully`);
                return true;
            }
        } else {
            console.log(`⚠️ No active reminder found for user ${userPhone}`);
            await sendMessage(from, "I don't see any active reminders for you right now. If you need to set a new reminder, just say 'remind me to take [medicine] at [time]'.");
            return true;
        }
    }
    
    return false;
}

/**
 * Helper function to send a WhatsApp message via Twilio.
 * @param {string} to - The recipient's WhatsApp number (e.g., 'whatsapp:+919...')
 * @param {string} message - The text message to send.
 */
async function sendMessage(to, message) {
    try {
        const from = process.env.TWILIO_WHATSAPP_NUMBER;
        console.log(`📱 Sending message from ${from} to ${to}`);

        if (process.env.NODE_ENV === "development") {
            console.log(`[DEV MODE] Body: ${message}`);
        } else {
            await client.messages.create({ from, to, body: message });
        }
    } catch (error) {
        console.error(`❌ Failed to send Twilio message to ${to}:`, error);
    }
}

/**
 * Checks if a user is registered and sends a registration prompt if not.
 * @param {string} from - The sender's WhatsApp number.
 * @returns {boolean} - True if the user is registered, false otherwise.
 */
async function checkUserAndPromptRegistration(from) {
    const userPhone = from.replace(/^whatsapp:/, "");
    try {
        // CORRECTED: Using the correct method from your Profile model
        const existingProfile = await Profile.findByMobileNumber(userPhone);

        if (!existingProfile) {
            console.log(`❌ User ${userPhone} not found, prompting registration.`);
            const prompt = `👋 Welcome to MediPing!
To get started with medicine reminders, you need to register first.

📝 To register, please reply with:
REGISTER Your Full Name | Your Age | Your Gender | Emergency Contact

📋 Example:
REGISTER Jane Doe | 34 | Female | +919876543210`;

            await sendMessage(from, prompt);
            return false; // User is not registered
        }

        // CORRECTED: Using the 'name' property from the 'profiles' table
        console.log(`✅ User ${existingProfile.name} found in database.`);
        return true; // User is registered
    } catch (error) {
        console.error("❌ Error in checkUserAndPromptRegistration:", error);
        await sendMessage(from, "Sorry, I ran into a system error. Please try again later.");
        return false;
    }
}

/**
 * Handles an incoming message to see if it's a registration command.
 * @param {string} from - The sender's WhatsApp number.
 * @param {string} body - The content of the incoming message.
 * @returns {boolean} - True if the message was a registration attempt, false otherwise.
 */
async function handleRegistrationRequest(from, body) {
    const message = body.trim();

    if (!message.toUpperCase().startsWith("REGISTER ")) {
        return false; // Not a registration command
    }

    console.log(`📝 Processing registration request from ${from}`);
    try {
        const parts = message.substring(9).split("|").map(p => p.trim());
        if (parts.length < 4) {
            await sendMessage(from, "❌ Invalid format.\nPlease use: REGISTER Your Full Name | Your Age | Your Gender | Emergency Contact");
            return true;
        }

        const [name, ageStr, genderInput, emergencyContact] = parts;
        const age = parseInt(ageStr, 10);
        const userPhone = from.replace(/^whatsapp:/, "");

        if (!name || isNaN(age) || !genderInput || !emergencyContact) {
            await sendMessage(from, "❌ Please provide your full name, a valid age, your gender, and an emergency contact number.");
            return true;
        }
        
        // Normalize gender to match database enum values
        const gender = genderInput.toLowerCase();
        if (!['male', 'female', 'other'].includes(gender)) {
            await sendMessage(from, "❌ Gender must be 'male', 'female', or 'other'.");
            return true;
        }
        
        // CORRECTED: Using Profile model and schema-correct field names
        const newProfileData = {
            name,
            mobile_number: userPhone,
            age,
            gender,
            role: 'patient', // Default role for new sign-ups
        };

        const newProfile = await Profile.create(newProfileData);

        // Also create a patient record since medicine reminders require it
        const { Patient } = await import("./model/index.js");
        await Patient.create({
            patient_id: newProfile.id,
            emergency_contact: emergencyContact,
            timezone_offset: 330 // Default to IST (+5:30)
        });

        const welcomeMessage = `🎉 **Welcome to MediPing, ${newProfile.name}!**\n\n` +
            `✅ You're now registered and can:\n\n` +
            `💊 **Set Medicine Reminders:**\n` +
            `"Remind me to take aspirin at 8 AM daily"\n\n` +
            `📋 **Manage Your Reminders:**\n` +
            `• LIST - See all your reminders\n` +
            `• STOP [number] - Cancel a reminder\n\n` +
            `📸 **Upload Prescriptions:**\n` +
            `• UPLOAD - Get help uploading prescriptions\n` +
            `• Send prescription photos directly\n\n` +
            `🆘 **Get Help:**\n` +
            `• HELP - See all available commands\n\n` +
            `🚨 **Emergency Contact:** ${emergencyContact}\n` +
            `I'll contact them if you don't respond to medicine reminders.`;
        
        await sendMessage(from, welcomeMessage);

    } catch (error) {
        console.error("❌ Registration error:", error);
        // Supabase code for unique violation
        if (error.code === '23505') {
            await sendMessage(from, "✅ You are already registered! You can start setting reminders.");
        } else {
            await sendMessage(from, "Sorry, the registration failed due to a system error.");
        }
    }
    return true; // Registration command was handled
}

// Main webhook for incoming WhatsApp messages
app.post("/whatsapp-web", async (req, res) => {
    const { From: from, Body: body } = req.body;
    console.log(`\n--- New Message ---`);
    console.log(`📱 From: ${from}, Body: "${body}"`);

    // Step 1: Check if the message is a registration command.
    const wasRegistrationAttempt = await handleRegistrationRequest(from, body);
    if (wasRegistrationAttempt) {
        return res.status(200).send("<Response></Response>");
    }

    // Step 2: If not a registration, check if the user is registered at all.
    const isUserRegistered = await checkUserAndPromptRegistration(from);
    if (!isUserRegistered) {
        // A registration prompt was sent, so we stop here.
        return res.status(200).send("<Response></Response>");
    }
    
    // Step 3: Check if this is a reminder response
    const reminderResponse = await handleReminderResponse(from, body);
    if (reminderResponse) {
        return res.status(200).send("<Response></Response>");
    }

    // Step 4: Check if this is a patient self-service command
    const patientCommandResult = await handlePatientCommand(from, body);
    if (patientCommandResult.handled) {
        await sendMessage(from, patientCommandResult.message);
        return res.status(200).send("<Response></Response>");
    }
    
    // Step 4: If the user is registered, proceed with normal AI processing.
    if (!userHistories[from]) {
        userHistories[from] = [];
    }

    try {
        const reply = await processMessage(body, from, userHistories[from]);
        await sendMessage(from, reply.text);

        // Update conversation history with correct format
        userHistories[from].push({ role: "user", content: body });
        userHistories[from].push({ role: "model", content: reply.text });

    } catch (error) {
        console.error("❌ Error processing message with Gemini:", error);
        await sendMessage(from, "I'm having trouble connecting right now. Please try again in a moment.");
    }
  
    res.status(200).send("<Response></Response>");
});

// API endpoint to view all registered profiles
app.get("/profiles", async (req, res) => {
    try {
        // CORRECTED: Using Profile model's findAll method
        const profiles = await Profile.findAll();
        res.json(profiles);
    } catch (error) {
        console.error("Error fetching profiles:", error);
        res.status(500).json({ error: "Failed to fetch profiles" });
    }
});

// Webhook endpoint for Twilio call status updates
app.post("/call-status", (req, res) => {
    const { CallSid, CallStatus, CallDuration } = req.body;
    
    console.log(`📞 Twilio Call Status Update: ${CallSid} - ${CallStatus} (${CallDuration}s)`);
    
    // Import emergency call service and handle status
    import("./services/emergencyCallService.js").then(({ default: emergencyCallService }) => {
        emergencyCallService.handleCallStatus(CallSid, CallStatus, CallDuration);
    });
    
    res.status(200).send("OK");
});

// Webhook endpoint for MessageBird call status updates
app.post("/messagebird-call-status", (req, res) => {
    const { id, status, duration } = req.body;
    
    console.log(`📞 MessageBird Call Status Update: ${id} - ${status} (${duration}s)`);
    
    // Import MessageBird emergency call service and handle status
    import("./services/emergencyCallServiceMessageBirdREST.js").then(({ default: emergencyCallService }) => {
        emergencyCallService.handleCallStatus(id, status, duration);
    });
    
    res.status(200).send("OK");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    reminderScheduler.start();
});