import { GoogleGenAI } from "@google/genai";
import {
  setMedicineReminderDeclaration,
  setMedicineReminder,
} from "./setMedicineReminder.js";
import { User, Doctor } from "../model/index.js";
import Profile from "../model/profiles.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const functions = {
  set_medicine_reminder: setMedicineReminder,
};

const declarations = [setMedicineReminderDeclaration];

// System prompt to help Gemini understand medicine reminder requests
const systemPrompt = `You are a helpful healthcare assistant for elderly patients. Your main function is to help users set medicine reminders.

When a user provides BOTH a medicine name AND a time in their message, you should use the set_medicine_reminder function to save it to the database.

Examples of messages that should trigger the function:
- "Remind me to take aspirin at 8 AM"
- "Set a reminder for my blood pressure medicine at 9:30 PM"
- "I need to take vitamin D at 7:00 AM daily"

Time format conversion:
- "8 AM" or "8:00 AM" → "08:00"
- "9:30 PM" → "21:30"
- "7:00 AM" → "07:00"

If the user provides incomplete information, ask for the missing details.
For general questions, provide helpful responses without using the function.`;

// Store registration state for users
const userRegistrationState = new Map();

// Store medicine reminder state for users
const medicineReminderState = new Map();

// functionsCalling/gemini.js
export async function processMessage(userMessage, userId, history = []) {
  try {
    // Clean the phone number by removing 'whatsapp:' prefix if present
    const cleanPhoneNumber = userId.replace(/^whatsapp:/, "");
    console.log(
      `📱 Original phone: ${userId}, Cleaned phone: ${cleanPhoneNumber}`
    );

    // First, check if user exists using the new Profile model
    const existingProfile = await Profile.findByMobileNumber(cleanPhoneNumber);

    if (!existingProfile) {
      // User doesn't exist - but this should be handled by the main index.js now
      // Return a message directing them to register properly
      return {
        text: "Please register first by sending: REGISTER [Your Name] | [Age] | [Gender] | [Emergency Contact]\n\nExample: REGISTER John Smith | 65 | male | +919876543210"
      };
    }

    // User exists, proceed with normal message processing
    const messages = [
      // Add system prompt
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "I understand. I'm here to help you set medicine reminders. Please tell me what medicine you need to take and when.",
          },
        ],
      },
      // Ensure all roles from history are valid ('user' or 'model')
      ...history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      // Add the current user message with the 'user' role
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    // Check if user is in medicine reminder flow
    if (medicineReminderState.has(cleanPhoneNumber)) {
      return await handleMedicineReminder(
        cleanPhoneNumber,
        userMessage,
        history
      );
    }

    // Check if user wants to set a medicine reminder
    const reminderKeywords = [
      "remind me to take",
      "set a reminder",
      "medicine reminder",
      "set reminder",
      "remind me",
      "medicine",
      "pill",
      "tablet",
      "medication",
    ];

    const wantsReminder = reminderKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (wantsReminder) {
      // Check if user is already in reminder flow
      if (medicineReminderState.has(cleanPhoneNumber)) {
        return await handleMedicineReminder(
          cleanPhoneNumber,
          userMessage,
          history
        );
      } else {
        // Start new reminder flow
        return await handleMedicineReminder(
          cleanPhoneNumber,
          "start_reminder",
          history
        );
      }
    }

    // First, try to extract medicine name and time from the user message
    const medicineTimePattern =
      /(?:remind me to take|set a reminder for|i need to take|please remind me to take)\s+(.+?)\s+(?:at|by)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i;
    const match = userMessage.match(medicineTimePattern);

    if (match) {
      const medicineName = match[1].trim();
      let timeStr = match[2].trim();

      // Convert time to 24-hour format
      const timeMatch = timeStr.match(
        /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/i
      );
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toUpperCase();

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        const reminderTime = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        console.log(
          "🎯 Extracted medicine:",
          medicineName,
          "time:",
          reminderTime
        );

        // Call the function directly
        const argsWithUserId = {
          userId: cleanPhoneNumber,
          medicineName,
          reminderTime,
        };
        const result = await functions.set_medicine_reminder(argsWithUserId);

        console.log("✅ Function result:", result);
        return { text: result.message };
      }
    }

    // If no pattern match, try Gemini API
    console.log("🔍 No direct pattern match, trying Gemini API...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      tools: [{ functionDeclarations: declarations }],
      tool_config: {
        function_calling_config: {
          mode: "ANY",
        },
      },
    });

    console.log(
      "🔍 Gemini Response finish reason:",
      response.candidates?.[0]?.finishReason
    );

    // Check for function calls
    const functionCalls =
      response.functionCalls || response.candidates?.[0]?.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      console.log("🎯 Function call detected:", call.name);

      const func = functions[call.name];
      if (func) {
        try {
          let callArgs = call.args;
          if (typeof call.args === "string") {
            callArgs = JSON.parse(call.args);
          }

          console.log("📝 Function arguments:", callArgs);
          const argsWithUserId = { ...callArgs, userId: cleanPhoneNumber };
          const result = await func(argsWithUserId);

          console.log("✅ Function result:", result);
          return { text: result.message };
        } catch (err) {
          console.error("❌ Function execution error:", err);
          return { text: "Error processing your request. Please try again." };
        }
      } else {
        return { text: `Function "${call.name}" not found.` };
      }
    }

    // If no function call, extract text response
    const candidateContent = response.candidates?.[0]?.content;
    console.log("📄 Candidate content:", candidateContent);

    if (candidateContent) {
      let plainText = "";

      // Handle different content structures
      if (Array.isArray(candidateContent.parts)) {
        // If content has parts array
        plainText = candidateContent.parts
          .map((part) => part.text || "")
          .join("");
      } else if (candidateContent.text) {
        // If content has direct text property
        plainText = candidateContent.text;
      } else if (Array.isArray(candidateContent)) {
        // If content is directly an array
        plainText = candidateContent.map((part) => part.text || "").join("");
      } else {
        // Fallback: try to stringify the content
        plainText = JSON.stringify(candidateContent);
      }

      console.log("📝 Extracted text:", plainText);

      if (plainText && plainText.trim()) {
        return { text: plainText };
      }
    }

    // If we still don't have a response, provide a helpful message
    console.log("⚠️ No valid response extracted, providing fallback");
    return {
      text: "I understand you want to set a medicine reminder. Please tell me the name of the medicine and what time you need to take it (e.g., 'Remind me to take aspirin at 8:00 AM').",
    };
  } catch (error) {
    console.error("❌ Error in processMessage:", error);
    return {
      text: "I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
    };
  }
}

// OLD REGISTRATION FUNCTION - DISABLED
// This is now handled by the main index.js registration system
/*
async function handleUserRegistration(userId, userMessage, history) {
  console.log("🆕 New user detected, starting registration process...");

  // Get or initialize registration state
  let registrationState = userRegistrationState.get(userId);
  if (!registrationState) {
    registrationState = {
      step: "welcome",
      data: {},
    };
    userRegistrationState.set(userId, registrationState);
  }

  console.log(`📝 Current registration step: ${registrationState.step}`);

  // Handle registration steps
  switch (registrationState.step) {
    case "welcome":
      registrationState.step = "name";
      return {
        text: `Welcome to MediPing! 👋 I'm here to help you manage your medications. Let's get you set up quickly.\n\nWhat's your full name?`,
      };

    case "name":
      registrationState.data.userName = userMessage.trim();
      registrationState.step = "age";
      return {
        text: `Nice to meet you, ${registrationState.data.userName}! How old are you?`,
      };

    case "age":
      const age = parseInt(userMessage.trim());
      if (isNaN(age) || age < 1 || age > 120) {
        return {
          text: `Please provide a valid age (1-120 years).`,
        };
      }
      registrationState.data.age = age;
      registrationState.step = "emergency";
      return {
        text: `Thank you! What's your emergency contact number? (This will be used in case of urgent situations)`,
      };

    case "emergency":
      registrationState.data.emergencyNumber = userMessage.trim();
      registrationState.step = "email";
      return {
        text: `Great! What's your email address? (This is optional - you can type "skip" if you prefer not to share)`,
      };

    case "email":
      if (userMessage.toLowerCase().trim() === "skip") {
        registrationState.data.email = null;
      } else {
        registrationState.data.email = userMessage.trim();
      }
      registrationState.step = "language";
      return {
        text: `What language do you prefer? Please choose from:\n• English\n• Hindi\n• Marathi\n• Gujarati\n• Tamil\n• Telugu\n• Kannada\n• Malayalam\n• Bengali\n• Punjabi\n\nJust type the language name.`,
      };

    case "language":
      registrationState.data.language = userMessage.trim();
      registrationState.step = "doctor";
      return {
        text: `Do you have a doctor? If yes, please provide their name. If not, type "no doctor".`,
      };

    case "doctor":
      if (userMessage.toLowerCase().trim() === "no doctor") {
        registrationState.data.doctorName = null;
        registrationState.step = "complete";
        // Complete registration immediately for no doctor case
        return await completeRegistration(userId, registrationState);
      } else {
        registrationState.data.doctorName = userMessage.trim();
        registrationState.step = "doctorPhone";
        return {
          text: `What's your doctor's phone number?`,
        };
      }

    case "doctorPhone":
      registrationState.data.doctorPhone = userMessage.trim();
      registrationState.step = "doctorSpecialization";
      return {
        text: `What's your doctor's specialization? (e.g., General Medicine, Cardiology, etc.)`,
      };

    case "doctorSpecialization":
      registrationState.data.doctorSpecialization = userMessage.trim();
      registrationState.step = "complete";
      // Complete registration for doctor case
      return await completeRegistration(userId, registrationState);

    case "complete":
      // This should not happen, but handle it gracefully
      return await completeRegistration(userId, registrationState);

    default:
      console.error("❌ Unknown registration step:", registrationState.step);
      return {
        text: `I'm having trouble with the registration process. Please try again or contact support.`,
      };
  }
}
*/

// Handle enhanced medicine reminder process
async function handleMedicineReminder(userId, userMessage, history) {
  console.log("💊 Enhanced medicine reminder flow started...");

  // Get or initialize reminder state
  let reminderState = medicineReminderState.get(userId);
  if (!reminderState) {
    reminderState = {
      step: "medicine_name",
      data: {},
    };
    medicineReminderState.set(userId, reminderState);
  }

  console.log(`📝 Current reminder step: ${reminderState.step}`);

  // Handle reminder steps
  switch (reminderState.step) {
    case "medicine_name":
      // Check if this is a start_reminder trigger
      if (userMessage === "start_reminder") {
        return {
          text: `Great! Let's set up a medicine reminder. What's the name of the medicine you want to be reminded about?`,
        };
      }
      reminderState.data.medicineName = userMessage.trim();
      reminderState.step = "reminder_type";
      return {
        text: `Great! What type of reminder do you want for ${reminderState.data.medicineName}?\n\nPlease choose:\n• One-time (for today/tomorrow/specific date)\n• Daily (every day)\n• Weekly (once a week)\n• Monthly (once a month)\n• Custom range (for specific dates)`,
      };

    case "reminder_type":
      const type = userMessage.toLowerCase().trim();
      if (type.includes("one") || type.includes("time")) {
        reminderState.data.reminderType = "one_time";
        reminderState.step = "one_time_date";
        return {
          text: `When do you want the one-time reminder for ${reminderState.data.medicineName}?\n\nPlease choose:\n• Today\n• Tomorrow\n• Or specify a date (YYYY-MM-DD format, e.g., 2024-01-15)`,
        };
      } else if (type.includes("daily")) {
        reminderState.data.reminderType = "daily";
        reminderState.step = "time";
        return {
          text: `What time do you want to take ${reminderState.data.medicineName} daily?\n\nPlease specify time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
        };
      } else if (type.includes("weekly")) {
        reminderState.data.reminderType = "weekly";
        reminderState.step = "time";
        return {
          text: `What time do you want to take ${reminderState.data.medicineName} weekly?\n\nPlease specify time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
        };
      } else if (type.includes("monthly")) {
        reminderState.data.reminderType = "monthly";
        reminderState.step = "time";
        return {
          text: `What time do you want to take ${reminderState.data.medicineName} monthly?\n\nPlease specify time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
        };
      } else if (type.includes("custom") || type.includes("range")) {
        reminderState.data.reminderType = "custom_range";
        reminderState.step = "start_date";
        return {
          text: `For the custom range reminder, when do you want to start taking ${reminderState.data.medicineName}?\n\nPlease specify start date in YYYY-MM-DD format (e.g., 2024-01-15)`,
        };
      } else {
        return {
          text: `I didn't understand. Please choose:\n• One-time\n• Daily\n• Weekly\n• Monthly\n• Custom range`,
        };
      }

    case "one_time_date":
      const dateInput = userMessage.toLowerCase().trim();
      if (dateInput === "today") {
        reminderState.data.date = new Date().toISOString().split("T")[0];
      } else if (dateInput === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        reminderState.data.date = tomorrow.toISOString().split("T")[0];
      } else {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateInput)) {
          reminderState.data.date = dateInput;
        } else {
          return {
            text: `Please specify a valid date. Choose:\n• Today\n• Tomorrow\n• Or use YYYY-MM-DD format (e.g., 2024-01-15)`,
          };
        }
      }
      reminderState.step = "time";
      return {
        text: `What time do you want to take ${reminderState.data.medicineName} on ${reminderState.data.date}?\n\nPlease specify time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
      };

    case "start_date":
      const startDateInput = userMessage.trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(startDateInput)) {
        reminderState.data.startDate = startDateInput;
        reminderState.step = "end_date";
        return {
          text: `When do you want to stop taking ${reminderState.data.medicineName}?\n\nPlease specify end date in YYYY-MM-DD format (e.g., 2024-02-15)`,
        };
      } else {
        return {
          text: `Please specify a valid start date in YYYY-MM-DD format (e.g., 2024-01-15)`,
        };
      }

    case "end_date":
      const endDateInput = userMessage.trim();
      const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (endDateRegex.test(endDateInput)) {
        reminderState.data.endDate = endDateInput;
        reminderState.step = "time";
        return {
          text: `What time do you want to take ${reminderState.data.medicineName} from ${reminderState.data.startDate} to ${reminderState.data.endDate}?\n\nPlease specify time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
        };
      } else {
        return {
          text: `Please specify a valid end date in YYYY-MM-DD format (e.g., 2024-02-15)`,
        };
      }

    case "time":
      const timeInput = userMessage.trim();
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(timeInput)) {
        reminderState.data.time = timeInput;
        reminderState.step = "notes";
        return {
          text: `Any additional notes about ${reminderState.data.medicineName}? (e.g., "Take with food", "Before breakfast", etc.)\n\nYou can type "no notes" if you don't have any.`,
        };
      } else {
        return {
          text: `Please specify a valid time in HH:MM format (e.g., 08:00 for 8 AM, 21:30 for 9:30 PM)`,
        };
      }

    case "notes":
      if (userMessage.toLowerCase().trim() === "no notes") {
        reminderState.data.notes = null;
      } else {
        reminderState.data.notes = userMessage.trim();
      }
      reminderState.step = "complete";
      return await completeMedicineReminder(userId, reminderState);

    case "complete":
      return await completeMedicineReminder(userId, reminderState);

    default:
      console.error("❌ Unknown reminder step:", reminderState.step);
      return {
        text: `I'm having trouble with the reminder setup. Please try again or contact support.`,
      };
  }
}

// Helper function to complete medicine reminder
async function completeMedicineReminder(userId, reminderState) {
  try {
    console.log("💊 Completing medicine reminder setup...");

    // Call the enhanced setMedicineReminder function
    const argsWithUserId = {
      userId,
      medicineName: reminderState.data.medicineName,
      reminderType: reminderState.data.reminderType,
      time: reminderState.data.time,
      date: reminderState.data.date,
      startDate: reminderState.data.startDate,
      endDate: reminderState.data.endDate,
      frequency: reminderState.data.frequency,
      notes: reminderState.data.notes,
    };

    const result = await functions.set_medicine_reminder(argsWithUserId);

    // Clear reminder state
    medicineReminderState.delete(userId);

    if (result.success) {
      return {
        text: `${result.message}\n\nYou can set more reminders anytime by saying "set a reminder" or "remind me to take medicine".`,
      };
    } else {
      return {
        text: `❌ ${result.message}\n\nPlease try setting the reminder again.`,
      };
    }
  } catch (error) {
    console.error("❌ Error completing medicine reminder:", error);
    return {
      text: `Sorry, there was an error setting up your reminder. Please try again or contact support.`,
    };
  }
}

// Helper function to complete registration
async function completeRegistration(userId, registrationState) {
  try {
    // Clean the phone number to remove 'whatsapp:' prefix if present
    const cleanPhoneNumber = userId.replace(/^whatsapp:/, "");
    console.log(
      `📱 Storing user with cleaned phone number: ${cleanPhoneNumber}`
    );

    let doctorId = null;

    // Create doctor if provided
    if (registrationState.data.doctorName) {
      const doctor = await Doctor.create({
        Name: registrationState.data.doctorName,
        PhoneNumber: registrationState.data.doctorPhone,
        Email: null, // Could be added in future
        Specialization: registrationState.data.doctorSpecialization,
      });
      doctorId = doctor.DoctorID;
      console.log("✅ Doctor created:", doctor.Name);
    }

    // Create user with cleaned phone number
    const newUser = await User.create({
      UserName: registrationState.data.userName,
      PhoneNumber: cleanPhoneNumber, // Store without whatsapp: prefix
      Email: registrationState.data.email,
      EmergencyNumber: registrationState.data.emergencyNumber,
      Age: registrationState.data.age,
      Language: registrationState.data.language,
      DoctorID: doctorId,
    });

    console.log("✅ User registered successfully:", newUser.UserName);

    // Clear registration state
    userRegistrationState.delete(userId);

    return {
      text: `🎉 Welcome to MediPing, ${registrationState.data.userName}! You're all set up.\n\nNow you can set medicine reminders by saying things like:\n• "Remind me to take aspirin at 8:00 AM"\n• "Set a reminder for my blood pressure medicine at 9:30 PM"\n\nWhat would you like to do?`,
    };
  } catch (error) {
    console.error("❌ Registration error:", error);
    return {
      text: `Sorry, there was an error setting up your account. Please try again or contact support.`,
    };
  }
}
